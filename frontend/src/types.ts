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
  timestamp?: string | null;
}

export interface UnforeseenItem {
  id: string;
  name: string;
  amount: number;
  paid: boolean;
  due_day?: string;
  notes?: string;
  original_category_id: string;
  original_category_name: string;
  subcategory_id: string;
  subcategory_name: string;
  subcategory_color: string;
  subcategory_icon: string;
}

export interface UnforeseenSubcategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  bg_class: string;
  total: number;
  percentage: number;
  count: number;
  items: UnforeseenItem[];
}

export interface UnforeseenDailyItem {
  day: number;
  date: string;
  total: number;
  count: number;
  items: UnforeseenItem[];
}

export interface UnforeseenComparisonItem {
  month_id: string;
  month_title: string;
  year: number;
  month_number: number;
  total_unforeseen: number;
  total_expenses: number;
  percentage_of_expenses: number;
  count: number;
  is_current: boolean;
}

export interface UnforeseenInsight {
  type: 'warning' | 'info' | 'tip' | 'success';
  title: string;
  message: string;
}

export interface UnforeseenReportData {
  month_id: string;
  month_title: string;
  year: number;
  month_number: number;
  total_unforeseen: number;
  total_expenses: number;
  percentage_of_expenses: number;
  total_income: number;
  current_balance: number;
  balance_without_unforeseen: number;
  unforeseen_count: number;
  average_ticket: number;
  highest_item: UnforeseenItem | null;
  lowest_item: UnforeseenItem | null;
  subcategories: UnforeseenSubcategory[];
  daily_distribution: UnforeseenDailyItem[];
  top_items: UnforeseenItem[];
  history_comparison: UnforeseenComparisonItem[];
  insights: UnforeseenInsight[];
  items: UnforeseenItem[];
}

