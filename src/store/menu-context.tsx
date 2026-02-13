/**
 * Menu context: provides menu items. Uses Firebase when configured, else localStorage + data/menu.ts.
 */
import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import { MENU_ITEMS } from '../data/menu';
import { isFirebaseConfigured } from '../firebase/config';
import * as firebaseMenu from '../firebase/menu';
import type { MenuItem } from '../types';

const STORAGE_KEY_MENU = 'quiz-pwa-menu';

function loadMenuFromStorage(): MenuItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MENU);
    if (!raw) return [...MENU_ITEMS];
    const parsed = JSON.parse(raw) as MenuItem[];
    return Array.isArray(parsed) ? parsed : [...MENU_ITEMS];
  } catch {
    return [...MENU_ITEMS];
  }
}

function saveMenuToStorage(items: MenuItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(items));
  } catch {
    // ignore
  }
}

type MenuContextValue = {
  menuItems: MenuItem[];
  loading: boolean;
  error: Error | null;
  clearError: () => void;
  updateMenuItem: (id: string, data: Partial<Pick<MenuItem, 'name' | 'price' | 'points'>>) => Promise<void>;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<MenuItem>;
  deleteMenuItem: (id: string) => Promise<void>;
};

const MenuContext = createContext<MenuContextValue | null>(null);

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(loadMenuFromStorage);
  const [loading, setLoading] = useState(isFirebaseConfigured());
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const unsub = firebaseMenu.subscribeMenu((items) => {
      setMenuItems(items);
      setLoading(false);
      setError(null);
    });
    firebaseMenu.seedMenuIfEmpty(MENU_ITEMS).catch((err) => {
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const updateMenuItem = useCallback(
    async (id: string, data: Partial<Pick<MenuItem, 'name' | 'price' | 'points'>>) => {
      if (isFirebaseConfigured()) {
        try {
          await firebaseMenu.updateMenuItem(id, data);
        } catch (err) {
          setError(err instanceof Error ? err : new Error(String(err)));
          throw err;
        }
      } else {
        setMenuItems((prev) => {
          const next = prev.map((item) => (item.id === id ? { ...item, ...data } : item));
          saveMenuToStorage(next);
          return next;
        });
      }
    },
    []
  );

  const addMenuItem = useCallback(async (item: Omit<MenuItem, 'id'>): Promise<MenuItem> => {
    if (isFirebaseConfigured()) {
      try {
        return await firebaseMenu.addMenuItem(item);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    }
    const id = `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newItem: MenuItem = { ...item, id };
    setMenuItems((prev) => {
      const next = [...prev, newItem];
      saveMenuToStorage(next);
      return next;
    });
    return newItem;
  }, []);

  const deleteMenuItem = useCallback(async (id: string) => {
    if (isFirebaseConfigured()) {
      try {
        await firebaseMenu.deleteMenuItem(id);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    } else {
      setMenuItems((prev) => {
        const next = prev.filter((item) => item.id !== id);
        saveMenuToStorage(next);
        return next;
      });
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<MenuContextValue>(
    () => ({
      menuItems,
      loading,
      error,
      clearError,
      updateMenuItem,
      addMenuItem,
      deleteMenuItem,
    }),
    [menuItems, loading, error, clearError, updateMenuItem, addMenuItem, deleteMenuItem]
  );

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error('useMenu must be used within MenuProvider');
  return ctx;
}
