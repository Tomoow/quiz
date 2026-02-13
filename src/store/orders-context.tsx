import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isFirebaseConfigured } from '../firebase/config';
import {
  subscribeOrders,
  addOrder as firebaseAddOrder,
  updateOrderStatus as firebaseUpdateOrderStatus,
  updateOrder as firebaseUpdateOrder,
  deleteOrder as firebaseDeleteOrder,
  deleteAllOrders as firebaseDeleteAllOrders,
} from '../firebase/orders';
import type { Order, OrderItem, OrderStatus } from '../types';

const STORAGE_KEY_ORDERS = 'quiz-pwa-orders';

function loadOrdersFallback(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ORDERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Order[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((o) => ({ ...o, tableNumber: o.tableNumber ?? '?' }));
  } catch {
    return [];
  }
}

function saveOrdersFallback(orders: Order[]) {
  try {
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
  } catch {
    // ignore
  }
}

export type SubmitOrderPayload = {
  tableId: string;
  tableNumber: string;
  teamName: string;
  items: OrderItem[];
  totalPrice: number;
  totalPoints: number;
};

type OrdersContextValue = {
  orders: Order[];
  submitOrder: (payload: SubmitOrderPayload) => Promise<Order>;
  setOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  updateOrder: (orderId: string, data: { items: OrderItem[]; totalPrice: number; totalPoints: number }) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  /** Clear all orders (Firebase + app state / localStorage). Use to start fresh. */
  resetOrders: () => Promise<void>;
  isFirebase: boolean;
  firebaseError: Error | null;
  clearFirebaseError: () => void;
};

const OrdersContext = createContext<OrdersContextValue | null>(null);

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(loadOrdersFallback);
  const [firebaseError, setFirebaseError] = useState<Error | null>(null);
  const useFirebase = isFirebaseConfigured();

  useEffect(() => {
    if (!useFirebase) return;
    const unsubscribe = subscribeOrders((next) => {
      setOrders(next);
      setFirebaseError(null);
    });
    return () => unsubscribe();
  }, [useFirebase]);

  const submitOrder = useCallback(
    async (payload: SubmitOrderPayload): Promise<Order> => {
      if (useFirebase) {
        try {
          const order = await firebaseAddOrder(payload);
          setFirebaseError(null);
          return order;
        } catch (err) {
          setFirebaseError(err instanceof Error ? err : new Error(String(err)));
          throw err;
        }
      }
      // Fallback: localStorage
      const order: Order = {
        id: `order-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        tableId: payload.tableId,
        tableNumber: payload.tableNumber,
        teamName: payload.teamName,
        items: [...payload.items],
        totalPrice: payload.totalPrice,
        totalPoints: payload.totalPoints,
        status: 'new',
        createdAt: Date.now(),
      };
      setOrders((prev) => {
        const next = [order, ...prev];
        saveOrdersFallback(next);
        return next;
      });
      return order;
    },
    [useFirebase]
  );

  const setOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus): Promise<void> => {
      if (useFirebase) {
        try {
          await firebaseUpdateOrderStatus(orderId, status);
          setFirebaseError(null);
        } catch (err) {
          setFirebaseError(err instanceof Error ? err : new Error(String(err)));
          throw err;
        }
        return;
      }
      setOrders((prev) => {
        const next = prev.map((o) => (o.id === orderId ? { ...o, status } : o));
        saveOrdersFallback(next);
        return next;
      });
      return Promise.resolve();
    },
    [useFirebase]
  );

  const updateOrder = useCallback(
    async (
      orderId: string,
      data: { items: OrderItem[]; totalPrice: number; totalPoints: number }
    ): Promise<void> => {
      if (useFirebase) {
        try {
          await firebaseUpdateOrder(orderId, data);
          setFirebaseError(null);
        } catch (err) {
          setFirebaseError(err instanceof Error ? err : new Error(String(err)));
          throw err;
        }
        return;
      }
      setOrders((prev) => {
        const next = prev.map((o) =>
          o.id === orderId ? { ...o, items: data.items, totalPrice: data.totalPrice, totalPoints: data.totalPoints } : o
        );
        saveOrdersFallback(next);
        return next;
      });
      return Promise.resolve();
    },
    [useFirebase]
  );

  const deleteOrder = useCallback(
    async (orderId: string): Promise<void> => {
      if (useFirebase) {
        try {
          await firebaseDeleteOrder(orderId);
          setFirebaseError(null);
        } catch (err) {
          setFirebaseError(err instanceof Error ? err : new Error(String(err)));
          throw err;
        }
        return;
      }
      setOrders((prev) => {
        const next = prev.filter((o) => o.id !== orderId);
        saveOrdersFallback(next);
        return next;
      });
      return Promise.resolve();
    },
    [useFirebase]
  );

  const clearFirebaseError = useCallback(() => {
    setFirebaseError(null);
  }, []);

  const resetOrders = useCallback(async (): Promise<void> => {
    if (useFirebase) {
      try {
        await firebaseDeleteAllOrders();
        setFirebaseError(null);
      } catch (err) {
        setFirebaseError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
      setOrders([]);
      return;
    }
    setOrders([]);
    saveOrdersFallback([]);
    return Promise.resolve();
  }, [useFirebase]);

  const value = useMemo<OrdersContextValue>(
    () => ({
      orders,
      submitOrder,
      setOrderStatus,
      updateOrder,
      deleteOrder,
      resetOrders,
      isFirebase: useFirebase,
      firebaseError,
      clearFirebaseError,
    }),
    [orders, submitOrder, setOrderStatus, updateOrder, deleteOrder, resetOrders, useFirebase, firebaseError, clearFirebaseError]
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider');
  return ctx;
}
