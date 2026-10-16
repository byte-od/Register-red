from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class IncomeItem(BaseModel):
    id: str
    name: str
    amount: float = 0.0
    day: Optional[str] = "Dia 10"
    received: bool = False

class ExpenseItem(BaseModel):
    id: str
    name: str
    amount: float = 0.0
    paid: bool = False
    due_day: Optional[str] = "10"
    notes: Optional[str] = None
    is_recurring: bool = True
    installments_current: Optional[int] = None
    installments_total: Optional[int] = None


class ExpenseCategory(BaseModel):
    id: str
    name: str
    items: List[ExpenseItem] = []
    total: float = 0.0
    paid_total: float = 0.0
    pending_total: float = 0.0

class DailyTimelineItem(BaseModel):
    date: str
    total_debt: float = 0.0
    total_income: float = 0.0
    balance: float = 0.0
    day_expense: float = 0.0
    day_income: float = 0.0

class MonthSummary(BaseModel):
    total_income: float = 0.0
    received_income: float = 0.0
    pending_income: float = 0.0
    current_balance: float = 0.0
    total_expenses: float = 0.0
    total_paid: float = 0.0
    total_pending: float = 0.0
    balance: float = 0.0
    paid_percentage: float = 0.0
    expense_count: int = 0
    paid_count: int = 0
    pending_count: int = 0

class MonthData(BaseModel):
    id: str
    title: str
    year: int
    month_number: int
    file_path: Optional[str] = None
    last_modified: Optional[str] = None
    is_in_drive: bool = False
    incomes: List[IncomeItem] = []
    categories: List[ExpenseCategory] = []
    daily_timeline: List[DailyTimelineItem] = []
    summary: MonthSummary = Field(default_factory=MonthSummary)

class MonthListItem(BaseModel):
    id: str
    title: str
    year: int
    month_number: int
    file_path: Optional[str] = None
    total_income: float = 0.0
    received_income: float = 0.0
    pending_income: float = 0.0
    current_balance: float = 0.0
    total_expenses: float = 0.0
    total_paid: float = 0.0
    total_pending: float = 0.0
    balance: float = 0.0
    paid_percentage: float = 0.0
    is_in_drive: bool = False
    last_modified: Optional[str] = None

class CreateMonthRequest(BaseModel):
    year: int
    month_number: int
    title: Optional[str] = None
    clone_from_id: Optional[str] = None
    carry_over_balance: bool = True
    reset_paid: bool = True
    sync_to_drive: bool = True

class SyncResult(BaseModel):
    success: bool
    message: str
    file_path: Optional[str] = None
