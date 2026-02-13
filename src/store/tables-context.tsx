/**
 * Tables context: single source of truth for tables/teams. Uses Firebase when configured, else localStorage + data/tables.ts.
 */
import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import { TABLES } from '../data/tables';
import { isFirebaseConfigured } from '../firebase/config';
import * as firebaseTables from '../firebase/tables';
import type { Table } from '../types';

const STORAGE_KEY_TABLES = 'quiz-pwa-tables';

function loadTablesFromStorage(): Table[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TABLES);
    if (!raw) return [...TABLES];
    const parsed = JSON.parse(raw) as Table[];
    return Array.isArray(parsed) ? parsed : [...TABLES];
  } catch {
    return [...TABLES];
  }
}

function saveTablesToStorage(tables: Table[]) {
  try {
    localStorage.setItem(STORAGE_KEY_TABLES, JSON.stringify(tables));
  } catch {
    // ignore
  }
}

type TablesContextValue = {
  tables: Table[];
  loading: boolean;
  error: Error | null;
  clearError: () => void;
  updateTable: (id: string, data: Partial<Pick<Table, 'teamName' | 'tableNumber'>>) => Promise<void>;
  addTable: (table: Omit<Table, 'id'>) => Promise<Table>;
  deleteTable: (id: string) => Promise<void>;
};

const TablesContext = createContext<TablesContextValue | null>(null);

export function TablesProvider({ children }: { children: React.ReactNode }) {
  const [tables, setTables] = useState<Table[]>(loadTablesFromStorage);
  const [loading, setLoading] = useState(isFirebaseConfigured());
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const unsub = firebaseTables.subscribeTables((tablesList) => {
      setTables(tablesList);
      setLoading(false);
      setError(null);
    });
    firebaseTables.seedTablesIfEmpty(TABLES).catch((err) => {
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const updateTable = useCallback(
    async (id: string, data: Partial<Pick<Table, 'teamName' | 'tableNumber'>>) => {
      if (isFirebaseConfigured()) {
        try {
          await firebaseTables.updateTable(id, data);
        } catch (err) {
          setError(err instanceof Error ? err : new Error(String(err)));
          throw err;
        }
      } else {
        setTables((prev) => {
          const next = prev.map((t) => (t.id === id ? { ...t, ...data } : t));
          saveTablesToStorage(next);
          return next;
        });
      }
    },
    []
  );

  const addTable = useCallback(async (table: Omit<Table, 'id'>): Promise<Table> => {
    if (isFirebaseConfigured()) {
      try {
        return await firebaseTables.addTable(table);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    }
    const id = `table-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newTable: Table = { ...table, id };
    setTables((prev) => {
      const next = [...prev, newTable];
      saveTablesToStorage(next);
      return next;
    });
    return newTable;
  }, []);

  const deleteTable = useCallback(async (id: string) => {
    if (isFirebaseConfigured()) {
      try {
        await firebaseTables.deleteTable(id);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    } else {
      setTables((prev) => {
        const next = prev.filter((t) => t.id !== id);
        saveTablesToStorage(next);
        return next;
      });
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<TablesContextValue>(
    () => ({
      tables,
      loading,
      error,
      clearError,
      updateTable,
      addTable,
      deleteTable,
    }),
    [tables, loading, error, clearError, updateTable, addTable, deleteTable]
  );

  return <TablesContext.Provider value={value}>{children}</TablesContext.Provider>;
}

export function useTables() {
  const ctx = useContext(TablesContext);
  if (!ctx) throw new Error('useTables must be used within TablesProvider');
  return ctx;
}
