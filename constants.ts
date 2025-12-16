// Default values to seed the database if empty
export const DEFAULT_SERVICE_OPTIONS = [
  '컷',
  '펌',
  '매직',
  '셋팅',
  '염색',
  '클리닉',
  '시술'
];

export const TIME_SLOTS: string[] = [];
// Generate time slots from 10:10 to 19:30 every 10 minutes
const startHour = 10;
const startMin = 10;
const endHour = 19;
const endMin = 30;

for (let h = startHour; h <= endHour; h++) {
  for (let m = 0; m < 60; m += 10) {
    // Skip if before 10:10
    if (h === startHour && m < startMin) continue;
    // Stop if after 19:30
    if (h === endHour && m > endMin) break;
    
    const hourStr = h.toString().padStart(2, '0');
    const minStr = m.toString().padStart(2, '0');
    TIME_SLOTS.push(`${hourStr}:${minStr}`);
  }
}

export const STORAGE_KEY = 'salon_reservations_v1';

// Colors for UI consistency (Dark Theme)
export const THEME = {
  primary: 'blue-600',
  primaryHover: 'hover:bg-blue-500',
  primaryLight: 'bg-slate-800',
  secondary: 'slate-400',
};