import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  documentId,
} from 'firebase/firestore';
import { Client, ClientFormData } from '@/types/client';
import { generateClientId } from '@/lib/serials';

/**
 * Create a new client
 */
export const createClient = async (
  agentUserCode: string,
  data: ClientFormData
): Promise<string> => {
  try {
    console.log(`Creating client - Agent UserCode: ${agentUserCode}`);

    const clientId = await generateClientId(agentUserCode);

    const clientData = {
      ...data,
      clientId,
      agentUserCode,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'clients'), clientData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating client:', error);
    throw new Error('Failed to create client. Please try again.');
  }
};

/**
 * Get all clients for an agent
 */
export const getAgentClients = async (agentUserCode: string): Promise<Client[]> => {
  try {
    const clientsQuery = query(
      collection(db, 'clients'),
      where('agentUserCode', '==', agentUserCode),
      orderBy('updatedAt', 'desc')
    );

    const querySnapshot = await getDocs(clientsQuery);

    return querySnapshot.docs.map(
      (doc) =>
        (({
          id: doc.id,
          ...doc.data()
        }) as Client)
    );
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw new Error('Failed to fetch clients. Please try again.');
  }
};

/**
 * Get all clients (for admins)
 */
export const getAllClients = async (): Promise<Client[]> => {
  try {
    const clientsQuery = query(collection(db, 'clients'), orderBy('updatedAt', 'desc'));

    const querySnapshot = await getDocs(clientsQuery);

    return querySnapshot.docs.map(
      (doc) =>
        (({
          id: doc.id,
          ...doc.data()
        }) as Client)
    );
  } catch (error) {
    console.error('Error fetching all clients:', error);
    throw new Error('Failed to fetch clients. Please try again.');
  }
};

/**
 * Get a client by ID
 */
export const getClientById = async (clientId: string): Promise<Client | null> => {
  try {
    const docRef = doc(db, 'clients', clientId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Client;
    }

    return null;
  } catch (error) {
    console.error('Error fetching client:', error);
    throw new Error('Failed to fetch client details. Please try again.');
  }
};

/**
 * Update a client
 */
export const updateClient = async (
  clientId: string,
  data: Partial<ClientFormData>
): Promise<void> => {
  try {
    const docRef = doc(db, 'clients', clientId);

    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating client:', error);
    throw new Error('Failed to update client. Please try again.');
  }
};

/**
 * Delete a client
 */
export const deleteClient = async (clientId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'clients', clientId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting client:', error);
    throw new Error('Failed to delete client. Please try again.');
  }
};
