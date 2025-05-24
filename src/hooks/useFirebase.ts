import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  QueryConstraint, 
  query,
  DocumentData
} from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import { firestore as firestoreDB, database } from '../lib/firebase';
import * as fsUtils from '../lib/firestoreUtils';
import * as dbUtils from '../lib/databaseUtils';

// Firestore hook to listen to a document
export const useFirestoreDocument = <T = DocumentData>(
  collectionName: string, 
  docId: string
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const docRef = doc(firestoreDB, collectionName, docId);
    
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData(snapshot.data() as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, docId]);

  return { data, loading, error };
};

// Firestore hook to listen to a collection
export const useFirestoreCollection = <T = DocumentData>(
  collectionName: string,
  ...queryConstraints: QueryConstraint[]
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const collectionRef = collection(firestoreDB, collectionName);
    const q = queryConstraints.length > 0 
      ? query(collectionRef, ...queryConstraints) 
      : collectionRef;
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const results: T[] = [];
        snapshot.forEach((doc) => {
          results.push({ id: doc.id, ...doc.data() } as T);
        });
        setData(results);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, queryConstraints]);

  return { data, loading, error };
};

// Realtime Database hook to listen to a path
export const useRealtimeDatabase = <T>(path: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const dbRef = ref(database, path);
    
    const unsubscribe = onValue(
      dbRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData(snapshot.val() as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [path]);

  return { data, loading, error };
};

// Export all utilities
export const firestoreUtilities = {
  createDocument: fsUtils.createDocument,
  addDocument: fsUtils.addDocument,
  getDocument: fsUtils.getDocument,
  updateDocument: fsUtils.updateDocument,
  deleteDocument: fsUtils.deleteDocument,
  queryDocuments: fsUtils.queryDocuments,
  getAllDocuments: fsUtils.getAllDocuments
};

export const databaseUtilities = {
  writeData: dbUtils.writeData,
  readData: dbUtils.readData,
  updateData: dbUtils.updateData,
  removeData: dbUtils.removeData,
  pushData: dbUtils.pushData,
  queryDatabase: dbUtils.queryDatabase
}; 