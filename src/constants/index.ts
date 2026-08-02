import { Category } from '../types';

export const CURRENCIES = [
  { code: 'INR', symbol: 'Rs', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
];

export const PAYMENT_METHODS = [
  'Cash',
  'Debit Card',
  'Credit Card',
  'Bank Transfer',
  'Mobile Payment',
  'PayPal',
];

export const DEFAULT_CATEGORIES: Category[] = [
  // Expense Categories
  { id: 'cat_food', userId: 'system', name: 'Food & Dining', icon: 'Utensils', color: 'emerald', type: 'expense' },
  { id: 'cat_housing', userId: 'system', name: 'Housing & Rent', icon: 'Home', color: 'blue', type: 'expense' },
  { id: 'cat_utilities', userId: 'system', name: 'Utilities & Bills', icon: 'Zap', color: 'amber', type: 'expense' },
  { id: 'cat_transport', userId: 'system', name: 'Transportation', icon: 'Car', color: 'indigo', type: 'expense' },
  { id: 'cat_shopping', userId: 'system', name: 'Shopping', icon: 'ShoppingBag', color: 'pink', type: 'expense' },
  { id: 'cat_entertainment', userId: 'system', name: 'Entertainment', icon: 'Film', color: 'violet', type: 'expense' },
  { id: 'cat_healthcare', userId: 'system', name: 'Healthcare', icon: 'HeartPulse', color: 'rose', type: 'expense' },
  { id: 'cat_education', userId: 'system', name: 'Education', icon: 'GraduationCap', color: 'sky', type: 'expense' },
  { id: 'cat_travel', userId: 'system', name: 'Travel', icon: 'Plane', color: 'cyan', type: 'expense' },
  
  // Income Categories
  { id: 'cat_salary', userId: 'system', name: 'Salary', icon: 'Briefcase', color: 'green', type: 'income' },
  { id: 'cat_freelance', userId: 'system', name: 'Freelance & Side Hustles', icon: 'Laptop', color: 'teal', type: 'income' },
  { id: 'cat_investments', userId: 'system', name: 'Investments', icon: 'TrendingUp', color: 'purple', type: 'income' },
  { id: 'cat_gifts', userId: 'system', name: 'Gifts & Grants', icon: 'Gift', color: 'orange', type: 'income' },
];
