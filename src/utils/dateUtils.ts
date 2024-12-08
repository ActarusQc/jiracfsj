import { isValid, format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const formatDate = (date: Date | undefined | string): string => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  if (!isValid(dateObj)) return '';
  
  return format(dateObj, 'EEE, d MMM', { locale: fr });
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const getWeekDays = (startDate: Date): Date[] => {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    return date;
  });
};

export const getMonthDays = (date: Date): Date[] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Get the first day of the week (0 = Sunday)
  let start = firstDay.getDay();
  // Adjust to start with Monday
  start = start === 0 ? 6 : start - 1;
  
  // Array to store all days
  const days: Date[] = [];
  
  // Add days from previous month
  for (let i = start - 1; i >= 0; i--) {
    const day = new Date(year, month, -i);
    days.push(day);
  }
  
  // Add all days of current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const day = new Date(year, month, i);
    days.push(day);
  }
  
  // Add days from next month to complete the grid
  const remainingDays = 42 - days.length; // 42 = 6 weeks * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    const day = new Date(year, month + 1, i);
    days.push(day);
  }
  
  return days;
};