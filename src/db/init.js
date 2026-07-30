import { sqlite, db } from './index.js';
import { v4 as uuidv4 } from 'uuid';
import * as schema from './schema.js';
import { sql } from 'drizzle-orm';

export function initDatabase() {
  sqlite.transaction(() => {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        is_liquid INTEGER NOT NULL DEFAULT 1,
        target_pct REAL,
        units REAL,
        award_value REAL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      
      CREATE TABLE IF NOT EXISTS funds (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        target_amount REAL,
        target_date TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      
      CREATE TABLE IF NOT EXISTS distribution_rules (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        is_default INTEGER NOT NULL DEFAULT 0,
        total_amount REAL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      
      CREATE TABLE IF NOT EXISTS distribution_lines (
        id TEXT PRIMARY KEY,
        rule_id TEXT NOT NULL,
        fund_id TEXT NOT NULL,
        fixed_amount REAL,
        percentage REAL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (rule_id) REFERENCES distribution_rules(id) ON DELETE CASCADE,
        FOREIGN KEY (fund_id) REFERENCES funds(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        liability_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (liability_id) REFERENCES liabilities(id) ON DELETE SET NULL
      );
      
      CREATE TABLE IF NOT EXISTS journal_entries (
        id TEXT PRIMARY KEY,
        transaction_id TEXT NOT NULL,
        account_id TEXT,
        fund_id TEXT,
        amount REAL NOT NULL,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
        FOREIGN KEY (fund_id) REFERENCES funds(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS liabilities (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        original_amount REAL NOT NULL,
        initial_balance REAL NOT NULL,
        interest_rate REAL,
        monthly_payment REAL,
        start_date TEXT,
        end_date TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // Migration: add liability_id to transactions if missing
    try {
      sqlite.prepare("SELECT liability_id FROM transactions LIMIT 1").get();
    } catch {
      sqlite.exec("ALTER TABLE transactions ADD COLUMN liability_id TEXT REFERENCES liabilities(id) ON DELETE SET NULL");
    }

    // Migration: add source_account_id to transactions if missing
    try {
      sqlite.prepare("SELECT source_account_id FROM transactions LIMIT 1").get();
    } catch {
      sqlite.exec("ALTER TABLE transactions ADD COLUMN source_account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL");
    }

    // Migration: add units to transactions if missing
    try {
      sqlite.prepare("SELECT units FROM transactions LIMIT 1").get();
    } catch {
      sqlite.exec("ALTER TABLE transactions ADD COLUMN units REAL");
    }

    // Migration: add initial_balance if missing
    try {
      sqlite.prepare("SELECT initial_balance FROM liabilities LIMIT 1").get();
    } catch {
      sqlite.exec("ALTER TABLE liabilities ADD COLUMN initial_balance REAL NOT NULL DEFAULT 0");
      try {
        sqlite.exec("UPDATE liabilities SET initial_balance = current_balance");
      } catch {}
    }

    // Migration: drop current_balance column from liabilities if it exists
    try {
      sqlite.prepare("SELECT current_balance FROM liabilities LIMIT 1").get();
      try {
        sqlite.exec("ALTER TABLE liabilities DROP COLUMN current_balance");
      } catch {
        sqlite.exec(`
          CREATE TABLE liabilities_new (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            original_amount REAL NOT NULL,
            initial_balance REAL NOT NULL,
            interest_rate REAL,
            monthly_payment REAL,
            start_date TEXT,
            end_date TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
          );
          INSERT INTO liabilities_new (id, name, original_amount, initial_balance, interest_rate, monthly_payment, start_date, end_date, created_at)
          SELECT id, name, original_amount, initial_balance, interest_rate, monthly_payment, start_date, end_date, created_at FROM liabilities;
          DROP TABLE liabilities;
          ALTER TABLE liabilities_new RENAME TO liabilities;
        `);
      }
    } catch {
      // current_balance column is already gone
    }

    const countAccounts = sqlite.prepare('SELECT COUNT(*) as count FROM accounts').get();
    
    if (countAccounts.count === 0) {
      // Seed Accounts
      const accountsData = [
        { name: 'Mock Bank Account', type: 'Tabungan', isLiquid: 1 },
        { name: 'Mock Savings Account', type: 'Tabungan', isLiquid: 1 },
        { name: 'Mock Investment Account', type: 'Tabungan', isLiquid: 1 },
        { name: 'Mock Stock 1', type: 'Saham', isLiquid: 1 },
        { name: 'Mock Stock 2', type: 'Saham', isLiquid: 1 },
        { name: 'Mock Mutual Fund', type: 'Reksadana', isLiquid: 1 },
        { name: 'Mock Bonds', type: 'Sukuk', isLiquid: 1 },
        { name: 'Mock Gold', type: 'Emas', isLiquid: 1 },
        { name: 'Mock Real Estate', type: 'Properti', isLiquid: 0 },
        { name: 'Mock Car', type: 'Mobil', isLiquid: 0 },
        { name: 'Mock USD', type: 'Valas', isLiquid: 1 }
      ];

      const accountIds = {};
      const insertAccount = sqlite.prepare('INSERT INTO accounts (id, name, type, is_liquid) VALUES (?, ?, ?, ?)');
      for (const acc of accountsData) {
        const id = uuidv4();
        accountIds[acc.name] = id;
        insertAccount.run(id, acc.name, acc.type, acc.isLiquid);
      }

      // Seed Funds
      const fundsData = [
        { name: 'Emergency Fund', targetAmount: 50000000, targetDate: '2030-12-31', isActive: 1 },
        { name: 'Mock College Fund', targetAmount: 200000000, targetDate: null, isActive: 1 },
        { name: 'Mock Retirement Fund', targetAmount: 1000000000, targetDate: '2040-12-31', isActive: 1 },
        { name: 'Mock House Fund', targetAmount: 500000000, targetDate: null, isActive: 1 },
        { name: 'Mock Car Loan Payment', targetAmount: null, targetDate: null, isActive: 1 },
        { name: 'Mock Annual Expenses', targetAmount: 20000000, targetDate: null, isActive: 1 }
      ];

      const fundIds = {};
      const insertFund = sqlite.prepare('INSERT INTO funds (id, name, target_amount, target_date, is_active) VALUES (?, ?, ?, ?, ?)');
      for (const fund of fundsData) {
        const id = uuidv4();
        fundIds[fund.name] = id;
        insertFund.run(id, fund.name, fund.targetAmount, fund.targetDate, fund.isActive);
      }

      // Seed Distribution Rules
      const insertRule = sqlite.prepare('INSERT INTO distribution_rules (id, name, type, total_amount, is_default) VALUES (?, ?, ?, ?, ?)');
      const insertRuleLine = sqlite.prepare('INSERT INTO distribution_lines (id, rule_id, fund_id, fixed_amount, percentage) VALUES (?, ?, ?, ?, ?)');

      // Rule 1
      const rule1Id = uuidv4();
      insertRule.run(rule1Id, 'Mock Monthly Income', 'FIXED', 10000000, 1);
      const rule1Lines = [
        { fundName: 'Emergency Fund', fixedAmount: 2000000 },
        { fundName: 'Mock House Fund', fixedAmount: 3000000 },
        { fundName: 'Mock College Fund', fixedAmount: 1000000 },
        { fundName: 'Mock Retirement Fund', fixedAmount: 1000000 },
        { fundName: 'Mock Car Loan Payment', fixedAmount: 2000000 },
        { fundName: 'Mock Annual Expenses', fixedAmount: 1000000 }
      ];
      for (const line of rule1Lines) {
        insertRuleLine.run(uuidv4(), rule1Id, fundIds[line.fundName], line.fixedAmount, null);
      }

      // Rule 2
      const rule2Id = uuidv4();
      insertRule.run(rule2Id, 'Mock Other Income', 'PERCENTAGE', null, 0);
      const rule2Lines = [
        { fundName: 'Emergency Fund', percentage: 0.20 },
        { fundName: 'Mock House Fund', percentage: 0.30 },
        { fundName: 'Mock College Fund', percentage: 0.20 },
        { fundName: 'Mock Retirement Fund', percentage: 0.30 }
      ];
      for (const line of rule2Lines) {
        insertRuleLine.run(uuidv4(), rule2Id, fundIds[line.fundName], null, line.percentage);
      }

      // Seed Liabilities
      sqlite.prepare('INSERT INTO liabilities (id, name, original_amount, initial_balance) VALUES (?, ?, ?, ?)').run(
        uuidv4(), 'Mock Car Loan', 150000000, 150000000
      );

      // Seed Initial Balances via ADJUSTMENT transaction
      const txnId = uuidv4();
      sqlite.prepare('INSERT INTO transactions (id, date, description, type) VALUES (?, ?, ?, ?)').run(
        txnId, '2026-01-01', 'Initial Balances', 'ADJUSTMENT'
      );

      const insertJournal = sqlite.prepare('INSERT INTO journal_entries (id, transaction_id, account_id, fund_id, amount) VALUES (?, ?, ?, ?, ?)');

      const accountBalances = {
        'Mock Bank Account': 10000000,
        'Mock Savings Account': 20000000,
        'Mock Investment Account': 50000000,
        'Mock Stock 1': 15000000,
        'Mock Stock 2': 10000000,
        'Mock Mutual Fund': 25000000,
        'Mock Bonds': 30000000,
        'Mock Gold': 5000000,
        'Mock Real Estate': 500000000,
        'Mock Car': 200000000,
        'Mock USD': 10000000
      };

      for (const [name, amount] of Object.entries(accountBalances)) {
        insertJournal.run(uuidv4(), txnId, accountIds[name], null, amount);
      }

      const fundBalances = {
        'Emergency Fund': 20000000,
        'Mock College Fund': 50000000,
        'Mock Retirement Fund': 100000000,
        'Mock House Fund': 30000000,
        'Mock Car Loan Payment': 0,
        'Mock Annual Expenses': 5000000
      };

      for (const [name, amount] of Object.entries(fundBalances)) {
        insertJournal.run(uuidv4(), txnId, null, fundIds[name], amount);
      }
    }
  })();
}

initDatabase();
