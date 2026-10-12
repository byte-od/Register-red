export interface IncomeItem {
  id: string;
  name: string;
  amount: number;
  day?: string;
}

export interface ExpenseItem {
  id: string;
  name: string;
  amount: number;
  paid: boolean;
  due_day?: string;
  notes?: string;
  is_recurring?: boolean;
  installments_current?: number;
  installments_total?: number;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  items: ExpenseItem[];
  total: number;
  paid_total: number;
  pending_total: number;
}

export interface DailyTimelineItem {
  date: string;
  total_debt: number;
}

export interface MonthSummary {
  total_income: number;
  total_expenses: number;
  total_paid: number;
  total_pending: number;
  balance: number;
  paid_percentage: number;
  expense_count: number;
  paid_count: number;
  pending_count: number;
}

export interface MonthData {
  id: string;
  title: string;
  year: number;
  month_number: number;
  file_path?: string;
  last_modified?: string;
  is_in_drive: boolean;
  incomes: IncomeItem[];
  categories: ExpenseCategory[];
  daily_timeline: DailyTimelineItem[];
  summary: MonthSummary;
}

export interface MonthListItem {
  id: string;
  title: string;
  year: number;
  month_number: number;
  file_path?: string;
  total_income: number;
  total_expenses: number;
  total_paid: number;
  total_pending: number;
  balance: number;
  paid_percentage: number;
  is_in_drive: boolean;
  last_modified?: string;
}

export interface CreateMonthPayload {
  year: number;
  month_number: number;
  title?: string;
  clone_from_id?: string;
  carry_over_balance: boolean;
  reset_paid: boolean;
  sync_to_drive: boolean;
}

export interface OverviewStats {
  months: string[];
  incomes: number[];
  expenses: number[];
  balances: number[];
  paid_rates: number[];
  total_active_months: number;
  drive_path: string;
}

export interface RecentAction {
  id: string;
  type: string;
  title: string;
  amount?: number | null;
  category?: string;
  source: string;
  status?: string;
  details?: string | null;
  timestamp: string;
}
