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
    return parseJSON<User | null>(KEYS.USER, null);
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
    return parseJSON<User[]>(KEYS.USERS_LIST, []);
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
        currency: 'USD',
        backupReminder: true,
        largeExpenseThreshold: 1000,
      };
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
  seedDemoData(userId: string): void {
    // Check if user has data already. If so, don't overwrite.
    const txns = this.getTransactions(userId);
    if (txns.length > 0) return;

    const date = new Date();
    const currentYear = date.getFullYear();
    const currentMonth = date.getMonth();

    const formatOffsetDate = (offsetDays: number): string => {
      const d = new Date();
      d.setDate(d.getDate() - offsetDays);
      return d.toISOString().split('T')[0];
    };

    // Prepopulate some realistic transactions
    const seedTxns: Omit<Transaction, 'id' | 'userId'>[] = [
      { title: 'TechCorp Salary', amount: 5500, type: 'income', categoryId: 'cat_salary', paymentMethod: 'Bank Transfer', date: formatOffsetDate(1), notes: 'Monthly base pay' },
      { title: 'Freelance Design', amount: 1200, type: 'income', categoryId: 'cat_freelance', paymentMethod: 'PayPal', date: formatOffsetDate(3), notes: 'Fintech UI redesign project' },
      { title: 'Dividend Payout', amount: 150, type: 'income', categoryId: 'cat_investments', paymentMethod: 'Bank Transfer', date: formatOffsetDate(8), notes: 'S&P 500 dividends' },
      
      { title: 'Whole Foods Grocery', amount: 245.5, type: 'expense', categoryId: 'cat_food', paymentMethod: 'Debit Card', date: formatOffsetDate(0), notes: 'Weekly organic groceries', tags: ['groceries', 'food'] },
      { title: 'Apartment Rent', amount: 1850, type: 'expense', categoryId: 'cat_housing', paymentMethod: 'Bank Transfer', date: formatOffsetDate(8), notes: 'July housing expense' },
      { title: 'Electric & Gas Bill', amount: 112.4, type: 'expense', categoryId: 'cat_utilities', paymentMethod: 'Debit Card', date: formatOffsetDate(4), notes: 'City Power & Gas' },
      { title: 'Uber Ride', amount: 24.5, type: 'expense', categoryId: 'cat_transport', paymentMethod: 'Credit Card', date: formatOffsetDate(2), notes: 'Ride to dinner' },
      { title: 'Sushi Dinner with Friends', amount: 124.8, type: 'expense', categoryId: 'cat_food', paymentMethod: 'Credit Card', date: formatOffsetDate(3), notes: 'Celebration dinner', tags: ['social', 'food'] },
      { title: 'Netflix Subscription', amount: 19.99, type: 'expense', categoryId: 'cat_entertainment', paymentMethod: 'Credit Card', date: formatOffsetDate(7), notes: 'Premium 4K streaming' },
      { title: 'Gym Membership', amount: 65, type: 'expense', categoryId: 'cat_healthcare', paymentMethod: 'Debit Card', date: formatOffsetDate(6), notes: 'Equinox subscription' },
      { title: 'Online Course - React 19', amount: 49.99, type: 'expense', categoryId: 'cat_education', paymentMethod: 'PayPal', date: formatOffsetDate(5), notes: 'Udemy masterclass' },
      { title: 'Nike Running Shoes', amount: 135, type: 'expense', categoryId: 'cat_shopping', paymentMethod: 'Credit Card', date: formatOffsetDate(2), notes: 'Pegasus 40 shoes', tags: ['fitness', 'shopping'] },
      { title: 'Gas Station Refill', amount: 45, type: 'expense', categoryId: 'cat_transport', paymentMethod: 'Debit Card', date: formatOffsetDate(5), notes: 'Commute fuel' },
    ];

    seedTxns.forEach(t => this.addTransaction(userId, t));

    // Save Budgets
    const seedBudgets: Omit<Budget, 'id' | 'userId'>[] = [
      { categoryId: 'cat_food', amount: 600, month: currentMonth, year: currentYear },
      { categoryId: 'cat_housing', amount: 1900, month: currentMonth, year: currentYear },
      { categoryId: 'cat_utilities', amount: 200, month: currentMonth, year: currentYear },
      { categoryId: 'cat_transport', amount: 300, month: currentMonth, year: currentYear },
      { categoryId: 'cat_shopping', amount: 400, month: currentMonth, year: currentYear },
      { categoryId: 'cat_entertainment', amount: 150, month: currentMonth, year: currentYear },
    ];

    seedBudgets.forEach(b => this.saveBudget(userId, b));

    // Save Savings Goals
    const seedGoals: Omit<SavingsGoal, 'id' | 'userId'>[] = [
      { name: 'Emergency Fund', targetAmount: 10000, currentAmount: 6500, deadline: `${currentYear}-12-31`, createdAt: formatOffsetDate(30) },
      { name: 'Japan Travel Trip', targetAmount: 4000, currentAmount: 1800, deadline: `${currentYear + 1}-04-15`, createdAt: formatOffsetDate(15) },
      { name: 'MacBook Pro M4', targetAmount: 2500, currentAmount: 2500, deadline: formatOffsetDate(1), createdAt: formatOffsetDate(45) },
    ];

    seedGoals.forEach(g => this.saveGoal(userId, g));

    // Add some initial notifications
    const seedNotifications: Omit<Notification, 'id' | 'userId' | 'date' | 'read'>[] = [
      { title: 'Goal Achieved! 🎉', message: 'Congratulations! You have completed your goal "MacBook Pro M4"!', type: 'goal_alert' },
      { title: 'Food Budget Alert ⚠️', message: 'You have used 63% of your Food & Dining budget.', type: 'budget_alert' },
      { title: 'Welcome to FinTrack!', message: 'Explore the dashboard, track your transactions, and build savings habits.', type: 'system' },
    ];

    seedNotifications.forEach(n => this.addNotification(userId, n));
  },

  resetAllData(): void {
    localStorage.clear();
  }
};
