import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';
import type { Table } from '../types';

const COLLECTION_TABLES = 'tables';

/** Firestore document shape: same as Table (id = doc id). */
interface TableDoc {
  tableNumber: string;
  teamName: string;
}

function docToTable(id: string, data: TableDoc): Table {
  return {
    id,
    tableNumber: data.tableNumber ?? '',
    teamName: data.teamName ?? '',
  };
}

/**
 * Subscribe to all tables (sorted by tableNumber). Returns unsubscribe function.
 */
export function subscribeTables(onUpdate: (tables: Table[]) => void): Unsubscribe {
  return onSnapshot(collection(db, COLLECTION_TABLES), (snapshot) => {
    const tables = snapshot.docs
      .map((d) => docToTable(d.id, d.data() as TableDoc))
      .sort((a, b) => a.tableNumber.localeCompare(b.tableNumber, undefined, { numeric: true }));
    onUpdate(tables);
  });
}

export async function addTable(table: Omit<Table, 'id'>): Promise<Table> {
  const id = `table-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const docData: TableDoc = {
    tableNumber: table.tableNumber,
    teamName: table.teamName,
  };
  await setDoc(doc(db, COLLECTION_TABLES, id), docData);
  return { id, ...docData };
}

export async function updateTable(
  id: string,
  data: Partial<Pick<Table, 'teamName' | 'tableNumber'>>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION_TABLES, id), data as Record<string, unknown>);
}

export async function deleteTable(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION_TABLES, id));
}

/**
 * Seed the tables collection with initial data (call once if empty). Idempotent if docs exist.
 */
export async function seedTablesIfEmpty(initialTables: Table[]): Promise<void> {
  const snapshot = await getDocs(collection(db, COLLECTION_TABLES));
  if (snapshot.size > 0) return;
  for (const t of initialTables) {
    await setDoc(doc(db, COLLECTION_TABLES, t.id), {
      tableNumber: t.tableNumber,
      teamName: t.teamName,
    });
  }
}
