/**
 * SQLite WASM Client
 * Cliente singleton para manejar SQLite en el navegador
 * ⚠️ SOLO SE EJECUTA EN EL CLIENTE (use client)
 */

'use client';

import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import { saveDatabaseToIndexedDB, loadDatabaseFromIndexedDB } from '@/lib/indexeddb';
import { SCHEMA_SQL } from './schema';

class SQLiteClient {
  private static instance: SQLiteClient;
  private SQL: SqlJsStatic | null = null;
  private db: Database | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  private constructor() { }

  /**
   * Obtiene la instancia singleton
   */
  public static getInstance(): SQLiteClient {
    if (!SQLiteClient.instance) {
      SQLiteClient.instance = new SQLiteClient();
    }
    return SQLiteClient.instance;
  }

  /**
   * Inicializa SQLite WASM
   */
  public async initialize(): Promise<void> {
    // Si ya está inicializado, no hacer nada
    if (this.isInitialized) {
      return;
    }

    // Si ya hay una inicialización en curso, esperar a que termine
    if (this.initPromise) {
      return this.initPromise;
    }

    // Iniciar nueva inicialización
    this.initPromise = this._initialize();
    return this.initPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      console.log('🔧 Inicializando SQLite WASM...');

      // Cargar sql.js
      this.SQL = await initSqlJs({
        locateFile: () => `/sql-wasm.wasm`,
      });

      // Intentar cargar DB existente desde IndexedDB
      const savedData = await loadDatabaseFromIndexedDB();

      if (savedData) {
        console.log('📂 Cargando base de datos existente...');
        this.db = new this.SQL.Database(savedData);

        // Ejecutar migraciones para actualizar schema si es necesario
        const { runMigrations } = await import('./migrations');
        runMigrations(this.db);

        // Guardar cambios de migraciones
        await this.saveDatabase();
      } else {
        console.log('🆕 Creando nueva base de datos...');
        this.db = new this.SQL.Database();

        // Ejecutar el schema inicial
        this.db.run(SCHEMA_SQL);

        // Ejecutar migraciones (por si acaso)
        const { runMigrations } = await import('./migrations');
        runMigrations(this.db);

        // Guardar la nueva DB
        await this.saveDatabase();
      }

      this.isInitialized = true;
      console.log('✅ SQLite WASM inicializado correctamente');
    } catch (error) {
      console.error('❌ Error al inicializar SQLite:', error);
      this.initPromise = null;
      throw error;
    }
  }

  /**
   * Obtiene la instancia de la base de datos
   */
  public getDatabase(): Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Ejecuta una query SQL (SELECT)
   */
  public exec(sql: string, params?: any[]): any[] {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const results = this.db.exec(sql, params);
      return results;
    } catch (error) {
      console.error('Error executing query:', sql, error);
      throw error;
    }
  }

  /**
   * Ejecuta una query SQL y retorna la primera fila
   */
  public getFirstRow(sql: string, params?: any[]): any | null {
    const results = this.exec(sql, params);

    if (results.length === 0 || results[0].values.length === 0) {
      return null;
    }

    const columns = results[0].columns;
    const values = results[0].values[0];

    // Convertir a objeto
    const row: any = {};
    columns.forEach((col: string, index: number) => {
      row[col] = values[index];
    });

    return row;
  }

  /**
   * Ejecuta una query SQL y retorna todas las filas como objetos
   */
  public getAll(sql: string, params?: any[]): any[] {
    const results = this.exec(sql, params);

    if (results.length === 0) {
      return [];
    }

    const columns = results[0].columns;
    const values = results[0].values;

    // Convertir cada fila a objeto
    return values.map((row: any[]) => {
      const obj: any = {};
      columns.forEach((col: string, index: number) => {
        obj[col] = row[index];
      });
      return obj;
    });
  }

  /**
   * Ejecuta una query de modificación (INSERT, UPDATE, DELETE)
   */
  public run(sql: string, params?: any[]): { lastID: number; changes: number } {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      this.db.run(sql, params);

      // Obtener el último ID insertado
      const lastIDResult = this.db.exec('SELECT last_insert_rowid() as id');
      const lastID = lastIDResult[0]?.values[0]?.[0] as number || 0;

      // Obtener número de cambios
      const changesResult = this.db.exec('SELECT changes() as changes');
      const changes = changesResult[0]?.values[0]?.[0] as number || 0;

      return { lastID, changes };
    } catch (error) {
      console.error('Error running query:', sql, error);
      throw error;
    }
  }

  /**
   * Guarda la base de datos en IndexedDB
   */
  public async saveDatabase(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const data = this.db.export();
      await saveDatabaseToIndexedDB(data);
    } catch (error) {
      console.error('Error saving database:', error);
      throw error;
    }
  }

  /**
   * Exporta la base de datos como Uint8Array
   */
  public exportDatabase(): Uint8Array {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db.export();
  }

  /**
   * Importa una base de datos desde Uint8Array
   */
  public async importDatabase(data: Uint8Array): Promise<void> {
    if (!this.SQL) {
      throw new Error('SQL.js not initialized');
    }

    try {
      // Cerrar DB actual si existe
      if (this.db) {
        this.db.close();
      }

      // Crear nueva DB con los datos importados
      this.db = new this.SQL.Database(data);

      // Guardar en IndexedDB
      await this.saveDatabase();

      console.log('✅ Base de datos importada correctamente');
    } catch (error) {
      console.error('Error importing database:', error);
      throw error;
    }
  }

  /**
   * Reinicia la base de datos (PELIGRO: Elimina todos los datos)
   */
  public async resetDatabase(): Promise<void> {
    if (!this.SQL) {
      throw new Error('SQL.js not initialized');
    }

    try {
      // Cerrar DB actual
      if (this.db) {
        this.db.close();
      }

      // Crear nueva DB vacía
      this.db = new this.SQL.Database();

      // Ejecutar schema
      this.db.run(SCHEMA_SQL);

      // Guardar
      await this.saveDatabase();

      console.log('✅ Base de datos reiniciada');
    } catch (error) {
      console.error('Error resetting database:', error);
      throw error;
    }
  }

  /**
   * Cierra la conexión a la base de datos
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
      this.initPromise = null;
    }
  }

  /**
   * Verifica si la DB está inicializada
   */
  public isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }
}

// Exportar instancia singleton
export const sqliteClient = SQLiteClient.getInstance();