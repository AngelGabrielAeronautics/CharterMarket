import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, query, where, getDocs, doc, Timestamp } from 'firebase/firestore';
import { generateQuoteId } from '@/lib/serials';
import { Quote, QuoteFormData, QuoteStatus } from '@/types/quote';

/**
 * Create a new quote for a flight request
 */
export const createQuote = async (
  requestId: string,
  operatorId: string,
  data: QuoteFormData
): Promise<string> => {
  try {
    const quoteCode = generateQuoteId(operatorId);
    const commission = parseFloat((data.price * 0.03).toFixed(2));
    const totalPrice = parseFloat((data.price + commission).toFixed(2));
    const quoteData = {
      quoteId: quoteCode,
      requestId,
      operatorId,
      price: data.price,
      commission,
      totalPrice,
      status: 'pending' as QuoteStatus,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, 'quotes'), quoteData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating quote:', error);
    throw new Error('Failed to create quote');
  }
};

/**
 * Fetch all quotes for a given flight request
 */
export const getQuotesForRequest = async (
  requestId: string
): Promise<Quote[]> => {
  try {
    const q = query(
      collection(db, 'quotes'),
      where('requestId', '==', requestId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Quote[];
  } catch (error) {
    console.error('Error fetching quotes:', error);
    throw new Error('Failed to fetch quotes');
  }
};

/**
 * Update the status of a quote
 */
export const updateQuoteStatus = async (
  quoteDocId: string,
  status: QuoteStatus
): Promise<void> => {
  try {
    const quoteRef = doc(db, 'quotes', quoteDocId);
    await updateDoc(quoteRef, { status, updatedAt: Timestamp.now() });
  } catch (error) {
    console.error('Error updating quote status:', error);
    throw new Error('Failed to update quote');
  }
}; 