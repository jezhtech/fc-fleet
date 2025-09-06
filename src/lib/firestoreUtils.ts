import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  DocumentData,
  QueryConstraint,
  addDoc,
} from "firebase/firestore";
import { firestore } from "./firebase";

// Create a new document or replace an existing one
export const createDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: T,
): Promise<void> => {
  const docRef = doc(firestore, collectionName, docId);
  await setDoc(docRef, data);
};

// Add a document with auto-generated ID
export const addDocument = async <T extends DocumentData>(
  collectionName: string,
  data: T,
): Promise<string> => {
  const collectionRef = collection(firestore, collectionName);
  const docRef = await addDoc(collectionRef, data);
  return docRef.id;
};

// Get a document by ID
export const getDocument = async <T = DocumentData>(
  collectionName: string,
  docId: string,
): Promise<T | null> => {
  const docRef = doc(firestore, collectionName, docId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as T;
  } else {
    return null;
  }
};

// Update a document by ID
export const updateDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: Partial<T>,
): Promise<void> => {
  const docRef = doc(firestore, collectionName, docId);
  // Cast the data to any to bypass the strict type checking
  // This is necessary because of TypeScript's strict typing with Firestore generics
  await updateDoc(docRef, data as any);
};

// Delete a document by ID
export const deleteDocument = async (
  collectionName: string,
  docId: string,
): Promise<void> => {
  const docRef = doc(firestore, collectionName, docId);
  await deleteDoc(docRef);
};

// Query documents in a collection
export const queryDocuments = async <T = DocumentData>(
  collectionName: string,
  ...queryConstraints: QueryConstraint[]
): Promise<T[]> => {
  const collectionRef = collection(firestore, collectionName);
  const q = query(collectionRef, ...queryConstraints);
  const querySnapshot = await getDocs(q);

  const results: T[] = [];
  querySnapshot.forEach((doc) => {
    results.push({ id: doc.id, ...doc.data() } as T);
  });

  return results;
};

// Get all documents from a collection
export const getAllDocuments = async <T = DocumentData>(
  collectionName: string,
): Promise<T[]> => {
  const collectionRef = collection(firestore, collectionName);
  const querySnapshot = await getDocs(collectionRef);

  const results: T[] = [];
  querySnapshot.forEach((doc) => {
    results.push({ id: doc.id, ...doc.data() } as T);
  });

  return results;
};
