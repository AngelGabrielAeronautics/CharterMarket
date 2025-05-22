import { db, storage } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs, query, where, Timestamp, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Aircraft, AircraftFormData, AircraftAvailability, MaintenanceSchedule, AircraftImage, AircraftDocument } from '@/types/aircraft';
import { generateAircraftId } from '@/lib/serials';
import { logEvent } from '@/utils/eventLogger';
import { EventCategory, EventType, EventSeverity } from '@/types/event';

// Check if registration already exists
export const checkRegistrationExists = async (registration: string, operatorCode: string): Promise<boolean> => {
  const q = query(
    collection(db, 'operators', operatorCode, 'aircraft'),
    where('registration', '==', registration.toUpperCase())
  );
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
};

// Aircraft CRUD Operations
export const createAircraft = async (data: AircraftFormData, operatorCode: string) => {
  try {
    if (!operatorCode) {
      throw new Error('Operator code is required');
    }

    const exists = await checkRegistrationExists(data.registration, operatorCode);
    if (exists) {
      throw new Error('An aircraft with this registration already exists');
    }

    const formattedData = {
      ...data,
      registration: data.registration.toUpperCase(),
      operatorCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const aircraftRef = doc(collection(db, 'operators', operatorCode, 'aircraft'));
    await setDoc(aircraftRef, formattedData);

    // Log the aircraft creation event
    await logEvent({
      category: EventCategory.AIRCRAFT,
      type: EventType.AIRCRAFT_CREATED,
      severity: EventSeverity.INFO,
      userId: aircraftRef.id,
      userCode: operatorCode,
      userRole: 'operator',
      description: `Aircraft ${data.registration} created`,
      data: {
        aircraftId: aircraftRef.id,
        registration: data.registration,
        type: data.type,
        make: data.make,
        model: data.model,
        year: data.year,
        baseAirport: data.baseAirport,
        status: data.status,
      },
    });

    return aircraftRef.id;
  } catch (error) {
    console.error('Error creating aircraft:', error);
    throw error;
  }
};

export const updateAircraft = async (id: string, data: Partial<AircraftFormData>): Promise<void> => {
  try {
    const aircraftRef = doc(db, 'aircraft', id);
    await updateDoc(aircraftRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating aircraft:', error);
    throw new Error('Failed to update aircraft');
  }
};

export const getAircraft = async (id: string): Promise<Aircraft | null> => {
  try {
    const aircraftRef = doc(db, 'aircraft', id);
    const aircraftDoc = await getDoc(aircraftRef);
    
    if (!aircraftDoc.exists()) {
      return null;
    }

    return {
      id: aircraftDoc.id,
      ...aircraftDoc.data(),
    } as Aircraft;
  } catch (error) {
    console.error('Error getting aircraft:', error);
    throw new Error('Failed to get aircraft');
  }
};

// Aircraft Availability Management
export const createAvailabilityBlock = async (aircraftId: string, data: {
  startDate: Date;
  endDate: Date;
  type: 'blocked' | 'maintenance' | 'charter';
  notes?: string;
}): Promise<string> => {
  try {
    const blockRef = await addDoc(collection(db, 'aircraft', aircraftId, 'availability'), {
      ...data,
      startDate: Timestamp.fromDate(data.startDate),
      endDate: Timestamp.fromDate(data.endDate),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return blockRef.id;
  } catch (error) {
    console.error('Error creating availability block:', error);
    throw new Error('Failed to create availability block');
  }
};

export const addAircraftAvailability = createAvailabilityBlock;

export const getAircraftAvailability = async (
  aircraftId: string,
  startDate?: Date,
  endDate?: Date
): Promise<AircraftAvailability[]> => {
  try {
    const availabilityRef = collection(db, 'aircraft', aircraftId, 'availability');
    let q = query(availabilityRef);
    if (startDate) {
      q = query(q, where('startDate', '>=', Timestamp.fromDate(startDate)));
    }
    if (endDate) {
      q = query(q, where('endDate', '<=', Timestamp.fromDate(endDate)));
    }
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as AircraftAvailability[];
  } catch (error) {
    console.error('Error getting aircraft availability:', error);
    throw new Error('Failed to get aircraft availability');
  }
};

// Maintenance Schedule Management
export const createMaintenanceRecord = async (aircraftId: string, data: {
  type: 'scheduled' | 'unscheduled' | 'inspection';
  description: string;
  startDate: Date;
  endDate: Date;
  technician: string;
  notes?: string;
}): Promise<string> => {
  try {
    const maintenanceRef = await addDoc(collection(db, 'aircraft', aircraftId, 'maintenance'), {
      ...data,
      startDate: Timestamp.fromDate(data.startDate),
      endDate: Timestamp.fromDate(data.endDate),
      status: 'scheduled',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return maintenanceRef.id;
  } catch (error) {
    console.error('Error creating maintenance record:', error);
    throw new Error('Failed to create maintenance record');
  }
};

export const getMaintenanceSchedule = async (aircraftId: string): Promise<MaintenanceSchedule[]> => {
  try {
    const maintenanceRef = collection(db, 'aircraft', aircraftId, 'maintenance');
    const querySnapshot = await getDocs(maintenanceRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as MaintenanceSchedule[];
  } catch (error) {
    console.error('Error getting maintenance schedule:', error);
    throw new Error('Failed to get maintenance schedule');
  }
};

export const updateMaintenanceRecord = async (aircraftId: string, maintenanceId: string, data: Partial<MaintenanceSchedule>): Promise<void> => {
  try {
    const maintenanceRef = doc(db, 'aircraft', aircraftId, 'maintenance', maintenanceId);
    await updateDoc(maintenanceRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating maintenance record:', error);
    throw new Error('Failed to update maintenance record');
  }
};

// Document Management
export const uploadAircraftDocument = async (aircraftId: string, file: File): Promise<AircraftDocument> => {
  try {
    // Upload file to storage
    const fileRef = ref(storage, `aircraft/${aircraftId}/documents/${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);

    // Create document record in Firestore
    const docRef = await addDoc(collection(db, 'aircraft', aircraftId, 'documents'), {
      name: file.name,
      type: file.type,
      size: file.size,
      url,
      uploadedAt: Timestamp.now(),
    });

    return {
      id: docRef.id,
      name: file.name,
      type: file.type,
      size: file.size,
      url,
      uploadedAt: Timestamp.now(),
    };
  } catch (error) {
    console.error('Error uploading aircraft document:', error);
    throw new Error('Failed to upload aircraft document');
  }
};

export const getAircraftDocuments = async (aircraftId: string): Promise<AircraftDocument[]> => {
  try {
    const documentsRef = collection(db, 'aircraft', aircraftId, 'documents');
    const querySnapshot = await getDocs(documentsRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as AircraftDocument[];
  } catch (error) {
    console.error('Error getting aircraft documents:', error);
    throw new Error('Failed to get aircraft documents');
  }
};

export const deleteAircraftDocument = async (aircraftId: string, documentId: string, fileName: string): Promise<void> => {
  try {
    // Delete file from storage
    const fileRef = ref(storage, `aircraft/${aircraftId}/documents/${fileName}`);
    await deleteObject(fileRef);

    // Delete document record from Firestore
    const docRef = doc(db, 'aircraft', aircraftId, 'documents', documentId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting aircraft document:', error);
    throw new Error('Failed to delete aircraft document');
  }
};

// Image Management
export const uploadAircraftImage = async (
  aircraftId: string,
  file: File,
  type: 'exterior' | 'interior' | 'layout' | 'cockpit',
  isPrimary: boolean = false
): Promise<AircraftImage> => {
  try {
    // Create a reference to the storage location
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `aircraft/${aircraftId}/images/${fileName}`);

    // Upload the file
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    // Create the image document in Firestore
    const imageRef = await addDoc(collection(db, 'aircraft', aircraftId, 'images'), {
      url,
      type,
      fileName,
      isPrimary,
      uploadedAt: new Date().toISOString(),
    });

    return {
      id: imageRef.id,
      url,
      type,
      fileName,
      isPrimary,
      uploadedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error uploading aircraft image:', error);
    throw new Error('Failed to upload aircraft image');
  }
};

export const deleteAircraftImage = async (
  aircraftId: string,
  imageId: string,
  fileName: string
): Promise<void> => {
  try {
    // Delete the file from storage
    const storageRef = ref(storage, `aircraft/${aircraftId}/images/${fileName}`);
    await deleteObject(storageRef);

    // Delete the image document from Firestore
    const imageRef = doc(db, 'aircraft', aircraftId, 'images', imageId);
    await deleteDoc(imageRef);
  } catch (error) {
    console.error('Error deleting aircraft image:', error);
    throw new Error('Failed to delete aircraft image');
  }
};