import { User, Transaction, Category, Budget, SavingsGoal, Settings, Notification } from '../types';
import { DEFAULT_CATEGORIES } from '../constants';

const KEYS = {
  USER: 'fintrack_user', // Current session user
  USERS_LIST: 'fintrack_users_list', // Database of all registered users
  TRANSACTIONS: 'fintrack_transactions',
  CATEGORIES: 'fintrack_categories',
  BUDGETS: 'fintrack_budgets',
  GOALS: 'fintrack_goals',
  SETTINGS: 'fintrack_settings',
  NOTIFICATIONS: 'fintrack_notifications',
};

// Helper to safely parse JSON
const parseJSON = <T>(key: string, defaultValue: T): T => {
  const value = localStorage.getItem(key);
  if (!value) return defaultValue;
  try {
    return JSON.parse(value) as T;
  } catch (e) {
    console.error(`Error parsing localStorage key "${key}":`, e);
    return defaultValue;
  }
};

const saveJSON = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const StorageService = {
  // --- AUTH / USER ---
  getCurrentUser(): User | null {
    const user = parseJSON<User | null>(KEYS.USER, null);
    if (user && user.currency === 'USD') {
      user.currency = 'INR';
      this.setCurrentUser(user);
    }
    return user;
  },

  setCurrentUser(user: User | null): void {
    if (user) {
      saveJSON(KEYS.USER, user);
      // Ensure user is in list
      const users = parseJSON<User[]>(KEYS.USERS_LIST, []);
      if (!users.some(u => u.id === user.id)) {
        users.push(user);
        saveJSON(KEYS.USERS_LIST, users);
      }
    } else {
      localStorage.removeItem(KEYS.USER);
    }
  },

  getUsers(): User[] {
    const users = parseJSON<User[]>(KEYS.USERS_LIST, []);
    let modified = false;
    users.forEach(u => {
      if (u.currency === 'USD') {
        u.currency = 'INR';
        modified = true;
      }
    });
    if (modified) {
      saveJSON(KEYS.USERS_LIST, users);
    }
    return users;
  },

  createUser(user: User): void {
    const users = parseJSON<User[]>(KEYS.USERS_LIST, []);
    users.push(user);
    saveJSON(KEYS.USERS_LIST, users);
  },

  updateUser(user: User): void {
    // Update current session
    const current = this.getCurrentUser();
    if (current && current.id === user.id) {
      this.setCurrentUser(user);
    }
    // Update database list
    const users = parseJSON<User[]>(KEYS.USERS_LIST, []);
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      users[index] = user;
      saveJSON(KEYS.USERS_LIST, users);
    }
  },

  // --- TRANSACTIONS ---
  getTransactions(userId: string): Transaction[] {
    const txns = parseJSON<Transaction[]>(KEYS.TRANSACTIONS, []);
    return txns.filter(t => t.userId === userId);
  },

  saveTransactions(userId: string, txns: Transaction[]): void {
    const allTxns = parseJSON<Transaction[]>(KEYS.TRANSACTIONS, []);
    const filtered = allTxns.filter(t => t.userId !== userId);
    saveJSON(KEYS.TRANSACTIONS, [...filtered, ...txns]);
  },

  addTransaction(userId: string, txn: Omit<Transaction, 'id' | 'userId'>): Transaction {
    const newTxn: Transaction = {
      ...txn,
      id: 'txn_' + Math.random().toString(36).substr(2, 9),
      userId,
    };
    const txns = this.getTransactions(userId);
    txns.unshift(newTxn);
    this.saveTransactions(userId, txns);
    return newTxn;
  },

  updateTransaction(userId: string, updatedTxn: Transaction): void {
    const txns = this.getTransactions(userId);
    const index = txns.findIndex(t => t.id === updatedTxn.id);
    if (index !== -1) {
      txns[index] = updatedTxn;
      this.saveTransactions(userId, txns);
    }
  },

  deleteTransaction(userId: string, id: string): void {
    const txns = this.getTransactions(userId);
    const filtered = txns.filter(t => t.id !== id);
    this.saveTransactions(userId, filtered);
  },

  // --- CATEGORIES ---
  getCategories(userId: string): Category[] {
    const customCats = parseJSON<Category[]>(KEYS.CATEGORIES, []).filter(c => c.userId === userId);
    return [...DEFAULT_CATEGORIES, ...customCats];
  },

  addCategory(userId: string, category: Omit<Category, 'id' | 'userId'>): Category {
    const newCat: Category = {
      ...category,
      id: 'cat_' + Math.random().toString(36).substr(2, 9),
      userId,
    };
    const customCats = parseJSON<Category[]>(KEYS.CATEGORIES, []);
    customCats.push(newCat);
    saveJSON(KEYS.CATEGORIES, customCats);
    return newCat;
  },

  updateCategory(userId: string, updatedCat: Category): void {
    const customCats = parseJSON<Category[]>(KEYS.CATEGORIES, []);
    const index = customCats.findIndex(c => c.id === updatedCat.id && c.userId === userId);
    if (index !== -1) {
      customCats[index] = updatedCat;
      saveJSON(KEYS.CATEGORIES, customCats);
    }
  },

  deleteCategory(userId: string, id: string): void {
    const customCats = parseJSON<Category[]>(KEYS.CATEGORIES, []);
    const filtered = customCats.filter(c => !(c.id === id && c.userId === userId));
    saveJSON(KEYS.CATEGORIES, filtered);
  },

  // --- BUDGETS ---
  getBudgets(userId: string): Budget[] {
    const budgets = parseJSON<Budget[]>(KEYS.BUDGETS, []);
    return budgets.filter(b => b.userId === userId);
  },

  saveBudget(userId: string, budget: Omit<Budget, 'id' | 'userId'>): Budget {
    const budgets = this.getBudgets(userId);
    // Overwrite existing budget for the same category, month, and year
    const existingIndex = budgets.findIndex(
      b => b.categoryId === budget.categoryId && b.month === budget.month && b.year === budget.year
    );

    let finalBudget: Budget;
    if (existingIndex !== -1) {
      finalBudget = {
        ...budgets[existingIndex],
        amount: budget.amount,
      };
      budgets[existingIndex] = finalBudget;
    } else {
      finalBudget = {
        ...budget,
        id: 'bud_' + Math.random().toString(36).substr(2, 9),
        userId,
      };
      budgets.push(finalBudget);
    }

    const allBudgets = parseJSON<Budget[]>(KEYS.BUDGETS, []);
    const filtered = allBudgets.filter(b => b.userId !== userId);
    saveJSON(KEYS.BUDGETS, [...filtered, ...budgets]);
    return finalBudget;
  },

  deleteBudget(userId: string, id: string): void {
    const budgets = parseJSON<Budget[]>(KEYS.BUDGETS, []);
    const filtered = budgets.filter(b => !(b.id === id && b.userId === userId));
    saveJSON(KEYS.BUDGETS, filtered);
  },

  // --- SAVINGS GOALS ---
  getGoals(userId: string): SavingsGoal[] {
    const goals = parseJSON<SavingsGoal[]>(KEYS.GOALS, []);
    return goals.filter(g => g.userId === userId);
  },

  saveGoal(userId: string, goal: Omit<SavingsGoal, 'id' | 'userId'> | SavingsGoal): SavingsGoal {
    const goals = this.getGoals(userId);
    let finalGoal: SavingsGoal;

    if ('id' in goal) {
      finalGoal = goal;
      const index = goals.findIndex(g => g.id === goal.id);
      if (index !== -1) {
        goals[index] = finalGoal;
      }
    } else {
      finalGoal = {
        ...goal,
        id: 'goal_' + Math.random().toString(36).substr(2, 9),
        userId,
      };
      goals.push(finalGoal);
    }

    const allGoals = parseJSON<SavingsGoal[]>(KEYS.GOALS, []);
    const filtered = allGoals.filter(g => g.userId !== userId);
    saveJSON(KEYS.GOALS, [...filtered, ...goals]);
    return finalGoal;
  },

  deleteGoal(userId: string, id: string): void {
    const goals = parseJSON<SavingsGoal[]>(KEYS.GOALS, []);
    const filtered = goals.filter(g => !(g.id === id && g.userId === userId));
    saveJSON(KEYS.GOALS, filtered);
  },

  // --- SETTINGS ---
  getSettings(userId: string): Settings {
    const allSettings = parseJSON<Record<string, Settings>>(KEYS.SETTINGS, {});
    if (!allSettings[userId]) {
      allSettings[userId] = {
        darkMode: false,
        currency: 'INR',
        backupReminder: true,
        largeExpenseThreshold: 50000,
      };
      saveJSON(KEYS.SETTINGS, allSettings);
    } else if (allSettings[userId].currency === 'USD') {
      allSettings[userId].currency = 'INR';
      if (allSettings[userId].largeExpenseThreshold === 1000) {
        allSettings[userId].largeExpenseThreshold = 50000;
      }
      saveJSON(KEYS.SETTINGS, allSettings);
    }
    return allSettings[userId];
  },

  saveSettings(userId: string, settings: Settings): void {
    const allSettings = parseJSON<Record<string, Settings>>(KEYS.SETTINGS, {});
    allSettings[userId] = settings;
    saveJSON(KEYS.SETTINGS, allSettings);
  },

  // --- NOTIFICATIONS ---
  getNotifications(userId: string): Notification[] {
    const notifications = parseJSON<Notification[]>(KEYS.NOTIFICATIONS, []);
    return notifications.filter(n => n.userId === userId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  addNotification(userId: string, notification: Omit<Notification, 'id' | 'userId' | 'date' | 'read'>): Notification {
    const newNotif: Notification = {
      ...notification,
      id: 'notif_' + Math.random().toString(36).substr(2, 9),
      userId,
      read: false,
      date: new Date().toISOString(),
    };
    const allNotifs = parseJSON<Notification[]>(KEYS.NOTIFICATIONS, []);
    allNotifs.unshift(newNotif);
    saveJSON(KEYS.NOTIFICATIONS, allNotifs);
    return newNotif;
  },

  markAsRead(userId: string, id: string): void {
    const allNotifs = parseJSON<Notification[]>(KEYS.NOTIFICATIONS, []);
    const index = allNotifs.findIndex(n => n.id === id && n.userId === userId);
    if (index !== -1) {
      allNotifs[index].read = true;
      saveJSON(KEYS.NOTIFICATIONS, allNotifs);
    }
  },

  markAllAsRead(userId: string): void {
    const allNotifs = parseJSON<Notification[]>(KEYS.NOTIFICATIONS, []);
    allNotifs.forEach(n => {
      if (n.userId === userId) n.read = true;
    });
    saveJSON(KEYS.NOTIFICATIONS, allNotifs);
  },

  clearNotifications(userId: string): void {
    const allNotifs = parseJSON<Notification[]>(KEYS.NOTIFICATIONS, []);
    const filtered = allNotifs.filter(n => n.userId !== userId);
    saveJSON(KEYS.NOTIFICATIONS, filtered);
  },

  // --- DATABASE RESET / SEED ---
  resetAllData(): void {
    localStorage.clear();
  }
};
