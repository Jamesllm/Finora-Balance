/**
 * useDatabase Hook
 * Hook principal para interactuar con SQLite
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { sqliteClient } from '@/db/sqlite-client';
import { exportDatabase as exportDB, importDatabase as importDB } from '@/lib/indexeddb';

interface UseDatabaseReturn {
  isInitialized: boolean;
  isLoading: boolean;
  error: Error | null;
  initialize: () => Promise<void>;
  saveDatabase: () => Promise<void>;
  exportDatabase: () => Promise<void>;
  importDatabase: (file: File) => Promise<void>;
  resetDatabase: () => Promise<void>;
}

/**
 * Hook personalizado para manejar la base de datos SQLite
 */
export const useDatabase = (): UseDatabaseReturn => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Inicializa la base de datos al montar el componente
   */
  const initialize = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await sqliteClient.initialize();

      setIsInitialized(true);
      setIsLoading(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error desconocido al inicializar DB');
      setError(error);
      setIsLoading(false);
      console.error('Error initializing database:', error);
    }
  }, []);

  /**
   * Auto-inicializar al montar
   */
  useEffect(() => {
    initialize();
  }, [initialize]);

  /**
   * Guarda la base de datos en IndexedDB
   */
  const saveDatabase = useCallback(async () => {
    try {
      await sqliteClient.saveDatabase();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al guardar DB');
      setError(error);
      throw error;
    }
  }, []);

  /**
   * Exporta la base de datos como archivo descargable
   */
  const exportDatabase = useCallback(async () => {
    try {
      const data = sqliteClient.exportDatabase();
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `finora-backup-${timestamp}.db`;

      await exportDB(data, filename);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al exportar DB');
      setError(error);
      throw error;
    }
  }, []);

  /**
   * Importa una base de datos desde un archivo
   */
  const importDatabase = useCallback(async (file: File) => {
    try {
      setIsLoading(true);

      const data = await importDB(file);
      await sqliteClient.importDatabase(data);

      setIsLoading(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al importar DB');
      setError(error);
      setIsLoading(false);
      throw error;
    }
  }, []);

  /**
   * Reinicia la base de datos (elimina todos los datos)
   */
  const resetDatabase = useCallback(async () => {
    try {
      setIsLoading(true);

      await sqliteClient.resetDatabase();

      setIsLoading(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al reiniciar DB');
      setError(error);
      setIsLoading(false);
      throw error;
    }
  }, []);

  return {
    isInitialized,
    isLoading,
    error,
    initialize,
    saveDatabase,
    exportDatabase,
    importDatabase,
    resetDatabase,
  };
};