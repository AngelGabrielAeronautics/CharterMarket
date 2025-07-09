import { db, storage } from '@/lib/firebase';
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
  Timestamp,
  setDoc,
  limit,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import {
  Aircraft,
  AircraftFormData,
  AircraftAvailability,
  MaintenanceSchedule,
  AircraftImage,
  AircraftDocument,
} from '@/types/aircraft';
import { generateAircraftId } from '@/lib/serials';
import { logEvent } from '@/utils/eventLogger';
import { EventCategory, EventType, EventSeverity } from '@/types/event';

// Check if registration already exists
export const checkRegistrationExists = async (
  registration: string,
  operatorCode: string
): Promise<boolean> => {
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

    // Separate images from other data for processing
    const { images, ...aircraftData } = data;

    const formattedData = {
      ...aircraftData,
      registration: data.registration.toUpperCase(),
      operatorCode,
      images: [], // Initialize with empty array
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Create aircraft first
    const aircraftRef = doc(collection(db, 'operators', operatorCode, 'aircraft'));
    await setDoc(aircraftRef, formattedData);

    // Process images if they exist
    if (images && images.length > 0) {
      console.log('Processing images for new aircraft...');
      const processedImages = await processImagesForSave(aircraftRef.id, images);
      
      // Update aircraft with processed images
      await updateDoc(aircraftRef, {
        images: processedImages,
        updatedAt: Timestamp.now(),
      });
      console.log('Images processed and saved successfully');
    }

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

// Helper function to process images before saving to database
export const processImagesForSave = async (
  aircraftId: string,
  images: (string | File)[]
): Promise<string[]> => {
  try {
    const processedImages: string[] = [];
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      if (typeof image === 'string') {
        // Already a URL, keep as is
        processedImages.push(image);
      } else {
        // It's a File object, upload it to Firebase Storage
        console.log(`Uploading image ${i + 1}/${images.length}:`, image.name);
        
        // Determine image type based on filename or use 'exterior' as default
        const imageType: 'exterior' | 'interior' | 'layout' | 'cockpit' = 'exterior';
        const isPrimary = i === 0; // First image is primary
        
        const uploadedImage = await uploadAircraftImage(
          aircraftId,
          image,
          imageType,
          isPrimary
        );
        
        processedImages.push(uploadedImage.url);
        console.log(`Successfully uploaded image:`, uploadedImage.url);
      }
    }
    
    return processedImages;
  } catch (error) {
    console.error('Error processing images for save:', error);
    throw new Error('Failed to upload images');
  }
};

export const updateAircraft = async (
  id: string,
  data: Partial<AircraftFormData>,
  operatorCode: string
): Promise<void> => {
  try {
    if (!operatorCode) {
      throw new Error('Operator code is required');
    }

    // Process images if they exist
    let processedData = { ...data };
    if (data.images && data.images.length > 0) {
      console.log('Processing images before save...');
      processedData.images = await processImagesForSave(id, data.images);
      console.log('Images processed successfully');
    }

    // Update aircraft in operator's subcollection
    const aircraftRef = doc(db, 'operators', operatorCode, 'aircraft', id);
    
    await updateDoc(aircraftRef, {
      ...processedData,
      updatedAt: Timestamp.now(),
    });

    // Log the update for audit purposes
    console.log('Aircraft updated successfully:', {
      aircraftId: id,
      operatorCode,
      updatedFields: Object.keys(processedData),
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

// Get single aircraft from operator's subcollection
export const getSingleOperatorAircraft = async (
  aircraftId: string,
  operatorCode: string
): Promise<Aircraft | null> => {
  try {
    if (!operatorCode || !aircraftId) {
      throw new Error('Operator code and aircraft ID are required');
    }

    const aircraftRef = doc(db, 'operators', operatorCode, 'aircraft', aircraftId);
    const aircraftDoc = await getDoc(aircraftRef);

    if (!aircraftDoc.exists()) {
      return null;
    }

    return {
      id: aircraftDoc.id,
      ...aircraftDoc.data(),
    } as Aircraft;
  } catch (error) {
    console.error('Error getting operator aircraft:', error);
    throw new Error('Failed to get aircraft');
  }
};

// Aircraft Availability Management
export const createAvailabilityBlock = async (
  aircraftId: string,
  data: {
    startDate: Date;
    endDate: Date;
    type: 'blocked' | 'maintenance' | 'charter';
    notes?: string;
  }
): Promise<string> => {
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

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AircraftAvailability[];
  } catch (error) {
    console.error('Error getting aircraft availability:', error);
    throw new Error('Failed to get aircraft availability');
  }
};

// Maintenance Schedule Management
export const createMaintenanceRecord = async (
  aircraftId: string,
  data: {
    type: 'scheduled' | 'unscheduled' | 'inspection';
    description: string;
    startDate: Date;
    endDate: Date;
    technician: string;
    notes?: string;
  }
): Promise<string> => {
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

export const getMaintenanceSchedule = async (
  aircraftId: string
): Promise<MaintenanceSchedule[]> => {
  try {
    const maintenanceRef = collection(db, 'aircraft', aircraftId, 'maintenance');
    const querySnapshot = await getDocs(maintenanceRef);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as MaintenanceSchedule[];
  } catch (error) {
    console.error('Error getting maintenance schedule:', error);
    throw new Error('Failed to get maintenance schedule');
  }
};

export const updateMaintenanceRecord = async (
  aircraftId: string,
  maintenanceId: string,
  data: Partial<MaintenanceSchedule>
): Promise<void> => {
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
export const uploadAircraftDocument = async (
  aircraftId: string,
  file: File
): Promise<AircraftDocument> => {
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

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AircraftDocument[];
  } catch (error) {
    console.error('Error getting aircraft documents:', error);
    throw new Error('Failed to get aircraft documents');
  }
};

export const deleteAircraftDocument = async (
  aircraftId: string,
  documentId: string,
  fileName: string
): Promise<void> => {
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

// Quote attachment management
export const uploadQuoteAttachment = async (
  quoteId: string,
  operatorUserCode: string,
  file: File
): Promise<{ url: string; fileName: string }> => {
  try {
    // Validate file type (only PDFs allowed)
    if (file.type !== 'application/pdf') {
      throw new Error('Only PDF files are allowed for quote attachments');
    }

    // Validate file size (max 3MB)
    const maxSize = 3 * 1024 * 1024; // 3MB
    if (file.size > maxSize) {
      throw new Error(`File "${file.name}" is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Files must be less than 3MB.`);
    }

    // Create a reference to the storage location
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `quotes/${operatorUserCode}/${quoteId}/${fileName}`);

    // Upload the file
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    return {
      url,
      fileName: file.name, // Return original filename
    };
  } catch (error) {
    console.error('Error uploading quote attachment:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to upload quote attachment');
  }
};

// Verify if attachments exist in storage (for error recovery)
export const verifyQuoteAttachments = async (
  quoteId: string,
  operatorUserCode: string,
  fileNames: string[]
): Promise<{ url: string; fileName: string; uploadedAt: Date }[]> => {
  try {
    console.log(`[${new Date().toISOString()}] Verifying ${fileNames.length} files in storage...`);
    const results: { url: string; fileName: string; uploadedAt: Date }[] = [];
    
    // Check multiple possible locations since temporary quote IDs might vary
    const possiblePaths = [
      `quotes/${operatorUserCode}/${quoteId}/`,
      `quotes/${operatorUserCode}/`, // Check parent directory too
    ];
    
    for (const fileName of fileNames) {
      console.log(`[${new Date().toISOString()}] Looking for file: ${fileName}`);
      let fileFound = false;
      
      for (const basePath of possiblePaths) {
        try {
          console.log(`[${new Date().toISOString()}] Checking path: ${basePath}`);
          const folderRef = ref(storage, basePath);
          const listResult = await listAll(folderRef);
          
          console.log(`[${new Date().toISOString()}] Found ${listResult.items.length} files in ${basePath}`);
          
          // Find files that end with the original filename or contain it
          const matchingFiles = listResult.items.filter(item => {
            const itemName = item.name.toLowerCase();
            const searchName = fileName.toLowerCase();
            return itemName.endsWith(searchName) || itemName.includes(searchName.replace(/\s+/g, ''));
          });
          
          console.log(`[${new Date().toISOString()}] Found ${matchingFiles.length} matching files for ${fileName}`);
          
          if (matchingFiles.length > 0) {
            // Get the download URL for the most recent matching file
            const fileRef = matchingFiles[matchingFiles.length - 1];
            console.log(`[${new Date().toISOString()}] Getting download URL for: ${fileRef.name}`);
            
            const url = await getDownloadURL(fileRef);
            
            results.push({
              url,
              fileName,
              uploadedAt: new Date() // We don't know the exact upload time, use current time
            });
            
            console.log(`[${new Date().toISOString()}] Verified existing file: ${fileName} -> ${fileRef.name}`);
            fileFound = true;
            break; // Found it, no need to check other paths
          }
        } catch (error) {
          console.warn(`[${new Date().toISOString()}] Could not check path ${basePath}:`, error);
        }
      }
      
      if (!fileFound) {
        console.warn(`[${new Date().toISOString()}] File not found in any location: ${fileName}`);
      }
    }
    
    console.log(`[${new Date().toISOString()}] Verification complete: ${results.length}/${fileNames.length} files found`);
    return results;
  } catch (error) {
    console.error('Error verifying quote attachments:', error);
    return [];
  }
};

// Test Firebase Storage connectivity
export const testStorageConnection = async (): Promise<boolean> => {
  try {
    console.log('Testing Firebase Storage connectivity...');
    
    // Create a minimal test reference to check if storage is accessible
    const testRef = ref(storage, 'connection-test/test.txt');
    
    // Create a small test file
    const testData = new Uint8Array([72, 101, 108, 108, 111]); // "Hello" in bytes
    
    // Try to upload and immediately delete the test file
    await uploadBytes(testRef, testData);
    
    // Get download URL to ensure the upload worked
    const url = await getDownloadURL(testRef);
    
    console.log('Firebase Storage connectivity test passed');
    return true;
  } catch (error) {
    console.error('Firebase Storage connectivity test failed:', error);
    return false;
  }
};

// Upload multiple quote attachments (up to 5 files) - Enhanced version
export const uploadMultipleQuoteAttachments = async (
  quoteId: string,
  operatorUserCode: string,
  files: File[]
): Promise<{ url: string; fileName: string; uploadedAt: Date }[]> => {
  try {
    console.log(`Starting upload of ${files.length} files for quote ${quoteId}`);
    
    // Validate number of files
    if (files.length > 5) {
      throw new Error('Maximum 5 files allowed');
    }

    if (files.length === 0) {
      return [];
    }

    // Validate each file
    for (const file of files) {
      console.log(`Validating file: ${file.name} (${file.size} bytes, ${file.type})`);
      
      // Validate file type (only PDFs allowed)
      if (file.type !== 'application/pdf') {
        throw new Error(`File "${file.name}" is not a PDF. Only PDF files are allowed.`);
      }

      // Validate file size (max 3MB)
      const maxSize = 3 * 1024 * 1024; // 3MB
      if (file.size > maxSize) {
        throw new Error(`File "${file.name}" is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Files must be less than 3MB.`);
      }
    }

    console.log('All files validated successfully');

    // Check Firebase Storage configuration before attempting upload
    try {
      console.log('Checking Firebase Storage configuration...');
      const testRef = ref(storage, 'test-connection');
      console.log('Firebase Storage initialized correctly');
    } catch (storageError) {
      console.error('Firebase Storage configuration error:', storageError);
      throw new Error('Firebase Storage is not properly configured. Please contact support.');
    }

    // Upload files sequentially instead of in parallel to avoid potential issues
    const results: { url: string; fileName: string; uploadedAt: Date }[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`[${new Date().toISOString()}] Starting upload ${i + 1}/${files.length}: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
      
      try {
        // Create unique filename with timestamp
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}_${file.name}`;
        const storagePath = `quotes/${operatorUserCode}/${quoteId}/${fileName}`;
        
        console.log(`[${new Date().toISOString()}] Storage path: ${storagePath}`);
        
        // Upload to Firebase Storage with enhanced error handling and timeout
        const storageRef = ref(storage, storagePath);
        console.log(`[${new Date().toISOString()}] Creating storage reference and starting upload...`);
        
        // Upload with timeout protection (increased to 90 seconds for better reliability)
        const uploadPromise = uploadBytes(storageRef, file);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Upload timeout for file ${file.name} after 90 seconds`)), 90000)
        );
        
        console.log(`[${new Date().toISOString()}] Starting Promise.race for upload vs timeout...`);
        await Promise.race([uploadPromise, timeoutPromise]);
        console.log(`[${new Date().toISOString()}] Upload completed, getting download URL...`);
        
        // Get download URL with retry logic
        let url: string;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            console.log(`[${new Date().toISOString()}] Attempting to get download URL (attempt ${retryCount + 1}/${maxRetries})...`);
            url = await getDownloadURL(storageRef);
            console.log(`[${new Date().toISOString()}] Download URL obtained: ${url.substring(0, 50)}...`);
            break;
          } catch (urlError) {
            retryCount++;
            if (retryCount >= maxRetries) {
              throw urlError;
            }
            console.log(`[${new Date().toISOString()}] Retrying getDownloadURL (attempt ${retryCount + 1}/${maxRetries})...`);
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        results.push({
          url: url!,
          fileName: file.name, // Return original filename for display
          uploadedAt: new Date()
        });
        
        console.log(`[${new Date().toISOString()}] Successfully uploaded file ${i + 1}/${files.length}: ${file.name}`);
      } catch (fileError) {
        console.error(`Error uploading file ${file.name}:`, fileError);
        
        // Enhanced error handling with specific error types
        if (fileError instanceof Error) {
          if (fileError.message.includes('storage/unauthorized')) {
            throw new Error(`Upload failed: You don't have permission to upload files. Please contact support.`);
          } else if (fileError.message.includes('storage/canceled')) {
            throw new Error(`Upload was cancelled. Please try again.`);
          } else if (fileError.message.includes('storage/retry-limit-exceeded')) {
            throw new Error(`Upload failed after multiple retries. Please check your internet connection and try again.`);
          } else if (fileError.message.includes('CORS')) {
            throw new Error(`Upload failed due to browser security settings. Please try refreshing the page and uploading again.`);
          } else if (fileError.message.includes('Failed to fetch') || fileError.message.includes('network')) {
            throw new Error(`Network error occurred while uploading "${file.name}". Please check your internet connection and try again.`);
          }
        }
        
        throw new Error(`Failed to upload "${file.name}": ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
      }
    }

    console.log(`All ${results.length} files uploaded successfully`);
    return results;
  } catch (error) {
    console.error('Error uploading quote attachments:', error);
    
    // Enhanced top-level error handling
    if (error instanceof Error) {
      // If it's already a user-friendly error, pass it through
      if (error.message.includes('Maximum 5 files') || 
          error.message.includes('is not a PDF') || 
          error.message.includes('must be less than 3MB') ||
          error.message.includes('Firebase Storage is not properly configured') ||
          error.message.includes('Upload failed:') ||
          error.message.includes('Network error') ||
          error.message.includes('Failed to upload')) {
        throw error;
      }
    }
    
    throw new Error(`Failed to upload attachments: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const deleteQuoteAttachment = async (
  quoteId: string,
  operatorUserCode: string,
  fileName: string
): Promise<void> => {
  try {
    // Delete the file from storage
    const storageRef = ref(storage, `quotes/${operatorUserCode}/${quoteId}/${fileName}`);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting quote attachment:', error);
    throw new Error('Failed to delete quote attachment');
  }
};

// Check if operator has any aircraft
export const operatorHasAircraft = async (operatorCode: string): Promise<boolean> => {
  try {
    const q = query(collection(db, 'operators', operatorCode, 'aircraft'), limit(1));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking if operator has aircraft:', error);
    return false;
  }
};

// Count aircraft for operator
export const countOperatorAircraft = async (operatorCode: string): Promise<number> => {
  try {
    const q = query(collection(db, 'operators', operatorCode, 'aircraft'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error counting operator aircraft:', error);
    return 0;
  }
};

// Delete aircraft function (was missing)
export const deleteAircraft = async (aircraftId: string, operatorCode: string): Promise<void> => {
  try {
    if (!operatorCode) {
      throw new Error('Operator code is required');
    }

    const aircraftRef = doc(db, 'operators', operatorCode, 'aircraft', aircraftId);

    // Get aircraft data for logging
    const aircraftDoc = await getDoc(aircraftRef);
    if (!aircraftDoc.exists()) {
      throw new Error('Aircraft not found');
    }

    const aircraftData = aircraftDoc.data();

    // Delete the aircraft document
    await deleteDoc(aircraftRef);

    // Log the aircraft deletion event
    await logEvent({
      category: EventCategory.AIRCRAFT,
      type: EventType.AIRCRAFT_DELETED,
      severity: EventSeverity.INFO,
      userId: aircraftId,
      userCode: operatorCode,
      userRole: 'operator',
      description: `Aircraft ${aircraftData.registration} deleted`,
      data: {
        aircraftId,
        registration: aircraftData.registration,
        type: aircraftData.type,
        make: aircraftData.make,
        model: aircraftData.model,
      },
    });
  } catch (error) {
    console.error('Error deleting aircraft:', error);
    throw error;
  }
};

// Get all aircraft for an operator
export const getOperatorAircraft = async (operatorCode: string, activeOnly: boolean = true): Promise<Aircraft[]> => {
  try {
    if (!operatorCode) {
      throw new Error('Operator code is required');
    }

    let q = query(collection(db, 'operators', operatorCode, 'aircraft'));
    
    // Filter by active status if requested
    if (activeOnly) {
      q = query(q, where('status', '==', 'ACTIVE'));
    }

    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Aircraft[];
  } catch (error) {
    console.error('Error getting operator aircraft:', error);
    throw new Error('Failed to get operator aircraft');
  }
};
