import {
  ref,
  set,
  get,
  update,
  remove,
  push,
  DatabaseReference,
  DataSnapshot,
} from "firebase/database";
import { database } from "./firebase";

// Write data to a specific path
export const writeData = async <T>(path: string, data: T): Promise<void> => {
  const dbRef = ref(database, path);
  await set(dbRef, data);
};

// Read data from a specific path
export const readData = async <T>(path: string): Promise<T | null> => {
  const dbRef = ref(database, path);
  const snapshot = await get(dbRef);

  if (snapshot.exists()) {
    return snapshot.val() as T;
  } else {
    return null;
  }
};

// Update specific fields at a path
export const updateData = async (
  path: string,
  updates: Record<string, any>,
): Promise<void> => {
  const dbRef = ref(database, path);
  await update(dbRef, updates);
};

// Remove data at a specific path
export const removeData = async (path: string): Promise<void> => {
  const dbRef = ref(database, path);
  await remove(dbRef);
};

// Generate a new child with a unique key and set data
export const pushData = async <T>(path: string, data: T): Promise<string> => {
  const dbRef = ref(database, path);
  const newChildRef = push(dbRef);
  await set(newChildRef, data);
  return newChildRef.key as string;
};

// Query data in the database
export const queryDatabase = async <T>(
  path: string,
  queryFn: (dbRef: DatabaseReference) => any,
): Promise<T[]> => {
  const dbRef = ref(database, path);
  const queryRef = queryFn(dbRef);
  const snapshot = await get(queryRef);

  const results: T[] = [];
  if (snapshot.exists()) {
    snapshot.forEach((childSnapshot: DataSnapshot) => {
      results.push({
        id: childSnapshot.key,
        ...childSnapshot.val(),
      } as T);
    });
  }

  return results;
};
