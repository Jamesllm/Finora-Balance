/**
 * IndexedDB Manager
 * Maneja la persistencia del archivo SQLite en el navegador
 */

const DB_NAME = 'FinanzasOfflineDB';
const STORE_NAME = 'sqlite';
const DB_VERSION = 1;
const SQLITE_KEY = 'database';

interface SQLiteData {
  key: string;
  data: Uint8Array;
  lastModified: number;
}

/**
 * Abre la conexión a IndexedDB
 */
const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Error al abrir IndexedDB'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Crear el object store si no existe
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
  });
};

/**
 * Guarda la base de datos SQLite en IndexedDB
 */
export const saveDatabaseToIndexedDB = async (data: Uint8Array): Promise<void> => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const sqliteData: SQLiteData = {
      key: SQLITE_KEY,
      data,
      lastModified: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const request = store.put(sqliteData);

      request.onsuccess = () => {
        db.close();
        resolve();
      };

      request.onerror = () => {
        db.close();
        reject(new Error('Error al guardar en IndexedDB'));
      };
    });
  } catch (error) {
    console.error('Error en saveDatabaseToIndexedDB:', error);
    throw error;
  }
};

/**
 * Carga la base de datos SQLite desde IndexedDB
 */
export const loadDatabaseFromIndexedDB = async (): Promise<Uint8Array | null> => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(SQLITE_KEY);

      request.onsuccess = () => {
        db.close();
        const result = request.result as SQLiteData | undefined;
        resolve(result ? result.data : null);
      };

      request.onerror = () => {
        db.close();
        reject(new Error('Error al cargar desde IndexedDB'));
      };
    });
  } catch (error) {
    console.error('Error en loadDatabaseFromIndexedDB:', error);
    return null;
  }
};

/**
 * Elimina la base de datos de IndexedDB
 */
export const deleteDatabaseFromIndexedDB = async (): Promise<void> => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(SQLITE_KEY);

      request.onsuccess = () => {
        db.close();
        resolve();
      };

      request.onerror = () => {
        db.close();
        reject(new Error('Error al eliminar de IndexedDB'));
      };
    });
  } catch (error) {
    console.error('Error en deleteDatabaseFromIndexedDB:', error);
    throw error;
  }
};

/**
 * Exporta la base de datos como archivo descargable
 */
export const exportDatabase = async (data: Uint8Array, filename: string = 'finora-backup.db'): Promise<void> => {
  try {
    const blob = new Blob([data as any], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error al exportar base de datos:', error);
    throw error;
  }
};

/**
 * Importa una base de datos desde un archivo
 */
export const importDatabase = async (file: File): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      if (event.target?.result) {
        const arrayBuffer = event.target.result as ArrayBuffer;
        const data = new Uint8Array(arrayBuffer);
        resolve(data);
      } else {
        reject(new Error('Error al leer el archivo'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error al importar base de datos'));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Verifica si existe una base de datos guardada
 */
export const databaseExists = async (): Promise<boolean> => {
  try {
    const data = await loadDatabaseFromIndexedDB();
    return data !== null && data.length > 0;
  } catch (error) {
    console.error('Error al verificar existencia de DB:', error);
    return false;
  }
};

/**
 * Obtiene el tamaño de la base de datos en bytes
 */
export const getDatabaseSize = async (): Promise<number> => {
  try {
    const data = await loadDatabaseFromIndexedDB();
    return data ? data.length : 0;
  } catch (error) {
    console.error('Error al obtener tamaño de DB:', error);
    return 0;
  }
};