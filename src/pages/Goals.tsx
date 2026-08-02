import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Target,
  Plus,
  Coins,
  Calendar,
  AlertCircle,
  Award,
  Trash2,
  ChevronRight,
  TrendingUp,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { useStore } from '../store';
import { Card, Button, Input, Modal, EmptyState } from '../components/UI';

export default function Goals() {
  const {
    goals,
    settings,
    saveGoal,
    deleteGoal
  } = useStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');

  // Contribution Drawer
  const [isContributeOpen, setIsContributeOpen] = useState(false);
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');

  const currencySymbol = useMemo(() => {
    if (!settings) return 'Rs';
    const c = settings.currency;
    if (c === 'EUR') return '€';
    if (c === 'GBP') return '£';
    if (c === 'INR') return 'Rs';
    if (c === 'JPY') return '¥';
    return 'Rs';
  }, [settings]);

  const stats = useMemo(() => {
    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount).length;

    return {
      totalTarget,
      totalSaved,
      completedGoals
    };
  }, [goals]);

  const handleOpenAdd = () => {
    setEditingGoalId(null);
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setDeadline(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // 6 months default
    setIsFormOpen(true);
  };

  const handleOpenEdit = (id: string) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    setEditingGoalId(id);
    setName(goal.name);
    setTargetAmount(goal.targetAmount.toString());
    setCurrentAmount(goal.currentAmount.toString());
    setDeadline(goal.deadline);
    setIsFormOpen(true);
  };

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount) return;

    const data = {
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0,
      deadline,
      createdAt: new Date().toISOString().split('T')[0]
    };

    if (editingGoalId) {
      saveGoal({
        id: editingGoalId,
        ...data
      });
    } else {
      saveGoal(data);
    }

    setIsFormOpen(false);
  };

  const handleOpenContribute = (id: string) => {
    setContributeGoalId(id);
    setContributeAmount('');
    setIsContributeOpen(true);
  };

  const handleContributeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributeGoalId || !contributeAmount) return;

    const goal = goals.find(g => g.id === contributeGoalId);
    if (!goal) return;

    const added = parseFloat(contributeAmount);
    const updatedAmount = Math.min(goal.targetAmount, goal.currentAmount + added);

    saveGoal({
      ...goal,
      currentAmount: updatedAmount
    });

    setIsContributeOpen(false);
  };

  const getDaysRemaining = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="space-y-8 pb-16">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Savings Targets
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Build reserves and fund your life goals step-by-step.
          </p>
        </div>

        <Button onClick={handleOpenAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md self-start sm:self-auto">
          <Plus className="mr-1.5 h-4.5 w-4.5" /> Define Target
        </Button>
      </div>

      {/* METRICS PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card hoverEffect className="relative overflow-hidden">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Accumulated Target</p>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
                {currencySymbol} {stats.totalTarget.toLocaleString()}
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
              <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Secured Capital Reserves</p>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
                {currencySymbol} {stats.totalSaved.toLocaleString()}
              </h3>
            </div>
          </div>
        </Card>

        <Card hoverEffect className="relative overflow-hidden">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Achieved Targets</p>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
                {stats.completedGoals} / {goals.length}
              </h3>
            </div>
          </div>
        </Card>
      </div>

      {/* GOALS GRID LIST */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Objectives</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.length === 0 ? (
            <div className="md:col-span-2 lg:col-span-3">
              <EmptyState
                icon={<Target className="h-8 w-8 text-slate-400" />}
                title="No Objectives Declared"
                description="Secure your future today by adding objects like vacation reserves or emergency funds."
                action={
                  <Button size="sm" onClick={handleOpenAdd}>
                    Add New Goal
                  </Button>
                }
              />
            </div>
          ) : (
            goals.map((g) => {
              const daysLeft = getDaysRemaining(g.deadline);
              const percentage = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
              const isAchieved = percentage >= 100;

              return (
                <Card key={g.id} hoverEffect className="flex flex-col justify-between space-y-4 min-h-[220px]">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{g.name}</h4>
                        <p className="text-3xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Due {g.deadline}
                        </p>
                      </div>

                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEdit(g.id)}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all inline-flex rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xs"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteGoal(g.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition-all inline-flex rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xs"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress visual metrics */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-2xs font-bold text-slate-500">
                        <span>
                          {currencySymbol} {g.currentAmount.toLocaleString()} / <span className="text-slate-400">{currencySymbol} {g.targetAmount.toLocaleString()}</span>
                        </span>
                        <span className={isAchieved ? 'text-emerald-600 font-extrabold' : 'text-slate-600'}>
                          {percentage.toFixed(0)}%
                        </span>
                      </div>

                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, percentage)}%` }}
                          transition={{ duration: 0.6 }}
                          className={`h-full rounded-full ${
                            isAchieved ? 'bg-emerald-500' : 'bg-emerald-600/75'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-50 dark:border-slate-800/40 flex items-center justify-between">
                    <span className={`text-3xs font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${
                      isAchieved ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                      daysLeft > 30 ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' :
                      daysLeft > 0 ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                      'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                    }`}>
                      {isAchieved ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" /> Completed
                        </>
                      ) : daysLeft > 0 ? (
                        <>
                          <TrendingUp className="h-3 w-3" /> {daysLeft} Days left
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3" /> Overdue
                        </>
                      )}
                    </span>

                    {!isAchieved && (
                      <Button size="sm" onClick={() => handleOpenContribute(g.id)} className="text-2xs py-1.5 px-3">
                        Contribute
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* OBJECTIVE DETAILS DIALOG */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingGoalId ? 'Edit Objective' : 'New Goal Objective'} size="sm">
        <form onSubmit={handleGoalSubmit} className="space-y-4">
          <Input
            label="Goal Name"
            placeholder="e.g. Dream House Fund"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={`Target Value (${currencySymbol})`}
              type="number"
              placeholder="0.00"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              required
            />
            <Input
              label={`Initial Savings (${currencySymbol})`}
              type="number"
              placeholder="0.00"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
            />
          </div>

          <Input
            label="Target Milestone Date"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
          />

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Objective
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONTRIBUTE FUNDS DIALOG */}
      <Modal isOpen={isContributeOpen} onClose={() => setIsContributeOpen(false)} title="Allocate Capital Reserves" size="sm">
        <form onSubmit={handleContributeSubmit} className="space-y-4">
          <Input
            label={`Contribution Value (${currencySymbol})`}
            type="number"
            step="0.01"
            placeholder="e.g. 200"
            value={contributeAmount}
            onChange={(e) => setContributeAmount(e.target.value)}
            required
            autoFocus
          />

          <p className="text-3xs text-slate-400 leading-relaxed">
            Note: This allocation will add directly to your current goal progress. Real-time updates sync to storage immediately.
          </p>

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsContributeOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Commit Allocation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
