import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { Rating } from '@/types/rating';

const ratingsCollection = collection(db, 'ratings');

/**
 * Create a new rating for a booking
 */
export const createRating = async (
  bookingId: string,
  operatorId: string,
  customerUserCode: string,
  ratingValue: number,
  comments?: string
): Promise<string> => {
  const ratingData: Omit<Rating, 'id'> = {
    bookingId,
    operatorId,
    customerUserCode,
    rating: ratingValue,
    comments,
    createdAt: Timestamp.now(),
  };
  const docRef = await addDoc(ratingsCollection, ratingData);
  return docRef.id;
};

/**
 * Fetch the rating for a specific booking (if any)
 */
export const getRatingForBooking = async (bookingId: string): Promise<Rating | null> => {
  const q = query(ratingsCollection, where('bookingId', '==', bookingId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Rating;
};
