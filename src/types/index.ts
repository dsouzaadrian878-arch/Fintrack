export interface User {
  id: string;
  name: string;
  email: string;
  currency: string;
  theme: 'light' | 'dark';
  createdAt: string;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  userId: string;
  title: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  paymentMethod: string;
  date: string; // YYYY-MM-DD
  notes?: string;
  tags?: string[];
}

export interface Category {
  id: string;
  userId: string; // 'system' for default, or userId for custom
  name: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color class or hex
  type: 'income' | 'expense' | 'all';
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string; // 'all' for total monthly budget, or specific categoryId
  amount: number;
  month: number; // 0-11
  year: number;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // YYYY-MM-DD
  createdAt: string;
}

export interface Settings {
  darkMode: boolean;
  currency: string;
  backupReminder: boolean;
  largeExpenseThreshold: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'budget_alert' | 'goal_alert' | 'large_expense' | 'system';
  read: boolean;
  date: string; // ISO string
}
