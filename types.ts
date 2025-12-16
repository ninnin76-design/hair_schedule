export interface Reservation {
  id: string;
  customerName: string;
  customerPhone: string; // Renamed from phoneNumber to match DB schema
  date: string; // ISO Date String YYYY-MM-DD
  time: string; // HH:mm
  serviceType: string; // Renamed from service to match DB schema
  memo: string;
  createdAt: number;
}

export type ReservationInput = Omit<Reservation, 'id' | 'createdAt'>;

export interface CalendarDay {
  dateStr: string; // YYYY-MM-DD
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
}