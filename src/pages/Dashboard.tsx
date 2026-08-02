import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  ArrowRight,
  TrendingUp as SavingsIcon,
  Activity,
  Calendar,
  AlertTriangle,
  History,
  Sparkles,
  ArrowRightLeft,
  X,
  PlusCircle,
  HelpCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';
import { useStore } from '../store';
import { Card, Button, Input, Modal, EmptyState } from '../components/UI';
import LucideIcon from '../components/LucideIcon';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    user,
    transactions,
    categories,
    budgets,
    goals,
    settings,
    addTransaction,
    addNotification
  } = useStore();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [txnType, setTxnType] = useState<'income' | 'expense'>('expense');

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
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

  // Aggregate stats
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;

    transactions.forEach(t => {
      if (t.type === 'income') {
        income += t.amount;
      } else {
        expense += t.amount;
      }
    });

    const balance = income - expense;
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    // Calculate Financial Health Score (out of 100)
    // 40% based on savings rate (Excellent is >30%)
    // 30% based on budget discipline (not exceeding budgets)
    // 30% based on savings goal progress
    let healthScore = 50; // base standard
    if (savingsRate > 30) healthScore += 20;
    else if (savingsRate > 15) healthScore += 10;
    else if (savingsRate < 0) healthScore -= 20;

    // Budget check
    const exceededBudgets = budgets.filter(b => {
      const monthSpend = transactions
        .filter(t => t.type === 'expense' && t.categoryId === b.categoryId)
        .reduce((sum, t) => sum + t.amount, 0);
      return monthSpend > b.amount;
    }).length;

    if (exceededBudgets === 0 && budgets.length > 0) healthScore += 15;
    else if (exceededBudgets > 2) healthScore -= 15;

    // Goal progress
    if (goals.length > 0) {
      const avgProgress = goals.reduce((sum, g) => sum + (g.currentAmount / g.targetAmount), 0) / goals.length;
      healthScore += Math.min(15, Math.round(avgProgress * 15));
    }

    healthScore = Math.max(10, Math.min(100, healthScore));

    return {
      income,
      expense,
      balance,
      savingsRate,
      healthScore
    };
  }, [transactions, budgets, goals]);

  // Chart 1: Income vs Expense comparison (grouped by date)
  const groupChartsData = useMemo(() => {
    const dailyMap: Record<string, { date: string; Income: number; Expense: number }> = {};
    
    // Last 14 days
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      dailyMap[str] = { date: label, Income: 0, Expense: 0 };
    }

    transactions.forEach(t => {
      if (dailyMap[t.date]) {
        if (t.type === 'income') {
          dailyMap[t.date].Income += t.amount;
        } else {
          dailyMap[t.date].Expense += t.amount;
        }
      }
    });

    return Object.values(dailyMap);
  }, [transactions]);

  // Chart 2: Top Spending Categories
  const categoryPieData = useMemo(() => {
    const expenseCatsMap: Record<string, { name: string; value: number; color: string }> = {};
    
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      const catName = cat ? cat.name : 'Other';
      const catColor = cat ? cat.color : 'slate';

      if (!expenseCatsMap[t.categoryId]) {
        expenseCatsMap[t.categoryId] = {
          name: catName,
          value: 0,
          color: catColor
        };
      }
      expenseCatsMap[t.categoryId].value += t.amount;
    });

    return Object.values(expenseCatsMap).sort((a, b) => b.value - a.value);
  }, [transactions, categories]);

  // Category Tailwind mapping to hex for recharts cells
  const getHexColor = (tailwindColor: string) => {
    const colors: Record<string, string> = {
      emerald: '#10b981',
      blue: '#3b82f6',
      amber: '#f59e0b',
      indigo: '#6366f1',
      pink: '#ec4899',
      violet: '#8b5cf6',
      rose: '#f43f5e',
      sky: '#0ea5e9',
      cyan: '#06b6d4',
      green: '#22c55e',
      teal: '#14b8a6',
      purple: '#a855f7',
      orange: '#f97316',
      slate: '#64748b'
    };
    return colors[tailwindColor] || '#10b981';
  };

  // Chart 3: Cumulative Savings trend
  const dailyBalanceTrend = useMemo(() => {
    const dailyMap: Record<string, { date: string; Balance: number }> = {};
    const days = 14;
    
    // Prepare date skeleton
    const dateKeys: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      dateKeys.push(str);
      dailyMap[str] = {
        date: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        Balance: 0
      };
    }

    // Sort transactions ascending by date to calculate historical rolling balance correctly
    const sortedTxns = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

    // Initial sum for dates older than our range
    let rollingBalance = sortedTxns
      .filter(t => t.date < dateKeys[0])
      .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);

    // Apply incremental changes inside the range
    dateKeys.forEach(k => {
      const dayTxns = sortedTxns.filter(t => t.date === k);
      const change = dayTxns.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
      rollingBalance += change;
      dailyMap[k].Balance = rollingBalance;
    });

    return Object.values(dailyMap);
  }, [transactions]);

  // Recent Transactions (limit to 5)
  const recentTxns = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  // Handle Quick Add Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !categoryId) return;

    const tags = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    addTransaction({
      title,
      amount: parseFloat(amount),
      type: txnType,
      categoryId,
      paymentMethod,
      date,
      notes: notes || undefined,
      tags: tags.length > 0 ? tags : undefined
    });

    // Reset Form
    setTitle('');
    setAmount('');
    setNotes('');
    setTagsInput('');
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* HEADER SECTION WITH QUICK STATS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Wealth Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Hi {user?.name || 'User'}, here is your premium portfolio overview.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Button onClick={() => { setTxnType('expense'); setIsAddOpen(true); }} variant="outline" className="text-xs">
            <TrendingDown className="mr-2 h-4 w-4 text-rose-500" /> Log Expense
          </Button>
          <Button onClick={() => { setTxnType('income'); setIsAddOpen(true); }} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
            <Plus className="mr-1 h-4 w-4" /> Quick Add
          </Button>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1 */}
        <Card hoverEffect className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-300" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-2xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Net Worth</span>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {currencySymbol} {stats.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs">
            <span className={`font-semibold flex items-center ${stats.balance >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
              <Activity className="h-3.5 w-3.5 mr-1" />
              Active Equity
            </span>
            <span className="text-slate-400 dark:text-slate-500">across accounts</span>
          </div>
        </Card>

        {/* Metric 2 */}
        <Card hoverEffect className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-300" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-2xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Inflow</span>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {currencySymbol} {stats.income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center">
              <Sparkles className="h-3.5 w-3.5 mr-1 text-amber-500" /> All-Time Inflow
            </span>
          </div>
        </Card>

        {/* Metric 3 */}
        <Card hoverEffect className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-300" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-2xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Outflow</span>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {currencySymbol} {stats.expense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-rose-600 dark:text-rose-400 flex items-center">
              Logged spending trends
            </span>
          </div>
        </Card>

        {/* Metric 4 */}
        <Card hoverEffect className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-300" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-2xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Savings Rate</span>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white animate-pulse">
                {stats.savingsRate.toFixed(1)}%
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <SavingsIcon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs">
            <span className={`font-semibold ${stats.savingsRate > 20 ? 'text-emerald-600' : 'text-slate-500'}`}>
              {stats.savingsRate > 20 ? 'Optimal savings velocity' : 'Increase monthly reserves'}
            </span>
          </div>
        </Card>
      </div>

      {/* CHARTS BENTO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Area / Line Trend Chart */}
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Equity Rolling Trend</h3>
              <p className="text-2xs text-slate-400 dark:text-slate-500">Historical net equity fluctuations over the last 14 days</p>
            </div>
            <span className="text-3xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-md">
              Rolling Equity
            </span>
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyBalanceTrend}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800/30" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${currencySymbol}${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px'
                  }}
                  formatter={(value) => [`${currencySymbol} ${parseFloat(value as string).toLocaleString()}`, 'Net Worth']}
                />
                <Area type="monotone" dataKey="Balance" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorBalance)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Financial Health Meter */}
        <Card className="flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Wealth Health Rating</h3>
            <p className="text-2xs text-slate-400 dark:text-slate-500">Aggregated metric of budgets, savings rates, and goals</p>
          </div>

          <div className="flex flex-col items-center justify-center my-6 space-y-4">
            {/* Dynamic visual circle */}
            <div className="relative h-40 w-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="64"
                  strokeWidth="10"
                  stroke="currentColor"
                  fill="transparent"
                  className="text-slate-100 dark:text-slate-800"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="64"
                  strokeWidth="10"
                  strokeDasharray={402}
                  strokeDashoffset={402 - (402 * stats.healthScore) / 100}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  className="text-emerald-500 dark:text-emerald-400 transition-all duration-1000"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.healthScore}</span>
                <span className="text-3xs uppercase tracking-wider font-semibold text-slate-400">Score</span>
              </div>
            </div>

            <div className="text-center space-y-1">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                stats.healthScore >= 80 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                stats.healthScore >= 50 ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
              }`}>
                {stats.healthScore >= 80 ? 'Excellent Performance' : stats.healthScore >= 50 ? 'Satisfactory Health' : 'Optimization Required'}
              </span>
              <p className="text-3xs text-slate-400 max-w-xs pt-1.5 leading-relaxed">
                Score increases with savings rates over 20%, low budget overflows, and active goal additions.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* CHARTS ROW 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expense Bar Chart */}
        <Card className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Inflow vs Outflow</h3>
            <p className="text-2xs text-slate-400 dark:text-slate-500">Daily comparative liquidity flows over last 14 days</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groupChartsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800/30" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px'
                  }}
                  formatter={(value) => [`${currencySymbol} ${parseFloat(value as string).toLocaleString()}`]}
                />
                <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={16} />
                <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pie spending categories */}
        <Card className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Top Spending Sectors</h3>
            <p className="text-2xs text-slate-400 dark:text-slate-500">Expense breakdown by interactive category allocation</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-64">
            <div className="h-full w-full sm:w-1/2">
              {categoryPieData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No expense records found
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getHexColor(entry.color)} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '11px'
                      }}
                      formatter={(value) => [`${currencySymbol} ${parseFloat(value as string).toLocaleString()}`]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="flex-1 w-full space-y-2 max-h-52 overflow-y-auto pr-2">
              {categoryPieData.slice(0, 5).map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getHexColor(entry.color) }} />
                    <span className="text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{entry.name}</span>
                  </div>
                  <span className="text-slate-900 dark:text-white font-bold">
                    {currencySymbol} {entry.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* LOWER ROW: RECENT TRANSACTIONS */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="space-y-5">
          <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/40 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Recent Asset Movements</h3>
              <p className="text-2xs text-slate-400 dark:text-slate-500">Live feed of transactions recorded in this system</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/transactions')} className="text-xs">
              View Ledger <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>

          <div className="divide-y divide-slate-50 dark:divide-slate-800/40">
            {recentTxns.length === 0 ? (
              <EmptyState
                icon={<ArrowRightLeft className="h-8 w-8" />}
                title="No Ledger Records"
                description="Start recording cashflows or expenses to see real-time wealth calculations."
                action={
                  <Button size="sm" onClick={() => setIsAddOpen(true)}>
                    Add Cashflow
                  </Button>
                }
              />
            ) : (
              recentTxns.map((t) => {
                const cat = categories.find(c => c.id === t.categoryId);
                return (
                  <div key={t.id} className="flex items-center justify-between py-3.5 group hover:bg-slate-50/20 dark:hover:bg-slate-800/10 px-2 rounded-xl transition-all">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                        t.type === 'income'
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}>
                        <LucideIcon name={cat?.icon || 'DollarSign'} className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {t.title}
                        </p>
                        <p className="text-3xs text-slate-400 dark:text-slate-500 mt-0.5">
                          {cat?.name || 'Uncategorized'} • {t.paymentMethod} • {t.date}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={`text-xs font-extrabold ${
                        t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                      }`}>
                        {t.type === 'income' ? '+' : '-'} {currencySymbol} {t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* QUICK ADD MODAL */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Log Transaction" size="md">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {/* Income vs Expense Selection Tabs */}
          <div className="flex bg-slate-50 dark:bg-slate-950 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setTxnType('expense')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                txnType === 'expense'
                  ? 'bg-white dark:bg-slate-900 shadow-sm text-rose-600 dark:text-rose-400'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setTxnType('income')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                txnType === 'income'
                  ? 'bg-white dark:bg-slate-900 shadow-sm text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Income
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Transaction Title"
              placeholder="e.g. Starbucks Coffee"
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
                  .filter(c => c.type === txnType || c.type === 'all')
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
              label="Tags (Comma separated)"
              placeholder="e.g. coffee, break"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Notes
            </label>
            <textarea
              placeholder="Additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2.5 outline-none text-slate-900 dark:text-slate-100"
              rows={2}
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Entry
            </Button>
          </div>
        </form>
      </Modal>

      {/* FLOATING ACTION BUTTON */}
      <div className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 z-30">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setTxnType('expense'); setIsAddOpen(true); }}
          className="h-14 w-14 rounded-full bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xl shadow-emerald-600/30 font-bold border border-emerald-500 outline-none"
          title="Quick Record Transaction"
        >
          <Plus className="h-7 w-7" />
        </motion.button>
      </div>
    </div>
  );
}
