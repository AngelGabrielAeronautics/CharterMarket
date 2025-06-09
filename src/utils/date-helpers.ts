import { Timestamp } from 'firebase/firestore';

/**
 * Converts a Firestore Timestamp or a serialized representation of it into a JavaScript Date object.
 * This function handles cases where the timestamp is already a Date, a Firestore Timestamp,
 * or a plain object with `seconds` and `nanoseconds` (common after JSON serialization).
 *
 * @param dateValue The value to convert.
 * @returns A Date object, or null if the input is invalid.
 */
export function toDate(dateValue: any): Date | null {
  if (!dateValue) {
    return null;
  }

  // If it's already a Date object, return it.
  if (dateValue instanceof Date) {
    return dateValue;
  }

  // If it has a toDate method (like a Firestore Timestamp), use it.
  if (typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }

  // If it's a plain object with seconds and nanoseconds (from serialization).
  if (typeof dateValue === 'object' && 'seconds' in dateValue && 'nanoseconds' in dateValue) {
    return new Timestamp(dateValue.seconds, dateValue.nanoseconds).toDate();
  }

  // If it's a string or number that can be parsed by the Date constructor.
  const date = new Date(dateValue);
  if (!isNaN(date.getTime())) {
    return date;
  }

  return null;
}
