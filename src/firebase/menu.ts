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
import type { MenuItem } from '../types';

const COLLECTION_MENU = 'menu';

/** Firestore document shape: same as MenuItem (id = doc id). */
interface MenuItemDoc {
  name: string;
  category: 'drink' | 'food';
  price: number;
  points: number;
}

function docToItem(id: string, data: MenuItemDoc): MenuItem {
  return {
    id,
    name: data.name ?? '',
    category: data.category ?? 'drink',
    price: Number(data.price) ?? 0,
    points: Number(data.points) ?? 0,
  };
}

/**
 * Subscribe to all menu items (sorted by category then name). Returns unsubscribe function.
 */
export function subscribeMenu(onUpdate: (items: MenuItem[]) => void): Unsubscribe {
  return onSnapshot(collection(db, COLLECTION_MENU), (snapshot) => {
    const items = snapshot.docs
      .map((d) => docToItem(d.id, d.data() as MenuItemDoc))
      .sort((a, b) => (a.category !== b.category ? (a.category === 'drink' ? -1 : 1) : a.name.localeCompare(b.name)));
    onUpdate(items);
  });
}

export async function addMenuItem(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
  const id = `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const docData: MenuItemDoc = {
    name: item.name,
    category: item.category,
    price: item.price,
    points: item.points,
  };
  await setDoc(doc(db, COLLECTION_MENU, id), docData);
  return { id, ...docData };
}

export async function updateMenuItem(
  id: string,
  data: Partial<Pick<MenuItem, 'name' | 'price' | 'points'>>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION_MENU, id), data as Record<string, unknown>);
}

export async function deleteMenuItem(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION_MENU, id));
}

/**
 * Seed the menu collection with initial data (call once if empty). Idempotent if docs exist.
 */
export async function seedMenuIfEmpty(initialItems: MenuItem[]): Promise<void> {
  const snapshot = await getDocs(collection(db, COLLECTION_MENU));
  if (snapshot.size > 0) return;
  for (const item of initialItems) {
    await setDoc(doc(db, COLLECTION_MENU, item.id), {
      name: item.name,
      category: item.category,
      price: item.price,
      points: item.points,
    });
  }
}
