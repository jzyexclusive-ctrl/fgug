import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertCircle, TrendingUp, Plus, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTasksStore, usePetsStore, useAuthStore } from '../store';
import { Card, SkeletonCard, EmptyState, Button, Badge } from '../components/ui';
import { CATEGORIES, formatTime, getRelativeDay, getStatusStyle } from '../utils/constants';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.07 } } },
  item: { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } },
};

function StatCard({ label, value, icon: Icon, color, bg, delay = 0 }) {
  return (
    <motion.div
      variants={stagger.item}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex items-center gap-4"
    >
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value ?? '—'}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </motion.div>
  );
}

function TaskRow({ task, onComplete }) {
  const cat = CATEGORIES[task.category] || CATEGORIES.other;
  const status = getStatusStyle(task.status);
  const isOverdue = task.status === 'overdue';
  const isDone = task.status === 'completed';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={`flex items-center gap-4 p-4 rounded-xl transition-all
        ${isDone ? 'opacity-60' : ''}
        ${isOverdue ? 'bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
    >
      {/* Complete button */}
      <button
        onClick={() => !isDone && onComplete(task._id)}
        disabled={isDone}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
          ${isDone
            ? 'bg-teal-500 border-teal-500 text-white'
            : isOverdue
              ? 'border-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
              : 'border-gray-300 dark:border-gray-600 hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20'
          }`}
      >
        {isDone && <CheckCircle2 size={14} />}
      </button>

      {/* Category icon */}
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
        style={{ backgroundColor: cat.bg }}
      >
        {cat.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isDone ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
          {task.title}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {task.pet?.name} · {formatTime(task.scheduledAt)}
        </p>
      </div>

      {/* Status badge */}
      <Badge color={status.color} bg={status.bg} className="hidden sm:flex flex-shrink-0">
        {status.label}
      </Badge>
    </motion.div>
  );
}

export default function Dashboard() {
  const { summary, fetchSummary, completeTask, isLoading } = useTasksStore();
  const { pets, fetchPets } = usePetsStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSummary();
    fetchPets();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const todayComplete = summary?.today?.filter((t) => t.status === 'completed').length || 0;
  const todayTotal = summary?.today?.length || 0;
  const progress = todayTotal > 0 ? Math.round((todayComplete / todayTotal) * 100) : 0;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {greeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </motion.div>

      {/* Progress Bar */}
      {todayTotal > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-6 text-white relative overflow-hidden"
        >
          <div className="absolute right-4 top-4 opacity-20">
            <Zap size={80} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium opacity-90">Today's Progress</p>
                <p className="text-3xl font-bold mt-1">{todayComplete} <span className="text-xl font-normal opacity-70">/ {todayTotal} tasks</span></p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">{progress}%</p>
                <p className="text-xs opacity-70">Complete</p>
              </div>
            </div>
            <div className="bg-white/30 rounded-full h-2 mt-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                className="bg-white h-full rounded-full"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <motion.div
        variants={stagger.container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard label="Total Tasks" value={summary?.stats?.total} icon={TrendingUp} color="#6366f1" bg="#eef2ff" />
        <StatCard label="Completed" value={summary?.stats?.completed} icon={CheckCircle2} color="#10b981" bg="#d1fae5" />
        <StatCard label="Pending" value={summary?.stats?.pending} icon={Clock} color="#f59e0b" bg="#fef3c7" />
        <StatCard label="Overdue" value={summary?.stats?.overdue} icon={AlertCircle} color="#ef4444" bg="#fee2e2" />
      </motion.div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Tasks */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Today's Tasks</h2>
            <Button
              variant="ghost"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => navigate('/schedule')}
            >
              Add Task
            </Button>
          </div>

          <Card className="overflow-hidden">
            {isLoading && !summary ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : summary?.today?.length === 0 ? (
              <EmptyState
                icon="✅"
                title="All clear for today!"
                description="No tasks scheduled. Add some to keep your pets happy."
                action={
                  <Button icon={<Plus size={16} />} onClick={() => navigate('/schedule')}>
                    Schedule a task
                  </Button>
                }
              />
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {summary?.today?.map((task) => (
                  <TaskRow key={task._id} task={task} onComplete={completeTask} />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar: Pets + Upcoming */}
        <div className="space-y-6">
          {/* Pets Quick View */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">My Pets</h2>
              <button
                onClick={() => navigate('/pets')}
                className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
              >
                View all
              </button>
            </div>

            {pets.length === 0 ? (
              <Card className="p-5 text-center">
                <div className="text-3xl mb-2">🐾</div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No pets yet</p>
                <Button size="sm" icon={<Plus size={14} />} onClick={() => navigate('/pets')}>
                  Add a pet
                </Button>
              </Card>
            ) : (
              <div className="space-y-2">
                {pets.slice(0, 4).map((pet) => (
                  <motion.div
                    key={pet._id}
                    whileHover={{ scale: 1.01 }}
                    className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 cursor-pointer"
                    onClick={() => navigate('/pets')}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ backgroundColor: pet.color + '22' }}
                    >
                      {pet.photo
                        ? <img src={pet.photo} alt={pet.name} className="w-full h-full rounded-xl object-cover" />
                        : ['🐕','🐈','🦜','🐇','🐹','🐠','🦎','🐾'][['dog','cat','bird','rabbit','hamster','fish','reptile','other'].indexOf(pet.species)] || '🐾'
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{pet.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{pet.species}</p>
                    </div>
                    {pet.stats?.pendingToday > 0 && (
                      <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                        {pet.stats.pendingToday} due
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming */}
          {summary?.upcoming?.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Coming Up</h2>
              <div className="space-y-2">
                {summary.upcoming.slice(0, 4).map((task) => {
                  const cat = CATEGORIES[task.category] || CATEGORIES.other;
                  return (
                    <div
                      key={task._id}
                      className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800"
                    >
                      <div className="text-base">{cat.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{task.title}</p>
                        <p className="text-xs text-gray-400">{getRelativeDay(task.scheduledAt)} · {formatTime(task.scheduledAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
