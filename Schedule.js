import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, List, ChevronLeft, ChevronRight, Trash2, Edit2, CheckCircle2, Filter, X } from 'lucide-react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTasksStore, usePetsStore } from '../store';
import { Modal, Button, Input, Select, Textarea, Card, EmptyState, Badge } from '../components/ui';
import { CATEGORIES, SPECIES, formatTime, getStatusStyle } from '../utils/constants';
import { toast } from 'react-toastify';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';

const defaultTask = {
  title: '', category: 'feeding', pet: '',
  scheduledAt: '', duration: 30, priority: 'medium',
  description: '', notes: '',
  recurrence: { type: 'none', interval: 1, daysOfWeek: [], endDate: '' },
  reminder: { enabled: true, minutesBefore: 10 },
};

// ─── Task Form ────────────────────────────────────────────────────
function TaskForm({ initial, onSubmit, onClose, loading, pets }) {
  const [form, setForm] = useState(() => {
    if (initial) return { ...defaultTask, ...initial, scheduledAt: initial.scheduledAt ? format(new Date(initial.scheduledAt), "yyyy-MM-dd'T'HH:mm") : '' };
    return { ...defaultTask, scheduledAt: format(new Date(), "yyyy-MM-dd'T'HH:mm") };
  });
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setNested = (parent, k, v) => setForm((f) => ({ ...f, [parent]: { ...f[parent], [k]: v } }));

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.pet) e.pet = 'Please select a pet';
    if (!form.scheduledAt) e.scheduledAt = 'Date & time is required';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit({ ...form, scheduledAt: new Date(form.scheduledAt).toISOString() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input label="Task Title *" placeholder="e.g., Morning feeding" value={form.title} onChange={(e) => set('title', e.target.value)} error={errors.title} />

      <div className="grid grid-cols-2 gap-4">
        <Select label="Category" value={form.category} onChange={(e) => set('category', e.target.value)}>
          {Object.entries(CATEGORIES).map(([k, v]) => (
            <option key={k} value={k}>{v.icon} {v.label}</option>
          ))}
        </Select>
        <Select label="Pet *" value={form.pet} onChange={(e) => set('pet', e.target.value)} error={errors.pet}>
          <option value="">Select a pet</option>
          {pets.map((p) => (
            <option key={p._id} value={p._id}>{SPECIES[p.species]?.icon} {p.name}</option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Date & Time *" type="datetime-local" value={form.scheduledAt} onChange={(e) => set('scheduledAt', e.target.value)} error={errors.scheduledAt} />
        <Input label="Duration (mins)" type="number" min="1" max="480" value={form.duration} onChange={(e) => set('duration', Number(e.target.value))} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select label="Priority" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
          <option value="low">🟢 Low</option>
          <option value="medium">🟡 Medium</option>
          <option value="high">🔴 High</option>
        </Select>
        <Select label="Recurrence" value={form.recurrence.type} onChange={(e) => setNested('recurrence', 'type', e.target.value)}>
          <option value="none">No repeat</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Bi-weekly</option>
          <option value="monthly">Monthly</option>
        </Select>
      </div>

      {/* Reminder */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <div className="flex items-center gap-2 flex-1">
          <input
            type="checkbox"
            id="reminder"
            checked={form.reminder.enabled}
            onChange={(e) => setNested('reminder', 'enabled', e.target.checked)}
            className="w-4 h-4 accent-teal-500 cursor-pointer"
          />
          <label htmlFor="reminder" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">Remind me</label>
        </div>
        {form.reminder.enabled && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="60"
              value={form.reminder.minutesBefore}
              onChange={(e) => setNested('reminder', 'minutesBefore', Number(e.target.value))}
              className="w-16 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-500">min before</span>
          </div>
        )}
      </div>

      <Textarea label="Notes" placeholder="Additional notes..." value={form.notes} onChange={(e) => set('notes', e.target.value)} />

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" loading={loading} className="flex-1">
          {initial ? 'Save Changes' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
}

// ─── Sortable Task Card ──────────────────────────────────────────
function SortableTaskCard({ task, onComplete, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const cat = CATEGORIES[task.category] || CATEGORIES.other;
  const status = getStatusStyle(task.status);
  const isDone = task.status === 'completed';

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <motion.div
        layout
        className={`flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-2xl border transition-all
          ${isDone ? 'opacity-60 border-gray-100 dark:border-gray-800' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm'}
          ${task.status === 'overdue' ? '!border-red-200 dark:!border-red-900/50 bg-red-50/30 dark:bg-red-900/5' : ''}`}
      >
        {/* Drag handle */}
        <div {...listeners} className="cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-700 hover:text-gray-400 transition-colors flex-shrink-0">
          <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
            <circle cx="2" cy="2" r="1.5" /><circle cx="8" cy="2" r="1.5" />
            <circle cx="2" cy="8" r="1.5" /><circle cx="8" cy="8" r="1.5" />
            <circle cx="2" cy="14" r="1.5" /><circle cx="8" cy="14" r="1.5" />
          </svg>
        </div>

        {/* Complete button */}
        <button
          onClick={() => !isDone && onComplete(task._id)}
          disabled={isDone}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
            ${isDone ? 'bg-teal-500 border-teal-500 text-white' : 'border-gray-300 dark:border-gray-600 hover:border-teal-400'}`}
        >
          {isDone && <CheckCircle2 size={14} />}
        </button>

        {/* Category */}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: cat.bg }}>
          {cat.icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isDone ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
            {task.title}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {task.pet?.name} · {formatTime(task.scheduledAt)}
            {task.duration && ` · ${task.duration}min`}
          </p>
        </div>

        {/* Status + actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge color={status.color} bg={status.bg} className="hidden sm:flex">{status.label}</Badge>
          <button onClick={() => onEdit(task)} className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all">
            <Edit2 size={14} />
          </button>
          <button onClick={() => onDelete(task)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
            <Trash2 size={14} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Week Calendar ────────────────────────────────────────────────
function WeekCalendar({ selectedDate, onSelectDate, tasks }) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <Card className="p-4 mb-6">
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayTasks = tasks.filter((t) => isSameDay(new Date(t.scheduledAt), day));
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={`flex flex-col items-center p-2 rounded-xl transition-all
                ${isSelected ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
                ${isToday && !isSelected ? 'ring-2 ring-teal-400 ring-offset-1 dark:ring-offset-gray-900' : ''}`}
            >
              <span className={`text-xs font-medium mb-1 ${isSelected ? 'text-teal-100' : 'text-gray-400 dark:text-gray-500'}`}>
                {format(day, 'EEE')}
              </span>
              <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                {format(day, 'd')}
              </span>
              {dayTasks.length > 0 && (
                <div className={`mt-1 flex gap-0.5`}>
                  {dayTasks.slice(0, 3).map((t, i) => (
                    <div
                      key={i}
                      className="w-1 h-1 rounded-full"
                      style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.7)' : CATEGORIES[t.category]?.color || '#6b7280' }}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Main Schedule Page ───────────────────────────────────────────
export default function Schedule() {
  const { tasks, fetchTasks, createTask, updateTask, completeTask, deleteTask, reorderTasks, isLoading } = useTasksStore();
  const { pets, fetchPets } = usePetsStore();
  const [viewMode, setViewMode] = useState('list');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const [modalState, setModalState] = useState({ open: false, mode: 'add', task: null });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterPet, setFilterPet] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => { fetchPets(); }, []);

  useEffect(() => {
    fetchTasks({ date: format(selectedDate, 'yyyy-MM-dd') });
  }, [selectedDate]);

  const filteredTasks = tasks.filter((t) => {
    if (filterPet && t.pet?._id !== filterPet) return false;
    if (filterCat && t.category !== filterCat) return false;
    return true;
  });

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldIdx = tasks.findIndex((t) => t._id === active.id);
    const newIdx = tasks.findIndex((t) => t._id === over.id);
    reorderTasks(arrayMove(tasks, oldIdx, newIdx));
  };

  const handleSubmit = async (form) => {
    setActionLoading(true);
    const result = modalState.mode === 'add'
      ? await createTask(form)
      : await updateTask(modalState.task._id, form);
    setActionLoading(false);
    if (result.success) {
      toast.success(modalState.mode === 'add' ? '✅ Task created!' : 'Task updated!');
      setModalState({ open: false, mode: 'add', task: null });
      fetchTasks({ date: format(selectedDate, 'yyyy-MM-dd') });
    } else {
      toast.error(result.error);
    }
  };

  const handleComplete = async (id) => {
    const result = await completeTask(id);
    if (result.success) toast.success('🎉 Task completed!');
  };

  const handleDelete = async () => {
    setActionLoading(true);
    const result = await deleteTask(deleteConfirm._id);
    setActionLoading(false);
    if (result.success) { toast.success('Task deleted'); setDeleteConfirm(null); }
  };

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i + weekOffset * 7)
  );

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Schedule</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {format(selectedDate, 'EEEE, MMMM d')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {[['list', <List size={15} />], ['calendar', <Calendar size={15} />]].map(([mode, icon]) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${viewMode === mode ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
              >
                {icon}
                <span className="hidden sm:inline capitalize">{mode}</span>
              </button>
            ))}
          </div>
          <Button icon={<Plus size={16} />} onClick={() => setModalState({ open: true, mode: 'add', task: null })}>
            <span className="hidden sm:inline">Add Task</span>
          </Button>
        </div>
      </div>

      {/* Week Calendar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setWeekOffset((w) => w - 1)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {format(weekDays[0], 'MMM d')} – {format(weekDays[6], 'MMM d, yyyy')}
          </span>
          <button onClick={() => setWeekOffset((w) => w + 1)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400">
            <ChevronRight size={18} />
          </button>
        </div>
        <WeekCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} tasks={tasks} />
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <Select value={filterPet} onChange={(e) => setFilterPet(e.target.value)} className="w-auto text-xs !py-1.5 !px-3">
          <option value="">All pets</option>
          {pets.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </Select>
        <Select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="w-auto text-xs !py-1.5 !px-3">
          <option value="">All categories</option>
          {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
        </Select>
        {(filterPet || filterCat) && (
          <button
            onClick={() => { setFilterPet(''); setFilterCat(''); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Task list with DnD */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 animate-pulse" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={CATEGORIES[filterCat]?.icon || '📅'}
          title="No tasks for this day"
          description="Schedule something to keep your pet happy and healthy."
          action={
            <Button icon={<Plus size={16} />} onClick={() => setModalState({ open: true, mode: 'add', task: null })}>
              Add Task
            </Button>
          }
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={({ active }) => setActiveId(active.id)}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={filteredTasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              <AnimatePresence>
                {filteredTasks.map((task) => (
                  <SortableTaskCard
                    key={task._id}
                    task={task}
                    onComplete={handleComplete}
                    onEdit={(t) => setModalState({ open: true, mode: 'edit', task: t })}
                    onDelete={setDeleteConfirm}
                  />
                ))}
              </AnimatePresence>
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Task Modal */}
      <Modal
        isOpen={modalState.open}
        onClose={() => setModalState({ open: false, mode: 'add', task: null })}
        title={modalState.mode === 'add' ? 'New Task' : 'Edit Task'}
        size="md"
      >
        {pets.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🐾</div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Add a pet first before scheduling tasks.</p>
            <Button onClick={() => setModalState({ open: false })}>Go to Pets</Button>
          </div>
        ) : (
          <TaskForm
            initial={modalState.task}
            onSubmit={handleSubmit}
            onClose={() => setModalState({ open: false, mode: 'add', task: null })}
            loading={actionLoading}
            pets={pets}
          />
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Task" size="sm">
        <div className="text-center">
          <div className="text-5xl mb-4">🗑️</div>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Delete "<strong>{deleteConfirm?.title}</strong>"? This can't be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1">Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={actionLoading} className="flex-1">Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
