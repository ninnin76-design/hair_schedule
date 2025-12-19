import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, query, orderBy, writeBatch } from 'firebase/firestore';
import { Reservation, ReservationInput } from '../types';
import { DEFAULT_SERVICE_OPTIONS } from '../constants';

const COLLECTION_NAME = 'reservations';
const SERVICE_COLLECTION_NAME = 'service_types';

export const getReservations = async (): Promise<Reservation[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME));
    const querySnapshot = await getDocs(q);
    const reservations: Reservation[] = [];
    querySnapshot.forEach((doc) => {
      // Ensure we map the Firestore document ID to the 'id' field
      const data = doc.data();
      reservations.push({
        id: doc.id,
        customerName: data.customerName,
        customerPhone: data.customerPhone, // Mapped to customerPhone
        date: data.date,
        time: data.time,
        serviceType: data.serviceType, // Mapped to serviceType
        memo: data.memo,
        createdAt: data.createdAt
      } as Reservation);
    });
    return reservations;
  } catch (e) {
    console.error("Failed to load reservations from Firebase", e);
    return [];
  }
};

export const saveReservation = async (input: ReservationInput, id?: string): Promise<Reservation> => {
  if (id) {
    // Update existing document
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { ...input });
    
    // Fetch the updated doc to return the full object (including createdAt)
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error("Document not found");
    const data = snap.data();
    
    return {
      id: snap.id,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      date: data.date,
      time: data.time,
      serviceType: data.serviceType,
      memo: data.memo,
      createdAt: data.createdAt
    } as Reservation;

  } else {
    // Create new document
    const createdAt = Date.now();
    const newDocData = { ...input, createdAt };
    const docRef = await addDoc(collection(db, COLLECTION_NAME), newDocData);
    
    return {
      id: docRef.id,
      ...newDocData
    } as Reservation;
  }
};

export const deleteReservation = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};

// --- Service Types Management ---

export const getServiceOptions = async (): Promise<string[]> => {
  try {
    const q = query(collection(db, SERVICE_COLLECTION_NAME), orderBy('order'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Seed database if empty
      console.log("Seeding service types...");
      const batch = writeBatch(db);
      const createdServices: string[] = [];
      
      DEFAULT_SERVICE_OPTIONS.forEach((name, index) => {
        const ref = doc(collection(db, SERVICE_COLLECTION_NAME));
        batch.set(ref, { name, order: index });
        createdServices.push(name);
      });
      
      await batch.commit();
      return createdServices;
    }

    // Get current options from DB
    const dbOptions = snapshot.docs.map(d => d.data().name as string);
    
    // Filter out '시술' and ensure it matches the latest DEFAULT_SERVICE_OPTIONS logic
    // We return the merged/cleaned list to ensure the owner's request is met immediately
    const filteredOptions = dbOptions.filter(opt => opt !== '시술');
    
    // Add missing required options
    const requiredOptions = ['드라이', '샴푸'];
    requiredOptions.forEach(opt => {
      if (!filteredOptions.includes(opt)) {
        filteredOptions.push(opt);
      }
    });

    return filteredOptions;
  } catch (e) {
    console.error("Failed to fetch service options", e);
    // Fallback to default if offline or error
    return DEFAULT_SERVICE_OPTIONS;
  }
};