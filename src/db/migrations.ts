/**
 * Sistema de migraciones para SQLite
 * Maneja actualizaciones incrementales del schema
 */

import { Database } from 'sql.js';

export interface Migration {
    version: number;
    name: string;
    up: (db: Database) => void;
}

/**
 * Lista de migraciones en orden cronológico
 */
export const migrations: Migration[] = [
    {
        version: 1,
        name: 'add_extended_features',
        up: (db: Database) => {
            // Agregar columnas adicionales a categories si no existen
            try {
                db.run(`ALTER TABLE categories ADD COLUMN icon_id INTEGER REFERENCES category_icons(id)`);
            } catch (e) {
                // Columna ya existe
            }

            try {
                db.run(`ALTER TABLE categories ADD COLUMN color_id INTEGER REFERENCES category_colors(id)`);
            } catch (e) {
                // Columna ya existe
            }

            try {
                db.run(`ALTER TABLE categories ADD COLUMN parent_id INTEGER REFERENCES categories(id)`);
            } catch (e) {
                // Columna ya existe
            }

            try {
                db.run(`ALTER TABLE categories ADD COLUMN is_archived BOOLEAN DEFAULT 0`);
            } catch (e) {
                // Columna ya existe
            }

            try {
                db.run(`ALTER TABLE categories ADD COLUMN sort_order INTEGER DEFAULT 0`);
            } catch (e) {
                // Columna ya existe
            }

            // Agregar account_id a transactions si no existe
            try {
                db.run(`ALTER TABLE transactions ADD COLUMN account_id INTEGER REFERENCES accounts(id)`);
            } catch (e) {
                // Columna ya existe
            }

            try {
                db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id)`);
            } catch (e) {
                // Índice ya existe
            }
        }
    },
    {
        version: 2,
        name: 'fix_budgets_table',
        up: (db: Database) => {
            // Verificar si la tabla budgets tiene la columna is_active
            const tableInfo = db.exec(`PRAGMA table_info(budgets)`);

            if (tableInfo.length > 0) {
                const columns = tableInfo[0].values.map((row: any) => row[1]); // row[1] es el nombre de la columna
                const hasIsActive = columns.includes('is_active');
                const hasPeriod = columns.includes('period');

                // Si no tiene las columnas nuevas, necesitamos recrear la tabla
                if (!hasIsActive || !hasPeriod) {
                    console.log('🔄 Migrando tabla budgets...');

                    // Crear tabla temporal con la nueva estructura
                    db.run(`
            CREATE TABLE budgets_new (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              category_id INTEGER NOT NULL,
              amount REAL NOT NULL,
              period TEXT NOT NULL CHECK(period IN ('monthly', 'yearly')) DEFAULT 'monthly',
              start_date TEXT NOT NULL,
              end_date TEXT,
              alert_percentage INTEGER DEFAULT 80,
              is_active BOOLEAN DEFAULT 1,
              month INTEGER CHECK(month BETWEEN 1 AND 12),
              year INTEGER CHECK(year >= 2020),
              user_id INTEGER,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (category_id) REFERENCES categories(id),
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
          `);

                    // Copiar datos existentes
                    db.run(`
            INSERT INTO budgets_new (id, category_id, amount, month, year, user_id, created_at, period, start_date, is_active)
            SELECT 
              id, 
              category_id, 
              amount, 
              month, 
              year, 
              user_id, 
              created_at,
              'monthly' as period,
              date(year || '-' || printf('%02d', month) || '-01') as start_date,
              1 as is_active
            FROM budgets
          `);

                    // Eliminar tabla antigua
                    db.run(`DROP TABLE budgets`);

                    // Renombrar tabla nueva
                    db.run(`ALTER TABLE budgets_new RENAME TO budgets`);

                    // Recrear índices
                    db.run(`CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category_id)`);
                    db.run(`CREATE INDEX IF NOT EXISTS idx_budgets_active ON budgets(is_active)`);
                    db.run(`CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(year, month)`);
                    db.run(`CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id)`);

                    console.log('✅ Tabla budgets migrada correctamente');
                }
            }
        }
    }
];

/**
 * Obtiene la versión actual del schema
 */
export function getCurrentVersion(db: Database): number {
    try {
        const result = db.exec(`SELECT version FROM schema_version ORDER BY version DESC LIMIT 1`);
        if (result.length > 0 && result[0].values.length > 0) {
            return result[0].values[0][0] as number;
        }
    } catch (e) {
        // Tabla no existe, crear
        db.run(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        applied_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    }
    return 0;
}

/**
 * Ejecuta todas las migraciones pendientes
 */
export function runMigrations(db: Database): void {
    const currentVersion = getCurrentVersion(db);
    const pendingMigrations = migrations.filter(m => m.version > currentVersion);

    if (pendingMigrations.length === 0) {
        console.log('✅ No hay migraciones pendientes');
        return;
    }

    console.log(`🔄 Ejecutando ${pendingMigrations.length} migración(es)...`);

    for (const migration of pendingMigrations) {
        try {
            console.log(`  → Aplicando migración ${migration.version}: ${migration.name}`);
            migration.up(db);

            // Registrar migración aplicada
            db.run(
                `INSERT INTO schema_version (version) VALUES (?)`,
                [migration.version]
            );

            console.log(`  ✅ Migración ${migration.version} aplicada`);
        } catch (error) {
            console.error(`  ❌ Error en migración ${migration.version}:`, error);
            throw error;
        }
    }

    console.log('✅ Todas las migraciones aplicadas correctamente');
}
