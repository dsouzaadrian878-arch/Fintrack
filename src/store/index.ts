import { create } from 'zustand';
import { User, Transaction, Category, Budget, SavingsGoal, Settings, Notification } from '../types';
import { StorageService } from '../services/storage';

interface FinTrackStore {
  // State
  user: User | null;
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: SavingsGoal[];
  settings: Settings | null;
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;

  // Initializer
  init: () => void;

  // Auth Actions
  login: (email: string, name?: string) => Promise<boolean>;
  signup: (name: string, email: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;

  // Transaction Actions
  fetchTransactions: () => void;
  addTransaction: (txn: Omit<Transaction, 'id' | 'userId'>) => void;
  updateTransaction: (txn: Transaction) => void;
  deleteTransaction: (id: string) => void;

  // Category Actions
  fetchCategories: () => void;
  addCategory: (category: Omit<Category, 'id' | 'userId'>) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;

  // Budget Actions
  fetchBudgets: () => void;
  saveBudget: (budget: Omit<Budget, 'id' | 'userId'>) => void;
  deleteBudget: (id: string) => void;

  // Goal Actions
  fetchGoals: () => void;
  saveGoal: (goal: Omit<SavingsGoal, 'id' | 'userId'> | SavingsGoal) => void;
  deleteGoal: (id: string) => void;

  // Settings Actions
  fetchSettings: () => void;
  updateSettings: (settings: Settings) => void;

  // Notification Actions
  fetchNotifications: () => void;
  addNotification: (title: string, message: string, type: Notification['type']) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;

  // Global Actions
  resetAllData: () => void;
}

export const useStore = create<FinTrackStore>((set, get) => ({
  user: null,
  transactions: [],
  categories: [],
  budgets: [],
  goals: [],
  settings: null,
  notifications: [],
  isLoading: false,
  error: null,

  init: () => {
    const user = StorageService.getCurrentUser();
    if (user) {
      set({ user, isLoading: true });
      
      // Load user data
      const txns = StorageService.getTransactions(user.id);
      const categories = StorageService.getCategories(user.id);
      const budgets = StorageService.getBudgets(user.id);
      const goals = StorageService.getGoals(user.id);
      const settings = StorageService.getSettings(user.id);
      const notifications = StorageService.getNotifications(user.id);

      set({
        transactions: txns,
        categories,
        budgets,
        goals,
        settings,
        notifications,
        isLoading: false,
      });
    }
  },

  login: async (email: string, name?: string) => {
    set({ isLoading: true, error: null });
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const users = StorageService.getUsers();
      let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        set({ isLoading: false, error: 'User not found. Please sign up.' });
        return false;
      }

      StorageService.setCurrentUser(user);

      set({ user, isLoading: false });
      get().init();
      return true;
    } catch (err) {
      set({ isLoading: false, error: 'Failed to login' });
      return false;
    }
  },

  signup: async (name: string, email: string) => {
    set({ isLoading: true, error: null });
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const users = StorageService.getUsers();
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        set({ isLoading: false, error: 'Email already exists' });
        return false;
      }

      const newUser: User = {
        id: 'user_' + Math.random().toString(36).substr(2, 9),
        name,
        email: email.toLowerCase(),
        currency: 'INR',
        theme: 'light',
        createdAt: new Date().toISOString(),
      };

      StorageService.createUser(newUser);
      StorageService.setCurrentUser(newUser);

      set({ user: newUser, isLoading: false });
      get().init();
      return true;
    } catch (err) {
      set({ isLoading: false, error: 'Failed to sign up' });
      return false;
    }
  },

  logout: () => {
    StorageService.setCurrentUser(null);
    set({
      user: null,
      transactions: [],
      categories: [],
      budgets: [],
      goals: [],
      settings: null,
      notifications: [],
    });
  },

  updateProfile: (updates: Partial<User>) => {
    const { user } = get();
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    StorageService.updateUser(updatedUser);
    set({ user: updatedUser });
  },

  // --- TRANSACTIONS ---
  fetchTransactions: () => {
    const { user } = get();
    if (!user) return;
    set({ transactions: StorageService.getTransactions(user.id) });
  },

  addTransaction: (txn) => {
    const { user, settings } = get();
    if (!user) return;

    const newTxn = StorageService.addTransaction(user.id, txn);
    
    // Check constraints & generate notifications
    // 1. Check for large expense
    if (settings && txn.type === 'expense' && txn.amount >= settings.largeExpenseThreshold) {
      get().addNotification(
        'Large Expense Added 💸',
        `A large expense of ${settings.currency} ${txn.amount.toLocaleString()} for "${txn.title}" was recorded.`,
        'large_expense'
      );
    }

    // 2. Check for budget threshold exceeded
    if (txn.type === 'expense') {
      const month = new Date(txn.date).getMonth();
      const year = new Date(txn.date).getFullYear();
      
      const budgets = get().budgets.filter(b => b.month === month && b.year === year);
      const catBudget = budgets.find(b => b.categoryId === txn.categoryId);
      
      if (catBudget) {
        // Calculate category spend
        const txns = get().transactions;
        // include newly added txn in total calculation
        const totalWithNew = [newTxn, ...txns]
          .filter(t => t.categoryId === txn.categoryId && t.type === 'expense')
          .filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === month && d.getFullYear() === year;
          })
          .reduce((sum, t) => sum + t.amount, 0);

        const category = get().categories.find(c => c.id === txn.categoryId);
        const catName = category ? category.name : 'Category';

        if (totalWithNew > catBudget.amount) {
          get().addNotification(
            'Budget Exceeded! ⚠️',
            `You have exceeded your monthly budget for "${catName}" of ${settings?.currency || 'Rs'} ${catBudget.amount.toLocaleString()} (Spent: ${settings?.currency || 'Rs'} ${totalWithNew.toLocaleString()}).`,
            'budget_alert'
          );
        } else if (totalWithNew >= catBudget.amount * 0.8) {
          get().addNotification(
            'Budget Warning ⚠️',
            `You have used 80% or more of your monthly budget for "${catName}". Spent: ${settings?.currency || 'Rs'} ${totalWithNew.toLocaleString()} of ${settings?.currency || 'Rs'} ${catBudget.amount.toLocaleString()}.`,
            'budget_alert'
          );
        }
      }
    }

    // Update transactions list
    set(state => ({
      transactions: [newTxn, ...state.transactions]
    }));
  },

  updateTransaction: (updatedTxn) => {
    const { user } = get();
    if (!user) return;

    StorageService.updateTransaction(user.id, updatedTxn);
    set(state => ({
      transactions: state.transactions.map(t => t.id === updatedTxn.id ? updatedTxn : t)
    }));
  },

  deleteTransaction: (id) => {
    const { user } = get();
    if (!user) return;

    StorageService.deleteTransaction(user.id, id);
    set(state => ({
      transactions: state.transactions.filter(t => t.id !== id)
    }));
  },

  // --- CATEGORIES ---
  fetchCategories: () => {
    const { user } = get();
    if (!user) return;
    set({ categories: StorageService.getCategories(user.id) });
  },

  addCategory: (category) => {
    const { user } = get();
    if (!user) return;

    const newCat = StorageService.addCategory(user.id, category);
    set(state => ({
      categories: [...state.categories, newCat]
    }));
  },

  updateCategory: (category) => {
    const { user } = get();
    if (!user) return;

    StorageService.updateCategory(user.id, category);
    set(state => ({
      categories: state.categories.map(c => c.id === category.id ? category : c)
    }));
  },

  deleteCategory: (id) => {
    const { user } = get();
    if (!user) return;

    StorageService.deleteCategory(user.id, id);
    set(state => ({
      categories: state.categories.filter(c => c.id !== id)
    }));
  },

  // --- BUDGETS ---
  fetchBudgets: () => {
    const { user } = get();
    if (!user) return;
    set({ budgets: StorageService.getBudgets(user.id) });
  },

  saveBudget: (budget) => {
    const { user } = get();
    if (!user) return;

    const saved = StorageService.saveBudget(user.id, budget);
    set(state => {
      const idx = state.budgets.findIndex(b => b.id === saved.id);
      if (idx !== -1) {
        const next = [...state.budgets];
        next[idx] = saved;
        return { budgets: next };
      }
      return { budgets: [...state.budgets, saved] };
    });
  },

  deleteBudget: (id) => {
    const { user } = get();
    if (!user) return;

    StorageService.deleteBudget(user.id, id);
    set(state => ({
      budgets: state.budgets.filter(b => b.id !== id)
    }));
  },

  // --- SAVINGS GOALS ---
  fetchGoals: () => {
    const { user } = get();
    if (!user) return;
    set({ goals: StorageService.getGoals(user.id) });
  },

  saveGoal: (goal) => {
    const { user } = get();
    if (!user) return;

    // Detect if goal is newly completed
    let isCompletedJustNow = false;
    if ('id' in goal) {
      const prevGoal = get().goals.find(g => g.id === goal.id);
      if (prevGoal && prevGoal.currentAmount < prevGoal.targetAmount && goal.currentAmount >= goal.targetAmount) {
        isCompletedJustNow = true;
      }
    } else {
      if (goal.currentAmount >= goal.targetAmount) {
        isCompletedJustNow = true;
      }
    }

    const saved = StorageService.saveGoal(user.id, goal);

    if (isCompletedJustNow) {
      get().addNotification(
        'Savings Goal Achieved! 🎉',
        `Fantastic job! You've successfully hit your target of ${get().settings?.currency || 'Rs'} ${saved.targetAmount.toLocaleString()} for "${saved.name}"!`,
        'goal_alert'
      );
    }

    set(state => {
      const idx = state.goals.findIndex(g => g.id === saved.id);
      if (idx !== -1) {
        const next = [...state.goals];
        next[idx] = saved;
        return { goals: next };
      }
      return { goals: [...state.goals, saved] };
    });
  },

  deleteGoal: (id) => {
    const { user } = get();
    if (!user) return;

    StorageService.deleteGoal(user.id, id);
    set(state => ({
      goals: state.goals.filter(g => g.id !== id)
    }));
  },

  // --- SETTINGS ---
  fetchSettings: () => {
    const { user } = get();
    if (!user) return;
    set({ settings: StorageService.getSettings(user.id) });
  },

  updateSettings: (settings) => {
    const { user } = get();
    if (!user) return;

    StorageService.saveSettings(user.id, settings);
    set({ settings });

    // Also sync dark mode with theme
    get().updateProfile({ theme: settings.darkMode ? 'dark' : 'light' });
  },

  // --- NOTIFICATIONS ---
  fetchNotifications: () => {
    const { user } = get();
    if (!user) return;
    set({ notifications: StorageService.getNotifications(user.id) });
  },

  addNotification: (title, message, type) => {
    const { user } = get();
    if (!user) return;

    const newNotif = StorageService.addNotification(user.id, { title, message, type });
    set(state => ({
      notifications: [newNotif, ...state.notifications]
    }));
  },

  markNotificationRead: (id) => {
    const { user } = get();
    if (!user) return;

    StorageService.markAsRead(user.id, id);
    set(state => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    }));
  },

  markAllNotificationsRead: () => {
    const { user } = get();
    if (!user) return;

    StorageService.markAllAsRead(user.id);
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true }))
    }));
  },

  clearNotifications: () => {
    const { user } = get();
    if (!user) return;

    StorageService.clearNotifications(user.id);
    set({ notifications: [] });
  },

  // --- GLOBAL ---
  resetAllData: () => {
    StorageService.resetAllData();
    set({
      user: null,
      transactions: [],
      categories: [],
      budgets: [],
      goals: [],
      settings: null,
      notifications: [],
    });
  }
}));
