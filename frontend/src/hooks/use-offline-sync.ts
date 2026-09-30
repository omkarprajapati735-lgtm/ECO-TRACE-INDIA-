"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { openDB, IDBPDatabase } from 'idb';
import axios from 'axios';

const DB_NAME = 'ecotrace-collector-db';
const DB_VERSION = 1;
const STORE_NAME = 'offline_weigh_ins';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export interface OfflineWeighInItem {
  id: string;
  pickupId: string;
  categoryId: string;
  categoryName?: string;
  actualWeightKg: number;
  pricePerKg: number;
  totalAmount: number;
  imageProofUrl?: string;
  timestamp: number;
  synced: boolean;
}

interface SyncSummary {
  synced: number;
  failed: number;
}

async function getDatabase(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('by_pickup', 'pickupId');
        store.createIndex('by_synced', 'synced');
      }
    },
  });
}

export function useOfflineSync(currentPickupId?: string) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineItems, setOfflineItems] = useState<OfflineWeighInItem[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const isSyncingRef = useRef<boolean>(false);

  // Load items from IndexedDB
  const refreshItems = useCallback(async () => {
    if (typeof window === 'undefined') return;
    try {
      const db = await getDatabase();
      const all: OfflineWeighInItem[] = currentPickupId
        ? await db.getAllFromIndex(STORE_NAME, 'by_pickup', currentPickupId)
        : await db.getAll(STORE_NAME);

      setOfflineItems(all);
      const unsynced = all.filter((i) => !i.synced);
      setPendingCount(unsynced.length);
    } catch {
      // IndexedDB might not be available in SSR or incognito fallback
    }
  }, [currentPickupId]);

  // Synchronize pending unsynced items to backend
  const syncNow = useCallback(async (): Promise<SyncSummary> => {
    if (typeof window === 'undefined' || isSyncingRef.current) {
      return { synced: 0, failed: 0 };
    }

    if (!navigator.onLine) {
      return { synced: 0, failed: 0 };
    }

    isSyncingRef.current = true;
    setIsSyncing(true);

    let synced = 0;
    let failed = 0;

    try {
      const db = await getDatabase();
      const all: OfflineWeighInItem[] = await db.getAll(STORE_NAME);
      const pending = all.filter((i) => !i.synced);

      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      for (const item of pending) {
        try {
          await axios.post(
            `${API_BASE_URL}/pickups/${item.pickupId}/items`,
            {
              categoryId: item.categoryId,
              actualWeightKg: item.actualWeightKg,
              pricePerKg: item.pricePerKg,
              imageProofUrl: item.imageProofUrl || '',
            },
            { headers, timeout: 8000 }
          );

          // Mark as synced in IndexedDB
          item.synced = true;
          await db.put(STORE_NAME, item);
          synced++;
        } catch {
          failed++;
        }
      }

      setLastSyncTime(new Date());
      await refreshItems();
    } catch {
      // Error handling without crashing UI
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }

    return { synced, failed };
  }, [refreshItems]);

  // Save new doorstep weigh-in item
  const saveItem = useCallback(
    async (
      item: Omit<OfflineWeighInItem, 'id' | 'timestamp' | 'synced'>
    ): Promise<OfflineWeighInItem> => {
      const newItem: OfflineWeighInItem = {
        ...item,
        id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: Date.now(),
        synced: false,
      };

      try {
        const db = await getDatabase();
        await db.put(STORE_NAME, newItem);
      } catch {
        // Fallback for environments where IndexedDB might fail
      }

      await refreshItems();

      // If online, immediately trigger background sync
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        void syncNow();
      }

      return newItem;
    },
    [refreshItems, syncNow]
  );

  // Remove an item
  const removeItem = useCallback(
    async (id: string): Promise<void> => {
      try {
        const db = await getDatabase();
        await db.delete(STORE_NAME, id);
        await refreshItems();
      } catch {
        // Handle error safely
      }
    },
    [refreshItems]
  );

  // Monitor network status & auto-sync
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      void syncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    void refreshItems();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshItems, syncNow]);

  return {
    isOnline,
    offlineItems,
    pendingCount,
    isSyncing,
    lastSyncTime,
    saveItem,
    removeItem,
    syncNow,
    refreshItems,
  };
}
