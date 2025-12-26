export interface WodSection {
  id: string;
  title: string;
  content: string;
}

export interface WodEntry {
  id: string;
  date: string; // ISO format YYYY-MM-DD
  title: string;
  content: string; // The actual workout text (legacy/fallback)
  sections?: WodSection[];
}

export enum ViewMode {
  CALENDAR = 'CALENDAR',
  WOD_DISPLAY = 'WOD_DISPLAY'
}

export interface DayCell {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  wodCount: number; // Number of WODs on this date
}