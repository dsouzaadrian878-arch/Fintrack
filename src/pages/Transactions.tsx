import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  ArrowUpDown,
  Plus,
  Edit2,
  Trash2,
  FileSpreadsheet,
  AlertOctagon,
  Tag,
  ArrowDownCircle,
  ArrowUpCircle,
  Filter,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { useStore } from '../services/firebase';
import { Card, Button, Input, Modal, EmptyState } from '../components/UI';
import LucideIcon from '../components/LucideIcon';
import { Transaction } from '../types';

export default function Transactions() {
  const {
    transactions,
    categories,
    settings,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction
  } = useStore();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [deletingTxnId, setDeletingTxnId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const currencySymbol = useMemo(() => {
    if (!settings) return 'Rs';
    const c = settings.currency;
    if (c === 'EUR') return '€';
    if (c === 'GBP') return '£';
    if (c === 'INR') return 'Rs';
    if (c === 'JPY') return '¥';
    return 'Rs';
  }, [settings]);

  // Unique list of tags for optional filter/display
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    transactions.forEach(t => t.tags?.forEach(tag => tagsSet.add(tag)));
    return Array.from(tagsSet);
  }, [transactions]);

  // Unique list of payment methods in user's transactions
  const uniquePaymentMethods = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => set.add(t.paymentMethod));
    return Array.from(set);
  }, [transactions]);

  // Filtered & Sorted Transactions
  const filteredTxns = useMemo(() => {
    let result = [...transactions];

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        t =>
          t.title.toLowerCase().includes(q) ||
          t.notes?.toLowerCase().includes(q) ||
          t.tags?.some(tag => tag.toLowerCase().includes(q))
      );
    }

    // Type Filter
    if (filterType !== 'all') {
      result = result.filter(t => t.type === filterType);
    }

    // Category Filter
    if (filterCategory !== 'all') {
      result = result.filter(t => t.categoryId === filterCategory);
    }

    // Payment Filter
    if (filterPayment !== 'all') {
      result = result.filter(t => t.paymentMethod === filterPayment);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortField === 'date') {
        return sortOrder === 'desc'
          ? b.date.localeCompare(a.date)
          : a.date.localeCompare(b.date);
      } else {
        return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
      }
    });

    return result;
  }, [transactions, search, filterType, filterCategory, filterPayment, sortField, sortOrder]);

  // Paginated chunk
  const paginatedTxns = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredTxns.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredTxns, currentPage]);

  const totalPages = Math.ceil(filteredTxns.length / itemsPerPage);

  const handleOpenAdd = () => {
    setEditingTxn(null);
    setTitle('');
    setAmount('');
    setType('expense');
    setCategoryId('');
    setPaymentMethod('Credit Card');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setTagsInput('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (txn: Transaction) => {
    setEditingTxn(txn);
    setTitle(txn.title);
    setAmount(txn.amount.toString());
    setType(txn.type);
    setCategoryId(txn.categoryId);
    setPaymentMethod(txn.paymentMethod);
    setDate(txn.date);
    setNotes(txn.notes || '');
    setTagsInput(txn.tags?.join(', ') || '');
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !categoryId) return;

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const txnData = {
      title,
      amount: parseFloat(amount),
      type,
      categoryId,
      paymentMethod,
      date,
      notes: notes || undefined,
      tags: tags.length > 0 ? tags : undefined
    };

    try {
      if (editingTxn) {
        await updateTransaction({
          ...editingTxn,
          ...txnData
        });
      } else {
        await addTransaction(txnData);
      }
      setIsFormOpen(false);
    } catch {
      // Keep the modal open so the database error remains visible to the user.
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingTxnId) {
      deleteTransaction(deletingTxnId);
      setDeletingTxnId(null);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Asset Ledger
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete searchable ledger auditing your wealth inflows and outflows.
          </p>
        </div>

        <Button onClick={handleOpenAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md self-start sm:self-auto">
          <Plus className="mr-1.5 h-4.5 w-4.5" /> Log Transaction
        </Button>
      </div>

      {/* FILTER & CONTROL BAR */}
      <Card className="p-4 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Smart Search */}
          <div className="flex-1">
            <Input
              placeholder="Search ledger entries, tags, or notes..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              icon={<Search className="h-4 w-4" />}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Type */}
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value as any); setCurrentPage(1); }}
              className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 outline-none font-medium text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Cashflow Types</option>
              <option value="income">Inflow Only</option>
              <option value="expense">Outflow Only</option>
            </select>

            {/* Filter Category */}
            <select
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
              className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 outline-none font-medium text-slate-700 dark:text-slate-300 max-w-[150px]"
            >
              <option value="all">All Sectors</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Sort Toggle Trigger */}
            <button
              onClick={() => {
                setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
              }}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-all"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
            </button>
          </div>
        </div>
      </Card>

      {/* LEDGER TABLE GRID */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800/65 text-slate-400 dark:text-slate-500 text-3xs font-bold tracking-widest uppercase">
                <th className="px-6 py-4">Cashflow Item</th>
                <th className="px-6 py-4">Sector Category</th>
                <th className="px-6 py-4">Settlement System</th>
                <th className="px-6 py-4">Effective Date</th>
                <th className="px-6 py-4 text-right">Value</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40 text-xs text-slate-700 dark:text-slate-300">
              {paginatedTxns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12">
                    <EmptyState
                      icon={<BookOpen className="h-8 w-8 text-slate-400" />}
                      title="No Cashflow Found"
                      description="No records matched your ledger filter settings."
                      action={
                        <Button size="sm" onClick={handleOpenAdd}>
                          Add Record
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                paginatedTxns.map((t) => {
                  const cat = categories.find(c => c.id === t.categoryId);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10 transition-colors">
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                            t.type === 'income'
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          }`}>
                            <LucideIcon name={cat?.icon || 'DollarSign'} className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">{t.title}</span>
                            {t.tags && t.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {t.tags.map(tag => (
                                  <span key={tag} className="inline-flex items-center text-3xs font-medium px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded">
                                    <Tag className="h-2 w-2 mr-0.5" /> {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className="font-semibold text-slate-900 dark:text-slate-300">{cat?.name || 'Uncategorized'}</span>
                      </td>
                      <td className="px-6 py-4.5 font-medium text-slate-500 dark:text-slate-400">
                        {t.paymentMethod}
                      </td>
                      <td className="px-6 py-4.5 font-semibold text-slate-950 dark:text-slate-400">
                        {t.date}
                      </td>
                      <td className="px-6 py-4.5 text-right font-extrabold text-sm">
                        <span className={t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}>
                          {t.type === 'income' ? '+' : '-'} {currencySymbol} {t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 shadow-2xs transition-all inline-flex"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingTxnId(t.id)}
                          className="p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 shadow-2xs transition-all inline-flex"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION PANEL */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50/40 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <span className="text-2xs text-slate-500 dark:text-slate-400">
              Showing page <b>{currentPage}</b> of <b>{totalPages}</b> ({filteredTxns.length} entries total)
            </span>

            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-2"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* CRUD TRANSACTION FORM MODAL */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingTxn ? 'Edit Entry' : 'New Ledger Entry'} size="md">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-600 dark:border-rose-800 dark:bg-rose-950/20 dark:text-rose-400">{error}</div>}
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
              Outflow (Expense)
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
              Inflow (Income)
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Transaction Title"
              placeholder="e.g. Rent Payment"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Input
              label={`Amount (${currencySymbol})`}
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2.5 outline-none text-slate-900 dark:text-slate-100"
                required
              >
                <option value="">Select Category</option>
                {categories
                  .filter(c => c.type === type || c.type === 'all')
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2.5 outline-none text-slate-900 dark:text-slate-100"
              >
                <option value="Cash">Cash</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="PayPal">PayPal</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Transaction Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <Input
              label="Tags"
              placeholder="e.g. dining, fastfood"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Notes
            </label>
            <textarea
              placeholder="Add payment remarks..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2.5 outline-none text-slate-900 dark:text-slate-100"
              rows={2}
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Entries
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal isOpen={deletingTxnId !== null} onClose={() => setDeletingTxnId(null)} title="Delete Entry" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertOctagon className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Confirm Removal</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to permanently remove this transaction from your portfolio? This cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3.5 pt-3">
            <Button variant="ghost" onClick={() => setDeletingTxnId(null)}>
              Keep Entry
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm}>
              Yes, Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
