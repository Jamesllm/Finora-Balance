/**
 * Schema SQL como constante TypeScript
 * Exportado para ser usado por el cliente SQLite
 * Version: 2.0.0 - Schema limpio sin duplicaciones
 */

export const SCHEMA_SQL = `
-- ============================================
-- SCHEMA: Finora Balance
-- Version: 2.0.0
-- ============================================

-- Tabla de usuarios (autenticación local)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    pin_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    color TEXT NOT NULL DEFAULT '#3B82F6',
    icon TEXT NOT NULL DEFAULT 'Wallet',
    is_default INTEGER DEFAULT 0,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);

-- Tabla de transacciones
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL CHECK(amount > 0),
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    category_id INTEGER NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date_type ON transactions(date, type);

-- Tabla de configuración
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    currency TEXT NOT NULL DEFAULT 'PEN',
    currency_symbol TEXT NOT NULL DEFAULT 'S/',
    theme TEXT NOT NULL DEFAULT 'light' CHECK(theme IN ('light', 'dark', 'system')),
    language TEXT NOT NULL DEFAULT 'es',
    date_format TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de presupuestos (versión actualizada con is_active)
CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    amount REAL NOT NULL CHECK(amount > 0),
    period TEXT NOT NULL CHECK(period IN ('monthly', 'yearly')) DEFAULT 'monthly',
    start_date TEXT NOT NULL,
    end_date TEXT,
    alert_percentage INTEGER DEFAULT 80,
    is_active BOOLEAN DEFAULT 1,
    month INTEGER CHECK(month BETWEEN 1 AND 12),
    year INTEGER CHECK(year >= 2020),
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(year, month);
CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_active ON budgets(is_active);

-- Tablas adicionales
CREATE TABLE IF NOT EXISTS category_icons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  svg_path TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS category_colors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  hex TEXT NOT NULL,
  dark_hex TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS savings_goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  target_amount REAL NOT NULL,
  current_amount REAL DEFAULT 0,
  target_date TEXT,
  icon TEXT,
  color TEXT,
  is_completed BOOLEAN DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS goal_contributions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  goal_id INTEGER NOT NULL,
  transaction_id INTEGER,
  amount REAL NOT NULL,
  contribution_date TEXT NOT NULL,
  note TEXT,
  FOREIGN KEY (goal_id) REFERENCES savings_goals(id),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);

CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('cash', 'bank', 'credit_card', 'investment', 'other')),
  currency TEXT DEFAULT 'USD',
  initial_balance REAL DEFAULT 0,
  current_balance REAL DEFAULT 0,
  icon TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_account_id INTEGER NOT NULL,
  to_account_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  exchange_rate REAL DEFAULT 1,
  date TEXT NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_account_id) REFERENCES accounts(id),
  FOREIGN KEY (to_account_id) REFERENCES accounts(id)
);

-- ============================================
-- TRIGGERS: Actualizar updated_at
-- ============================================

CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_transactions_timestamp 
AFTER UPDATE ON transactions
BEGIN
    UPDATE transactions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_settings_timestamp 
AFTER UPDATE ON settings
BEGIN
    UPDATE settings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ============================================
-- VISTAS: Queries optimizadas
-- ============================================

CREATE VIEW IF NOT EXISTS monthly_summary AS
SELECT 
    strftime('%Y-%m', date) as month,
    type,
    SUM(amount) as total,
    COUNT(*) as transaction_count,
    user_id
FROM transactions
GROUP BY month, type, user_id;

CREATE VIEW IF NOT EXISTS category_totals AS
SELECT 
    c.id as category_id,
    c.name as category_name,
    c.type as category_type,
    c.color,
    c.icon,
    COALESCE(SUM(t.amount), 0) as total,
    COUNT(t.id) as transaction_count,
    t.user_id
FROM categories c
LEFT JOIN transactions t ON c.id = t.category_id
GROUP BY c.id, c.name, c.type, c.color, c.icon, t.user_id;

CREATE VIEW IF NOT EXISTS recent_transactions AS
SELECT 
    t.id,
    t.amount,
    t.type,
    t.description,
    t.date,
    c.name as category_name,
    c.color as category_color,
    c.icon as category_icon,
    t.user_id
FROM transactions t
JOIN categories c ON t.category_id = c.id
ORDER BY t.date DESC, t.created_at DESC;
`;