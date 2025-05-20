import { Timestamp } from 'firebase/firestore';

export interface Rating {
  id: string;
  bookingId: string;
  operatorId: string;
  customerUserCode: string;
  rating: number; // 1-5
  comments?: string;
  createdAt: Timestamp;
}
