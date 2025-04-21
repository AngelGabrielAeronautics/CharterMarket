import { db } from './firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

/**
 * Locks a document to prevent modifications
 * @param collectionPath The path to the collection
 * @param documentId The ID of the document to lock
 */
export async function lockDocument(collectionPath: string, documentId: string): Promise<void> {
  try {
    const docRef = doc(db, collectionPath, documentId);
    await updateDoc(docRef, {
      locked: true,
      lockedAt: new Date(),
    });
  } catch (error) {
    console.error('Error locking document:', error);
    throw new Error('Failed to lock document');
  }
}

/**
 * Unlocks a document to allow modifications
 * @param collectionPath The path to the collection
 * @param documentId The ID of the document to unlock
 */
export async function unlockDocument(collectionPath: string, documentId: string): Promise<void> {
  try {
    const docRef = doc(db, collectionPath, documentId);
    await updateDoc(docRef, {
      locked: false,
      lockedAt: null,
    });
  } catch (error) {
    console.error('Error unlocking document:', error);
    throw new Error('Failed to unlock document');
  }
}

/**
 * Checks if a document is locked
 * @param collectionPath The path to the collection
 * @param documentId The ID of the document to check
 * @returns boolean indicating if the document is locked
 */
export async function isDocumentLocked(collectionPath: string, documentId: string): Promise<boolean> {
  try {
    const docRef = doc(db, collectionPath, documentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Document does not exist');
    }
    
    return docSnap.data()?.locked === true;
  } catch (error) {
    console.error('Error checking document lock status:', error);
    throw new Error('Failed to check document lock status');
  }
} 