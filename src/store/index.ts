import { create } from 'zustand';
import { User, Transaction, Category, Budget, SavingsGoal, Settings, Notification } from '../types';
import { auth, db } from '../services/firebase';
import { 
  signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile
} from 'firebase/auth';
import { 
  collection, doc, getDoc, setDoc, updateDoc, deleteDoc, 
  onSnapshot, query, orderBy, addDoc, serverTimestamp
} from 'firebase/firestore';
import { DEFAULT_CATEGORIES } from '../constants';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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
  login: (email: string, password?: string) => Promise<boolean>;
  signup: (name: string, email: string, password?: string) => Promise<boolean>;
  googleLogin: () => Promise<boolean>;
  logout: () => void;
  updateUserProfile: (updates: Partial<User>) => void;

  // Transaction Actions
  addTransaction: (txn: Omit<Transaction, 'id' | 'userId'>) => Promise<void>;
  updateTransaction: (txn: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Category Actions
  addCategory: (category: Omit<Category, 'id' | 'userId'>) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Budget Actions
  saveBudget: (budget: Omit<Budget, 'id' | 'userId'>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  // Goal Actions
  saveGoal: (goal: Omit<SavingsGoal, 'id' | 'userId'> | SavingsGoal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // Settings Actions
  updateSettings: (settings: Settings) => Promise<void>;

  // Notification Actions
  addNotification: (title: string, message: string, type: Notification['type']) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;

  // Global Actions
  resetAllData: () => void;
}

let unsubscribers: (() => void)[] = [];

export const useStore = create<FinTrackStore>((set, get) => ({
  user: null,
  transactions: [],
  categories: [],
  budgets: [],
  goals: [],
  settings: null,
  notifications: [],
  isLoading: true,
  error: null,

  init: () => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          let userData: User;
          if (userDoc.exists()) {
            userData = userDoc.data() as User;
          } else {
            userData = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              currency: 'INR',
              theme: 'light',
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, userData);

            // Default categories
            for (const cat of DEFAULT_CATEGORIES) {
              const newCatRef = doc(collection(db, 'users', firebaseUser.uid, 'categories'));
              await setDoc(newCatRef, { ...cat, id: newCatRef.id, userId: firebaseUser.uid });
            }
            
            // Default settings
            const settingsDocRef = doc(db, 'users', firebaseUser.uid, 'settings', 'default');
            await setDoc(settingsDocRef, {
              darkMode: false,
              currency: 'INR',
              backupReminder: true,
              largeExpenseThreshold: 50000,
            });
          }

          set({ user: userData, isLoading: false });
          
          // Clear previous listeners
          unsubscribers.forEach(unsub => unsub());
          unsubscribers = [];

          // Subscribe to Settings
          unsubscribers.push(onSnapshot(doc(db, 'users', firebaseUser.uid, 'settings', 'default'), (doc) => {
            if (doc.exists()) {
              set({ settings: doc.data() as Settings });
            }
          }, (error) => handleFirestoreError(error, OperationType.GET, 'users/settings')));

          // Subscribe to Transactions
          const txnsQuery = query(collection(db, 'users', firebaseUser.uid, 'transactions'), orderBy('date', 'desc'));
          unsubscribers.push(onSnapshot(txnsQuery, (snapshot) => {
            const txns = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction));
            set({ transactions: txns });
          }, (error) => handleFirestoreError(error, OperationType.LIST, 'users/transactions')));

          // Subscribe to Categories
          const catsQuery = query(collection(db, 'users', firebaseUser.uid, 'categories'));
          unsubscribers.push(onSnapshot(catsQuery, (snapshot) => {
            const cats = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Category));
            set({ categories: cats });
          }, (error) => handleFirestoreError(error, OperationType.LIST, 'users/categories')));

          // Subscribe to Budgets
          const budgetsQuery = query(collection(db, 'users', firebaseUser.uid, 'budgets'));
          unsubscribers.push(onSnapshot(budgetsQuery, (snapshot) => {
            const budgets = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Budget));
            set({ budgets });
          }, (error) => handleFirestoreError(error, OperationType.LIST, 'users/budgets')));

          // Subscribe to Goals
          const goalsQuery = query(collection(db, 'users', firebaseUser.uid, 'goals'));
          unsubscribers.push(onSnapshot(goalsQuery, (snapshot) => {
            const goals = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SavingsGoal));
            set({ goals });
          }, (error) => handleFirestoreError(error, OperationType.LIST, 'users/goals')));

          // Subscribe to Notifications
          const notifsQuery = query(collection(db, 'users', firebaseUser.uid, 'notifications'), orderBy('date', 'desc'));
          unsubscribers.push(onSnapshot(notifsQuery, (snapshot) => {
            const notifications = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Notification));
            set({ notifications });
          }, (error) => handleFirestoreError(error, OperationType.LIST, 'users/notifications')));

        } catch (error) {
          console.error(error);
          set({ isLoading: false, error: 'Failed to load user data' });
        }
      } else {
        set({
          user: null,
          transactions: [],
          categories: [],
          budgets: [],
          goals: [],
          settings: null,
          notifications: [],
          isLoading: false,
        });
        unsubscribers.forEach(unsub => unsub());
        unsubscribers = [];
      }
    });
  },

  login: async (email, password = 'dummy_password_for_simulation') => {
    set({ isLoading: true, error: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (err) {
      set({ isLoading: false, error: 'Failed to login' });
      return false;
    }
  },

  signup: async (name, email, password = 'dummy_password_for_simulation') => {
    set({ isLoading: true, error: null });
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      return true;
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Failed to sign up' });
      return false;
    }
  },

  googleLogin: async () => {
    set({ isLoading: true, error: null });
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      return true;
    } catch (err) {
      set({ isLoading: false, error: 'Google sign in failed' });
      return false;
    }
  },

  logout: async () => {
    await signOut(auth);
  },

  updateUserProfile: async (updates) => {
    const { user } = get();
    if (!user) return;
    try {
      const updatedUser = { ...user, ...updates };
      await updateDoc(doc(db, 'users', user.id), updates);
      if (updates.name && auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: updates.name });
      }
      set({ user: updatedUser });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    }
  },

  // --- TRANSACTIONS ---
  addTransaction: async (txn) => {
    const { user, settings } = get();
    if (!user) return;
    try {
      const newTxnRef = doc(collection(db, 'users', user.id, 'transactions'));
      const newTxn = { ...txn, id: newTxnRef.id, userId: user.id };
      await setDoc(newTxnRef, newTxn);

      if (settings && txn.type === 'expense' && txn.amount >= settings.largeExpenseThreshold) {
        await get().addNotification(
          'Large Expense Added 💸',
          `A large expense of ${settings.currency} ${txn.amount.toLocaleString()} for "${txn.title}" was recorded.`,
          'large_expense'
        );
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'users/transactions');
    }
  },

  updateTransaction: async (txn) => {
    const { user } = get();
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.id, 'transactions', txn.id), { ...txn });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users/transactions');
    }
  },

  deleteTransaction: async (id) => {
    const { user } = get();
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.id, 'transactions', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'users/transactions');
    }
  },

  // --- CATEGORIES ---
  addCategory: async (category) => {
    const { user } = get();
    if (!user) return;
    try {
      const newCatRef = doc(collection(db, 'users', user.id, 'categories'));
      await setDoc(newCatRef, { ...category, id: newCatRef.id, userId: user.id });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'users/categories');
    }
  },

  updateCategory: async (category) => {
    const { user } = get();
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.id, 'categories', category.id), { ...category });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users/categories');
    }
  },

  deleteCategory: async (id) => {
    const { user } = get();
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.id, 'categories', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'users/categories');
    }
  },

  // --- BUDGETS ---
  saveBudget: async (budget) => {
    const { user } = get();
    if (!user) return;
    try {
      if ('id' in budget && (budget as any).id) {
        await updateDoc(doc(db, 'users', user.id, 'budgets', (budget as any).id), { ...budget });
      } else {
        const newBudgetRef = doc(collection(db, 'users', user.id, 'budgets'));
        await setDoc(newBudgetRef, { ...budget, id: newBudgetRef.id, userId: user.id });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users/budgets');
    }
  },

  deleteBudget: async (id) => {
    const { user } = get();
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.id, 'budgets', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'users/budgets');
    }
  },

  // --- SAVINGS GOALS ---
  saveGoal: async (goal) => {
    const { user } = get();
    if (!user) return;
    try {
      if ('id' in goal && (goal as any).id) {
        await updateDoc(doc(db, 'users', user.id, 'goals', (goal as any).id), { ...goal });
      } else {
        const newGoalRef = doc(collection(db, 'users', user.id, 'goals'));
        await setDoc(newGoalRef, { ...goal, id: newGoalRef.id, userId: user.id });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users/goals');
    }
  },

  deleteGoal: async (id) => {
    const { user } = get();
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.id, 'goals', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'users/goals');
    }
  },

  // --- SETTINGS ---
  updateSettings: async (settings) => {
    const { user } = get();
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.id, 'settings', 'default'), { ...settings });
      if (settings.darkMode) {
        get().updateUserProfile({ theme: 'dark' });
      } else {
        get().updateUserProfile({ theme: 'light' });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users/settings');
    }
  },

  // --- NOTIFICATIONS ---
  addNotification: async (title, message, type) => {
    const { user } = get();
    if (!user) return;
    try {
      const notifRef = doc(collection(db, 'users', user.id, 'notifications'));
      await setDoc(notifRef, {
        id: notifRef.id,
        userId: user.id,
        title,
        message,
        type,
        date: new Date().toISOString(),
        read: false
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'users/notifications');
    }
  },

  markNotificationRead: async (id) => {
    const { user } = get();
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.id, 'notifications', id), { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users/notifications');
    }
  },

  markAllNotificationsRead: async () => {
    const { user, notifications } = get();
    if (!user) return;
    try {
      await Promise.all(
        notifications.filter(n => !n.read).map(n => 
          updateDoc(doc(db, 'users', user.id, 'notifications', n.id), { read: true })
        )
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users/notifications');
    }
  },

  clearNotifications: async () => {
    const { user, notifications } = get();
    if (!user) return;
    try {
      await Promise.all(
        notifications.map(n => 
          deleteDoc(doc(db, 'users', user.id, 'notifications', n.id))
        )
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'users/notifications');
    }
  },

  // --- GLOBAL ---
  resetAllData: () => {
    // Only sign out in a connected environment (can't easily wipe all user subcollections here without server-side functions)
    signOut(auth);
  }
}));
