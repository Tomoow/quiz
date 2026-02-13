import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy as firestoreOrderBy,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';
import type { Order, OrderItem, OrderStatus } from '../types';

const COLLECTION_ORDERS = 'orders';

/** Firestore document shape. Supports bar (chronological) and ranking (points per team). */
interface OrderDoc {
  tableId: string;
  /** Present for new orders; legacy docs may lack it. */
  tableNumber?: string;
  teamName: string;
  items: OrderItem[];
  totalPrice: number;
  totalPoints: number;
  status: OrderStatus;
  createdAt: Timestamp;
}

function sanitizeItem(it: OrderItem): OrderItem {
  return {
    itemId: String(it?.itemId ?? ''),
    name: String(it?.name ?? ''),
    quantity: Number(it?.quantity) || 0,
    price: Number(it?.price) ?? 0,
    points: Number(it?.points) ?? 0,
  };
}

function docToOrder(id: string, data: OrderDoc): Order {
  const items = (data.items ?? []).map(sanitizeItem);
  return {
    id,
    tableId: data.tableId,
    tableNumber: data.tableNumber ?? '?',
    teamName: data.teamName,
    items,
    totalPrice: data.totalPrice ?? 0,
    totalPoints: data.totalPoints ?? 0,
    status: data.status ?? 'new',
    createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
  };
}

/**
 * Subscribe to all orders in real time (chronological for bar screen).
 * Returns unsubscribe function.
 */
export function subscribeOrders(onUpdate: (orders: Order[]) => void): Unsubscribe {
  const q = query(
    collection(db, COLLECTION_ORDERS),
    firestoreOrderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map((d) => docToOrder(d.id, d.data() as OrderDoc));
    onUpdate(orders);
  });
}

/**
 * Add a new order. Payload includes tableId, tableNumber, teamName, items (with price/points), totalPrice, totalPoints, status: "new".
 */
export async function addOrder(order: {
  tableId: string;
  tableNumber: string;
  teamName: string;
  items: OrderItem[];
  totalPrice: number;
  totalPoints: number;
}): Promise<Order> {
  const id = `order-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const docData: OrderDoc = {
    tableId: order.tableId,
    tableNumber: order.tableNumber,
    teamName: order.teamName,
    items: order.items.map(sanitizeItem),
    totalPrice: order.totalPrice,
    totalPoints: order.totalPoints,
    status: 'new',
    createdAt: Timestamp.now(),
  };
  await setDoc(doc(db, COLLECTION_ORDERS, id), docData);
  return {
    id,
    tableId: docData.tableId,
    tableNumber: docData.tableNumber ?? order.tableNumber ?? '?',
    teamName: docData.teamName,
    items: docData.items,
    totalPrice: docData.totalPrice,
    totalPoints: docData.totalPoints,
    status: docData.status,
    createdAt: docData.createdAt.toMillis(),
  };
}

/**
 * Update an order's status (bar screen: new → in_progress → done).
 */
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  await updateDoc(doc(db, COLLECTION_ORDERS, orderId), { status });
}

/**
 * Update an order's items, totalPrice, totalPoints (e.g. bar staff corrects quantities or adds items).
 * Items are sanitized so Firestore never receives undefined.
 */
export async function updateOrder(
  orderId: string,
  data: { items: OrderItem[]; totalPrice: number; totalPoints: number }
): Promise<void> {
  const items = data.items.map(sanitizeItem);
  await updateDoc(doc(db, COLLECTION_ORDERS, orderId), {
    items,
    totalPrice: Number(data.totalPrice) ?? 0,
    totalPoints: Number(data.totalPoints) ?? 0,
  });
}

/**
 * Delete an order (e.g. bar staff cancels it).
 */
export async function deleteOrder(orderId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION_ORDERS, orderId));
}

/**
 * Delete all orders in the collection. Use to reset and start fresh.
 * With real-time subscription, the app will update to an empty list.
 */
export async function deleteAllOrders(): Promise<void> {
  const snapshot = await getDocs(collection(db, COLLECTION_ORDERS));
  await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
}
