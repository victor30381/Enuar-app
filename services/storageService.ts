import { WodEntry } from '../types';

const STORAGE_KEY = 'ENUAR_WODS_DATA';

export const getWods = (): WodEntry[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error loading WODs", error);
    return [];
  }
};

export const getWodsByDate = (dateIso: string): WodEntry[] => {
  const wods = getWods();
  return wods.filter(w => w.date === dateIso);
};

export const getWodById = (id: string): WodEntry | undefined => {
  const wods = getWods();
  return wods.find(w => w.id === id);
};

export const saveWod = (entry: WodEntry): void => {
  const wods = getWods();
  const existingIndex = wods.findIndex(w => w.id === entry.id);

  if (existingIndex >= 0) {
    wods[existingIndex] = entry;
  } else {
    // If no ID (shouldn't happen with proper logic but safe to handle) or new ID
    if (!entry.id) {
      entry.id = crypto.randomUUID();
    }
    wods.push(entry);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(wods));
};

export const deleteWod = (id: string): void => {
  const wods = getWods();
  const newWods = wods.filter(w => w.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newWods));
};