import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Tag,
  Plus,
  Trash2,
  Edit2,
  HelpCircle,
  FolderMinus,
  Check,
  Flame,
  XCircle,
  Briefcase
} from 'lucide-react';
import { useStore } from '../services/firebase';
import { Card, Button, Input, Modal, EmptyState } from '../components/UI';
import LucideIcon from '../components/LucideIcon';
import { Category } from '../types';

const PRESET_ICONS = [
  'Utensils', 'Home', 'Zap', 'Car', 'ShoppingBag', 'Film', 'HeartPulse',
  'GraduationCap', 'Plane', 'Briefcase', 'Laptop', 'TrendingUp', 'Gift',
  'Activity', 'Coffee', 'BookOpen', 'Camera', 'Smartphone', 'Coins'
];

const PRESET_COLORS = [
  { name: 'emerald', class: 'bg-emerald-500 hover:bg-emerald-600' },
  { name: 'blue', class: 'bg-blue-500 hover:bg-blue-600' },
  { name: 'amber', class: 'bg-amber-500 hover:bg-amber-600' },
  { name: 'indigo', class: 'bg-indigo-500 hover:bg-indigo-600' },
  { name: 'pink', class: 'bg-pink-500 hover:bg-pink-600' },
  { name: 'violet', class: 'bg-violet-500 hover:bg-violet-600' },
  { name: 'rose', class: 'bg-rose-500 hover:bg-rose-600' },
  { name: 'sky', class: 'bg-sky-500 hover:bg-sky-600' },
  { name: 'cyan', class: 'bg-cyan-500 hover:bg-cyan-600' },
  { name: 'green', class: 'bg-green-500 hover:bg-green-600' },
  { name: 'teal', class: 'bg-teal-500 hover:bg-teal-600' },
  { name: 'purple', class: 'bg-purple-500 hover:bg-purple-600' },
  { name: 'orange', class: 'bg-orange-500 hover:bg-orange-600' }
];

export default function Categories() {
  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    transactions
  } = useStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Utensils');
  const [selectedColor, setSelectedColor] = useState('emerald');
  const [type, setType] = useState<'income' | 'expense'>('expense');

  // Group categories by type
  const expenseCats = useMemo(() => categories.filter(c => c.type === 'expense'), [categories]);
  const incomeCats = useMemo(() => categories.filter(c => c.type === 'income'), [categories]);

  // Map category to number of transactions referencing it
  const transactionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.forEach(t => {
      counts[t.categoryId] = (counts[t.categoryId] || 0) + 1;
    });
    return counts;
  }, [transactions]);

  const handleOpenAdd = () => {
    setEditingCat(null);
    setName('');
    setSelectedIcon('Utensils');
    setSelectedColor('emerald');
    setType('expense');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    // Cannot edit system categories
    if (cat.userId === 'system') return;

    setEditingCat(cat);
    setName(cat.name);
    setSelectedIcon(cat.icon);
    setSelectedColor(cat.color);
    setType(cat.type as any);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !selectedIcon || !selectedColor) return;

    const data = {
      name,
      icon: selectedIcon,
      color: selectedColor,
      type
    };

    if (editingCat) {
      updateCategory({
        ...editingCat,
        ...data
      });
    } else {
      addCategory(data);
    }

    setIsFormOpen(false);
  };

  const getColorClass = (tailwindColor: string) => {
    const bgClasses: Record<string, string> = {
      emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/10',
      blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border-blue-100 dark:border-blue-500/10',
      amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-100 dark:border-amber-500/10',
      indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/10',
      pink: 'bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400 border-pink-100 dark:border-pink-500/10',
      violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400 border-violet-100 dark:border-violet-500/10',
      rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border-rose-100 dark:border-rose-500/10',
      sky: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400 border-sky-100 dark:border-sky-500/10',
      cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400 border-cyan-100 dark:border-cyan-500/10',
      green: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400 border-green-100 dark:border-green-500/10',
      teal: 'bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400 border-teal-100 dark:border-teal-500/10',
      purple: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 border-purple-100 dark:border-purple-500/10',
      orange: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 border-orange-100 dark:border-orange-500/10',
      slate: 'bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400 border-slate-100 dark:border-slate-500/10'
    };
    return bgClasses[tailwindColor] || bgClasses.emerald;
  };

  return (
    <div className="space-y-8 pb-16">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Category Manager
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Organize transactions into custom taxonomies with dedicated icons.
          </p>
        </div>

        <Button onClick={handleOpenAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md self-start sm:self-auto">
          <Plus className="mr-1.5 h-4.5 w-4.5" /> Define Category
        </Button>
      </div>

      {/* CATEGORY GRID PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Expense Categories */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-500" /> Expense Classifications
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {expenseCats.map((cat) => {
              const usageCount = transactionCounts[cat.id] || 0;
              const isSystem = cat.userId === 'system';

              return (
                <Card
                  key={cat.id}
                  hoverEffect
                  className={`flex justify-between items-center p-4 border ${getColorClass(cat.color)}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-white dark:bg-slate-900 shadow-2xs border border-slate-100/50 dark:border-slate-800/30 flex items-center justify-center">
                      <LucideIcon name={cat.icon} className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{cat.name}</h4>
                      <p className="text-3xs text-slate-400 mt-0.5 font-medium">{usageCount} logged items</p>
                    </div>
                  </div>

                  {!isSystem && (
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1 text-slate-400 hover:text-emerald-600 transition-all rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-3xs"
                        title="Edit classification"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteCategory(cat.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-all rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-3xs"
                        title="Remove classification"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Income Categories */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Income Classifications
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {incomeCats.map((cat) => {
              const usageCount = transactionCounts[cat.id] || 0;
              const isSystem = cat.userId === 'system';

              return (
                <Card
                  key={cat.id}
                  hoverEffect
                  className={`flex justify-between items-center p-4 border ${getColorClass(cat.color)}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-white dark:bg-slate-900 shadow-2xs border border-slate-100/50 dark:border-slate-800/30 flex items-center justify-center">
                      <LucideIcon name={cat.icon} className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{cat.name}</h4>
                      <p className="text-3xs text-slate-400 mt-0.5 font-medium">{usageCount} logged items</p>
                    </div>
                  </div>

                  {!isSystem && (
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1 text-slate-400 hover:text-emerald-600 transition-all rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-3xs"
                        title="Edit classification"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteCategory(cat.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-all rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-3xs"
                        title="Remove classification"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

      </div>

      {/* CRUD CATEGORY FORM DIALOG */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingCat ? 'Modify Category' : 'Create Custom Category'} size="md">
        <form onSubmit={handleFormSubmit} className="space-y-5">
          
          <div className="flex bg-slate-50 dark:bg-slate-950 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                type === 'expense'
                  ? 'bg-white dark:bg-slate-900 shadow-sm text-rose-600'
                  : 'text-slate-400'
              }`}
            >
              Expense Type
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                type === 'income'
                  ? 'bg-white dark:bg-slate-900 shadow-sm text-emerald-600'
                  : 'text-slate-400'
              }`}
            >
              Income Type
            </button>
          </div>

          <Input
            label="Category Name"
            placeholder="e.g. Subscriptions, Consulting"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          {/* Icon Selector list */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Choose Vector Icon
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-9 gap-2 max-h-36 overflow-y-auto p-1.5 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950">
              {PRESET_ICONS.map(ic => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setSelectedIcon(ic)}
                  className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${
                    selectedIcon === ic
                      ? 'bg-emerald-600 text-white'
                      : 'hover:bg-slate-100 text-slate-500'
                  }`}
                >
                  <LucideIcon name={ic} className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Color Selector list */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Choose Color Theme
            </label>
            <div className="flex flex-wrap gap-2.5 p-1.5 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950">
              {PRESET_COLORS.map(c => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setSelectedColor(c.name)}
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-white font-bold transition-all ${c.class} ${
                    selectedColor === c.name ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900' : ''
                  }`}
                >
                  {selectedColor === c.name && <Check className="h-3 w-3" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Category
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
