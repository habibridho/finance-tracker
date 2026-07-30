import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  isLiquid: integer('is_liquid').notNull().default(1),
  targetPct: real('target_pct'),
  units: real('units'),
  awardValue: real('award_value'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`)
});

export const funds = sqliteTable('funds', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  targetAmount: real('target_amount'),
  targetDate: text('target_date'),
  isActive: integer('is_active').notNull().default(1),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`)
});

export const distributionRules = sqliteTable('distribution_rules', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  isDefault: integer('is_default').notNull().default(0),
  totalAmount: real('total_amount'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`)
});

export const distributionLines = sqliteTable('distribution_lines', {
  id: text('id').primaryKey(),
  ruleId: text('rule_id').notNull(),
  fundId: text('fund_id').notNull(),
  fixedAmount: real('fixed_amount'),
  percentage: real('percentage'),
  sortOrder: integer('sort_order').notNull().default(0)
});

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  description: text('description').notNull(),
  type: text('type').notNull(),
  liabilityId: text('liability_id'),
  sourceAccountId: text('source_account_id'),
  units: real('units'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`)
});

export const journalEntries = sqliteTable('journal_entries', {
  id: text('id').primaryKey(),
  transactionId: text('transaction_id').notNull(),
  accountId: text('account_id'),
  fundId: text('fund_id'),
  amount: real('amount').notNull()
});

export const liabilities = sqliteTable('liabilities', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  originalAmount: real('original_amount').notNull(),
  initialBalance: real('initial_balance').notNull(),
  interestRate: real('interest_rate'),
  monthlyPayment: real('monthly_payment'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`)
});
