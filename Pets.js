import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Camera, PawPrint } from 'lucide-react';
import { usePetsStore } from '../store';
import { Modal, Button, Input, Select, Textarea, Card, SkeletonCard, EmptyState, Badge } from '../components/ui';
import { SPECIES, PET_COLORS } from '../utils/constants';
import { toast } from 'react-toastify';

const defaultForm = {
  name: '', species: 'dog', breed: '',
  age: { years: 0, months: 0 },
  weight: { value: '', unit: 'kg' },
  notes: '', photo: '', color: PET_COLORS[0],
};

function PetAvatar({ pet, size = 'md' }) {
  const sizes = { sm: 'w-10 h-10 text-xl', md: 'w-16 h-16 text-3xl', lg: 'w-24 h-24 text-5xl' };
  const speciesIcon = SPECIES[pet.species]?.icon || '🐾';

  return (
    <div
      className={`${sizes[size]} rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden`}
      style={{ backgroundColor: pet.color + '22', border: `2px solid ${pet.color}33` }}
    >
      {pet.photo
        ? <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover" />
        : speciesIcon
      }
    </div>
  );
}

function PetForm({ initial, onSubmit, onClose, loading }) {
  const [form, setForm] = useState(initial || defaultForm);
  const [errors, setErrors] = useState({});
  const fileRef = useRef();

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const setNested = (parent, key, val) => setForm((f) => ({ ...f, [parent]: { ...f[parent], [key]: val } }));

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Photo must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => set('photo', ev.target.result);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Photo + Color */}
      <div className="flex items-center gap-5">
        <div className="relative">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl overflow-hidden cursor-pointer"
            style={{ backgroundColor: form.color + '22', border: `2px solid ${form.color}44` }}
            onClick={() => fileRef.current?.click()}
          >
            {form.photo
              ? <img src={form.photo} alt="pet" className="w-full h-full object-cover" />
              : SPECIES[form.species]?.icon || '🐾'
            }
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center shadow-lg"
          >
            <Camera size={12} className="text-white" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </div>

        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Avatar color</p>
          <div className="flex gap-2 flex-wrap">
            {PET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set('color', c)}
                className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  outline: form.color === c ? `2px solid ${c}` : 'none',
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Pet Name *" placeholder="Buddy" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
        <Select label="Species" value={form.species} onChange={(e) => set('species', e.target.value)}>
          {Object.entries(SPECIES).map(([k, v]) => (
            <option key={k} value={k}>{v.icon} {v.label}</option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Breed (optional)" placeholder="Golden Retriever" value={form.breed} onChange={(e) => set('breed', e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <Input label="Age (yrs)" type="number" min="0" max="30" value={form.age.years} onChange={(e) => setNested('age', 'years', Number(e.target.value))} />
          <Input label="Months" type="number" min="0" max="11" value={form.age.months} onChange={(e) => setNested('age', 'months', Number(e.target.value))} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Weight" type="number" min="0" step="0.1" placeholder="5.2" value={form.weight.value} onChange={(e) => setNested('weight', 'value', e.target.value)} />
        <Select label="Unit" value={form.weight.unit} onChange={(e) => setNested('weight', 'unit', e.target.value)}>
          <option value="kg">kg</option>
          <option value="lbs">lbs</option>
        </Select>
      </div>

      <Textarea label="Notes" placeholder="Allergies, special needs, vet info..." value={form.notes} onChange={(e) => set('notes', e.target.value)} />

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" loading={loading} className="flex-1">
          {initial ? 'Save Changes' : 'Add Pet'}
        </Button>
      </div>
    </form>
  );
}

export default function Pets() {
  const { pets, fetchPets, addPet, updatePet, removePet, isLoading } = usePetsStore();
  const [modalState, setModalState] = useState({ open: false, mode: 'add', pet: null });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { fetchPets(); }, []);

  const openAdd = () => setModalState({ open: true, mode: 'add', pet: null });
  const openEdit = (pet) => setModalState({ open: true, mode: 'edit', pet });
  const closeModal = () => setModalState({ open: false, mode: 'add', pet: null });

  const handleSubmit = async (form) => {
    setActionLoading(true);
    const result = modalState.mode === 'add'
      ? await addPet(form)
      : await updatePet(modalState.pet._id, form);
    setActionLoading(false);
    if (result.success) {
      toast.success(modalState.mode === 'add' ? '🐾 Pet added!' : 'Pet updated!');
      closeModal();
    } else {
      toast.error(result.error);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    const result = await removePet(deleteConfirm._id);
    setActionLoading(false);
    if (result.success) { toast.success('Pet removed'); setDeleteConfirm(null); }
    else toast.error(result.error);
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Pets</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{pets.length} pet{pets.length !== 1 ? 's' : ''} registered</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={openAdd}>Add Pet</Button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : pets.length === 0 ? (
        <EmptyState
          icon="🐾"
          title="No pets yet"
          description="Add your first furry friend to start managing their care schedule."
          action={<Button icon={<Plus size={16} />} onClick={openAdd}>Add your first pet</Button>}
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {pets.map((pet) => (
            <motion.div
              key={pet._id}
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-5 h-full">
                <div className="flex items-start justify-between mb-4">
                  <PetAvatar pet={pet} size="md" />
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(pet)}
                      className="p-2 rounded-xl text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(pet)}
                      className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-semibold text-gray-900 dark:text-white">{pet.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize mb-3">
                  {SPECIES[pet.species]?.label || pet.species}
                  {pet.breed && ` · ${pet.breed}`}
                </p>

                <div className="flex gap-2 flex-wrap mb-4">
                  {(pet.age?.years > 0 || pet.age?.months > 0) && (
                    <Badge color="#6366f1" bg="#eef2ff">
                      {pet.age.years > 0 ? `${pet.age.years}y` : ''}{pet.age.months > 0 ? ` ${pet.age.months}m` : ''}
                    </Badge>
                  )}
                  {pet.weight?.value && (
                    <Badge color="#10b981" bg="#d1fae5">
                      {pet.weight.value} {pet.weight.unit}
                    </Badge>
                  )}
                </div>

                {pet.notes && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2 mb-4">{pet.notes}</p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                  {[
                    { label: 'Total', value: pet.stats?.totalTasks ?? 0 },
                    { label: 'Done today', value: pet.stats?.completedToday ?? 0 },
                    { label: 'Due today', value: pet.stats?.pendingToday ?? 0 },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
                      <p className="text-xs text-gray-400">{label}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalState.open}
        onClose={closeModal}
        title={modalState.mode === 'add' ? 'Add New Pet' : `Edit ${modalState.pet?.name}`}
        size="md"
      >
        <PetForm
          initial={modalState.pet}
          onSubmit={handleSubmit}
          onClose={closeModal}
          loading={actionLoading}
        />
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Remove Pet" size="sm">
        <div className="text-center">
          <div className="text-5xl mb-4">{SPECIES[deleteConfirm?.species]?.icon || '🐾'}</div>
          <p className="text-gray-700 dark:text-gray-300 mb-2">
            Are you sure you want to remove <strong>{deleteConfirm?.name}</strong>?
          </p>
          <p className="text-sm text-gray-400 mb-6">This will also remove all their scheduled tasks.</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1">Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={actionLoading} className="flex-1">Remove</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
