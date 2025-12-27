import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { WodEntry } from '../types';

// Helper to get current user ID
const getUserId = (): string | null => {
  return auth.currentUser?.uid || null;
};

// Get user's WODs collection reference
const getUserWodsCollection = () => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');
  return collection(db, 'users', userId, 'wods');
};

export const getWods = async (): Promise<WodEntry[]> => {
  try {
    const userId = getUserId();
    if (!userId) return [];

    const wodsRef = getUserWodsCollection();
    const q = query(wodsRef, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as WodEntry));
  } catch (error) {
    console.error("Error loading WODs from Firestore:", error);
    return [];
  }
};

export const getWodsByDate = async (dateIso: string): Promise<WodEntry[]> => {
  try {
    const userId = getUserId();
    if (!userId) return [];

    const wodsRef = getUserWodsCollection();
    const q = query(wodsRef, where('date', '==', dateIso));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as WodEntry));
  } catch (error) {
    console.error("Error loading WODs by date:", error);
    return [];
  }
};

export const getWodById = async (id: string): Promise<WodEntry | undefined> => {
  try {
    const userId = getUserId();
    if (!userId) return undefined;

    const wodRef = doc(db, 'users', userId, 'wods', id);
    const snapshot = await getDoc(wodRef);

    if (snapshot.exists()) {
      return {
        id: snapshot.id,
        ...snapshot.data()
      } as WodEntry;
    }
    return undefined;
  } catch (error) {
    console.error("Error loading WOD by ID:", error);
    return undefined;
  }
};

export const saveWod = async (entry: WodEntry): Promise<void> => {
  try {
    const userId = getUserId();
    if (!userId) throw new Error('User not authenticated');

    const wodId = entry.id || crypto.randomUUID();
    const wodRef = doc(db, 'users', userId, 'wods', wodId);

    await setDoc(wodRef, {
      ...entry,
      id: wodId,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error saving WOD:", error);
    throw error;
  }
};

export const deleteWod = async (id: string): Promise<void> => {
  try {
    const userId = getUserId();
    if (!userId) throw new Error('User not authenticated');

    const wodRef = doc(db, 'users', userId, 'wods', id);
    await deleteDoc(wodRef);
  } catch (error) {
    console.error("Error deleting WOD:", error);
    throw error;
  }
};

// Migration: Move localStorage WODs to Firestore (run once on first login)
export const migrateLocalStorageToFirestore = async (): Promise<number> => {
  const STORAGE_KEY = 'ENUAR_WODS_DATA';
  const MIGRATION_KEY = 'ENUAR_MIGRATION_COMPLETE';

  // Check if migration already done
  if (localStorage.getItem(MIGRATION_KEY)) {
    return 0;
  }

  try {
    const localData = localStorage.getItem(STORAGE_KEY);
    if (!localData) {
      localStorage.setItem(MIGRATION_KEY, 'true');
      return 0;
    }

    const localWods: WodEntry[] = JSON.parse(localData);
    if (localWods.length === 0) {
      localStorage.setItem(MIGRATION_KEY, 'true');
      return 0;
    }

    // Migrate each WOD to Firestore
    for (const wod of localWods) {
      await saveWod(wod);
    }

    // Mark migration complete
    localStorage.setItem(MIGRATION_KEY, 'true');
    console.log(`Migrated ${localWods.length} WODs to Firestore`);

    return localWods.length;
  } catch (error) {
    console.error("Error migrating WODs:", error);
    return 0;
  }
};