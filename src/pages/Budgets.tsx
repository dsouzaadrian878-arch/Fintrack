import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Wallet,
  Plus,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Trash2,
  Coins,
  History,
  CalendarDays,
  Gauge
} from 'lucide-react';
import { useStore } from '../store';
import { Card, Button, Input, Modal, EmptyState } from '../components/UI';
import LucideIcon from '../components/LucideIcon';

export default function Budgets() {
  const {
    transactions,
    categories,
    budgets,
    settings,
    saveBudget,
    deleteBudget
  } = useStore();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');

  const date = new Date();
  const currentMonth = date.getMonth();
  const currentYear = date.getFullYear();

  const currencySymbol = useMemo(() => {
    if (!settings) return '$';
    const c = settings.currency;
    if (c === 'EUR') return '€';
    if (c === 'GBP') return '£';
    if (c === 'INR') return '₹';
    if (c === 'JPY') return '¥';
    return '$';
  }, [settings]);

  // Aggregate expenditures by category for the current month
  const categoryExpenses = useMemo(() => {
    const expensesMap: Record<string, number> = {};
    
    transactions
      .filter(t => t.type === 'expense')
      .filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .forEach(t => {
        if (!expensesMap[t.categoryId]) {
          expensesMap[t.categoryId] = 0;
        }
        expensesMap[t.categoryId] += t.amount;
      });

    return expensesMap;
  }, [transactions, currentMonth, currentYear]);

  // Merge Budgets with current monthly spend
  const budgetProgress = useMemo(() => {
    return budgets.map(b => {
      const cat = categories.find(c => c.id === b.categoryId);
      const spent = categoryExpenses[b.categoryId] || 0;
      const remaining = b.amount - spent;
      const percentage = b.amount > 0 ? (spent / b.amount) * 100 : 0;

      return {
        ...b,
        categoryName: cat?.name || 'Uncategorized',
        categoryIcon: cat?.icon || 'HelpCircle',
        categoryColor: cat?.color || 'slate',
        spent,
        remaining,
        percentage
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [budgets, categories, categoryExpenses]);

  // Overall budget stats
  const budgetTotals = useMemo(() => {
    const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgetProgress.reduce((sum, b) => sum + b.spent, 0);
    const totalRemaining = totalBudgetLimit - totalSpent;
    const overAllPercent = totalBudgetLimit > 0 ? (totalSpent / totalBudgetLimit) * 100 : 0;

    return {
      limit: totalBudgetLimit,
      spent: totalSpent,
      remaining: totalRemaining,
      percentage: overAllPercent
    };
  }, [budgets, budgetProgress]);

  const handleBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !amount) return;

    saveBudget({
      categoryId,
      amount: parseFloat(amount),
      month: currentMonth,
      year: currentYear
    });

    setCategoryId('');
    setAmount('');
    setIsAddOpen(false);
  };

  const getPercentageColor = (percent: number) => {
    if (percent >= 100) return 'bg-rose-500 dark:bg-rose-600';
    if (percent >= 80) return 'bg-amber-500 dark:bg-amber-600';
    return 'bg-emerald-500 dark:bg-emerald-600';
  };

  const getPercentageTextClass = (percent: number) => {
    if (percent >= 100) return 'text-rose-600 dark:text-rose-400 font-bold';
    if (percent >= 80) return 'text-amber-600 dark:text-amber-400 font-semibold';
    return 'text-emerald-600 dark:text-emerald-400 font-medium';
  };

  return (
    <div className="space-y-8 pb-16">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Budget Control
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track category spending constraints and prevent leakage.
          </p>
        </div>

        <Button onClick={() => setIsAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md self-start sm:self-auto">
          <Plus className="mr-1.5 h-4.5 w-4.5" /> Adjust Budget
        </Button>
      </div>

      {/* OVERVIEW PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card hoverEffect className="relative overflow-hidden">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Total Budgets Limit</p>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
                {currencySymbol} {budgetTotals.limit.toLocaleString()}
              </h3>
            </div>
          </div>
        </Card>

        <Card hoverEffect className="relative overflow-hidden">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Enforced Spent</p>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
                {currencySymbol} {budgetTotals.spent.toLocaleString()}
              </h3>
            </div>
          </div>
        </Card>

        <Card hoverEffect className="relative overflow-hidden">
          <div className="flex items-center gap-3.5">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
              budgetTotals.remaining >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              <Gauge className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Remaining Reserves</p>
              <h3 className={`text-xl font-bold tracking-tight mt-0.5 ${
                budgetTotals.remaining >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600'
              }`}>
                {currencySymbol} {budgetTotals.remaining.toLocaleString()}
              </h3>
            </div>
          </div>
        </Card>
      </div>

      {/* DETAILED BUDGET LIMITS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Enforced Budgets</h3>
          <span className="text-3xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded">
            Month: {date.toLocaleString('en-US', { month: 'long' })}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {budgetProgress.length === 0 ? (
            <div className="md:col-span-2">
              <EmptyState
                icon={<Wallet className="h-8 w-8 text-slate-400" />}
                title="No Budgets Active"
                description="Keep your spending disciplined by setting category budget limits."
                action={
                  <Button size="sm" onClick={() => setIsAddOpen(true)}>
                    Set Category Limit
                  </Button>
                }
              />
            </div>
          ) : (
            budgetProgress.map((b) => (
              <Card key={b.id} hoverEffect className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
                      <LucideIcon name={b.categoryIcon} className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{b.categoryName}</h4>
                      <p className="text-3xs text-slate-400 dark:text-slate-500">
                        {b.spent > b.amount ? 'Limit exceeded!' : 'Within guidelines'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => deleteBudget(b.id)}
                      className="p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all inline-flex"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Visual */}
                <div className="space-y-2">
                  <div className="flex justify-between text-2xs font-bold text-slate-500">
                    <span>
                      {currencySymbol} {b.spent.toLocaleString()} / <span className="text-slate-400">{currencySymbol} {b.amount.toLocaleString()}</span>
                    </span>
                    <span className={getPercentageTextClass(b.percentage)}>
                      {b.percentage.toFixed(0)}%
                    </span>
                  </div>

                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, b.percentage)}%` }}
                      transition={{ duration: 0.6 }}
                      className={`h-full rounded-full ${getPercentageColor(b.percentage)}`}
                    />
                  </div>
                </div>

                {/* Detailed remaining summary */}
                <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30 p-2.5 rounded-lg text-3xs font-medium border border-slate-50 dark:border-slate-800/20">
                  <span className="text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    {b.percentage >= 100 ? (
                      <>
                        <Flame className="h-3 w-3 text-rose-500" /> Overflow:
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Remaining:
                      </>
                    )}
                  </span>
                  <span className={`font-bold ${b.percentage >= 100 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                    {currencySymbol} {Math.abs(b.remaining).toLocaleString()}
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* ADJUST BUDGET DIALOG */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Set Budget Limit" size="sm">
        <form onSubmit={handleBudgetSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Select Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2.5 outline-none text-slate-900 dark:text-slate-100"
              required
            >
              <option value="">Select Category</option>
              {categories
                .filter(c => c.type === 'expense')
                .map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          <Input
            label="Enforced Budget Limit"
            type="number"
            step="1"
            placeholder="e.g. 500"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <p className="text-3xs text-slate-400 leading-relaxed">
            Note: This monthly limit will be calculated automatically against active expense transactions in the current month.
          </p>

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Apply Limit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
