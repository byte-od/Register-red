import os
import re
import json
import uuid
import shutil
import tempfile
import tarfile
from datetime import datetime, date
from typing import List, Dict, Optional, Tuple, Any
from numbers_parser import Document

try:
    from backend.models.schema import (
        MonthData, MonthListItem, IncomeItem, ExpenseItem,
        ExpenseCategory, DailyTimelineItem, MonthSummary, CreateMonthRequest
    )
except ImportError:
    from models.schema import (
        MonthData, MonthListItem, IncomeItem, ExpenseItem,
        ExpenseCategory, DailyTimelineItem, MonthSummary, CreateMonthRequest
    )


GOOGLE_DRIVE_DIR = "/Users/juliocesarreisfilho/Library/CloudStorage/GoogleDrive-reisfilho1116@gmail.com/My Drive/Numbers"
DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
CACHE_FILE = os.path.join(DATA_DIR, "months_data.json")

MONTHS_NAMES_PT = [
    "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

MONTHS_MAP = {
    "janeiro": 1, "jan": 1,
    "fevereiro": 2, "fev": 2,
    "março": 3, "marco": 3, "mar": 3,
    "abril": 4, "abr": 4,
    "maio": 5, "mai": 5,
    "junho": 6, "jun": 6,
    "julho": 7, "jul": 7,
    "agosto": 8, "ago": 8,
    "setembro": 9, "set": 9,
    "outubro": 10, "out": 10,
    "novembro": 11, "nov": 11,
    "dezembro": 12, "dez": 12
}

def ensure_data_dir():
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR, exist_ok=True)

def parse_filename_meta(filename: str, filepath: Optional[str] = None) -> Optional[Tuple[int, int, str]]:
    clean = os.path.splitext(filename)[0]
    lower = clean.lower()
    month = None
    for name, num in MONTHS_MAP.items():
        if name in lower:
            month = num
            break
    if month is None:
        return None

    match = re.search(r"(\d{4})", clean)
    if match:
        year = int(match.group(1))
    elif filepath and os.path.exists(filepath):
        mtime = datetime.fromtimestamp(os.path.getmtime(filepath))
        year = mtime.year
    else:
        year = 2023

    title = f"{MONTHS_NAMES_PT[month]} {year}"
    return year, month, title



def format_currency(val: float) -> str:
    return f"R$ {val:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

def parse_float_val(v: Any) -> float:
    if v is None:
        return 0.0
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).strip().replace("R$", "").strip()
    s = s.replace(".", "").replace(",", ".")
    try:
        return float(s)
    except:
        return 0.0

def parse_bool_val(v: Any) -> bool:
    if v is None:
        return False
    if isinstance(v, bool):
        return v
    s = str(v).strip().lower()
    return s in ["true", "1", "pago", "sim", "yes"]

def parse_date_str(v: Any) -> str:
    if v is None:
        return ""
    if isinstance(v, (datetime, date)):
        return v.strftime("%Y-%m-%d")
    s = str(v).strip()
    if " 00:00:00" in s:
        s = s.replace(" 00:00:00", "")
    return s

def parse_day_num(day_str: Optional[str], days_in_month: int = 31, default_day: int = 10) -> int:
    if not day_str:
        return default_day
    s = str(day_str).strip().lower()
    if any(k in s for k in ["anterior", "saldo", "economia", "economias", "início", "inicio"]):
        return 1
    m_iso = re.search(r"\b\d{4}-\d{2}-(\d{1,2})\b", s)
    if m_iso:
        return max(1, min(days_in_month, int(m_iso.group(1))))
    m_slash = re.search(r"\b(\d{1,2})/\d{1,2}\b", s)
    if m_slash:
        return max(1, min(days_in_month, int(m_slash.group(1))))
    m_num = re.search(r"\b(\d{1,2})\b", s)
    if m_num:
        return max(1, min(days_in_month, int(m_num.group(1))))
    return default_day

def is_income_received(inc: IncomeItem, month_year: int, month_number: int) -> bool:
    if getattr(inc, "received", None) is True:
        return True

    now = datetime.now()
    cur_year = now.year
    cur_month = now.month
    cur_day = now.day

    # Se o mês já passou, todas já foram recebidas
    if (month_year < cur_year) or (month_year == cur_year and month_number < cur_month):
        return True
    
    # Se o mês é futuro, nenhuma foi recebida exceto economias/mês anterior
    if (month_year > cur_year) or (month_year == cur_year and month_number > cur_month):
        s = str(inc.day or "").lower()
        return any(k in s for k in ["anterior", "saldo", "economia", "economias"])

    # Se estamos no mês atual:
    s = str(inc.day or "").lower()
    if any(k in s for k in ["anterior", "saldo", "economia", "economias"]):
        return True

    day_num = parse_day_num(inc.day, days_in_month=31, default_day=10)
    return day_num <= cur_day

def calculate_summary_and_timeline(month: MonthData) -> MonthData:
    days_in_month = 31
    if month.month_number in [4, 6, 9, 11]:
        days_in_month = 30
    elif month.month_number == 2:
        is_leap = (month.year % 4 == 0 and month.year % 100 != 0) or (month.year % 400 == 0)
        days_in_month = 29 if is_leap else 28

    # 1. Processa e ordena receitas cronologicamente pela data
    for inc in month.incomes:
        inc.received = is_income_received(inc, month.year, month.month_number)

    month.incomes.sort(key=lambda inc: parse_day_num(inc.day, days_in_month=days_in_month, default_day=10))

    tot_income = sum(item.amount for item in month.incomes)
    received_income = sum(item.amount for item in month.incomes if item.received)
    pending_income = tot_income - received_income

    tot_expenses = 0.0
    tot_paid = 0.0
    tot_pending = 0.0
    total_items = 0
    paid_items = 0

    for cat in month.categories:
        cat_tot = 0.0
        cat_paid = 0.0
        for it in cat.items:
            cat_tot += it.amount
            total_items += 1
            if it.paid:
                cat_paid += it.amount
                paid_items += 1
        cat.total = round(cat_tot, 2)
        cat.paid_total = round(cat_paid, 2)
        cat.pending_total = round(cat_tot - cat_paid, 2)
        tot_expenses += cat.total
        tot_paid += cat.paid_total
        tot_pending += cat.pending_total

    tot_income = round(tot_income, 2)
    received_income = round(received_income, 2)
    pending_income = round(pending_income, 2)
    tot_expenses = round(tot_expenses, 2)
    tot_paid = round(tot_paid, 2)
    tot_pending = round(tot_pending, 2)

    # Saldo Previsto no mês (todas as receitas orçadas - todas as despesas)
    balance = round(tot_income - tot_expenses, 2)
    # Saldo Real Hoje em caixa (receitas já recebidas até hoje - despesas já pagas até hoje)
    current_balance = round(received_income - tot_paid, 2)

    pct = round((tot_paid / tot_expenses * 100), 1) if tot_expenses > 0 else 0.0

    month.summary = MonthSummary(
        total_income=tot_income,
        received_income=received_income,
        pending_income=pending_income,
        current_balance=current_balance,
        total_expenses=tot_expenses,
        total_paid=tot_paid,
        total_pending=tot_pending,
        balance=balance,
        paid_percentage=pct,
        expense_count=total_items,
        paid_count=paid_items,
        pending_count=total_items - paid_items
    )

    # 2. Constrói cronograma diário levando em conta tanto as receitas quanto as despesas dia a dia
    daily_expense_sums: Dict[int, float] = {d: 0.0 for d in range(1, days_in_month + 1)}
    daily_income_sums: Dict[int, float] = {d: 0.0 for d in range(1, days_in_month + 1)}

    for inc in month.incomes:
        inc_day = parse_day_num(inc.day, days_in_month=days_in_month, default_day=10)
        daily_income_sums[inc_day] += inc.amount

    for cat in month.categories:
        for it in cat.items:
            exp_day = parse_day_num(it.due_day, days_in_month=days_in_month, default_day=10)
            daily_expense_sums[exp_day] += it.amount

    timeline: List[DailyTimelineItem] = []
    cumul_debt = 0.0
    cumul_income = 0.0
    for d in range(1, days_in_month + 1):
        cumul_debt += daily_expense_sums[d]
        cumul_income += daily_income_sums[d]
        date_str = f"{month.year:04d}-{month.month_number:02d}-{d:02d}"
        timeline.append(DailyTimelineItem(
            date=date_str,
            total_debt=round(cumul_debt, 2),
            total_income=round(cumul_income, 2),
            balance=round(cumul_income - cumul_debt, 2),
            day_expense=round(daily_expense_sums[d], 2),
            day_income=round(daily_income_sums[d], 2)
        ))

    month.daily_timeline = timeline
    return month

def read_numbers_doc(filepath: str) -> Optional[Document]:
    try:
        return Document(filepath)
    except Exception as e:
        # Check if it is a tar archive created by Google Drive
        if tarfile.is_tarfile(filepath):
            tmpdir = tempfile.mkdtemp(prefix="numbers_tar_")
            try:
                with tarfile.open(filepath) as tar:
                    tar.extractall(tmpdir)
                sub_entries = os.listdir(tmpdir)
                if sub_entries:
                    sub = sub_entries[0]
                    pkg_path = os.path.join(tmpdir, "Package.numbers")
                    shutil.move(os.path.join(tmpdir, sub), pkg_path)
                    doc = Document(pkg_path)
                    return doc
            except Exception as e2:
                print(f"Failed tar extract for {filepath}: {e2}")
            finally:
                pass
    return None

def safe_cell_value(table, row: int, col: int, default=None):
    if row < table.num_rows and col < table.num_cols:
        try:
            val = table.cell(row, col).value
            return val if val is not None else default
        except:
            return default
def ensure_gastos_category(month: MonthData) -> MonthData:
    has_gastos = False
    for c in month.categories:
        if c.id.lower() == "gastos" or c.name.lower() == "gastos":
            has_gastos = True
            c.id = "gastos"
            c.name = "Gastos"
            # Na categoria Gastos, nada é recorrente e tudo já entra pago
            for it in c.items:
                it.is_recurring = False
                it.paid = True
            break
    if not has_gastos:
        month.categories.append(ExpenseCategory(
            id="gastos",
            name="Gastos",
            items=[]
        ))
    calculate_summary_and_timeline(month)
    return month

def parse_single_numbers_file(filepath: str) -> Optional[MonthData]:
    filename = os.path.basename(filepath)
    meta = parse_filename_meta(filename, filepath)
    if not meta:
        return None
    year, month_num, title = meta
    month_id = f"{year:04d}-{month_num:02d}"
    last_mod = datetime.fromtimestamp(os.path.getmtime(filepath)).isoformat()

    doc = read_numbers_doc(filepath)
    if not doc or not doc.sheets:
        return None

    sheet = doc.sheets[0]
    tables_by_name = {t.name: t for t in sheet.tables}

    # Extract Incomes
    incomes: List[IncomeItem] = []
    inc_table = tables_by_name.get("Income")
    if inc_table:
        for r in range(1, inc_table.num_rows):
            name_val = str(safe_cell_value(inc_table, r, 0, "")).strip()
            if not name_val or "Total" in name_val:
                continue
            amt = parse_float_val(safe_cell_value(inc_table, r, 1))
            day_val = parse_date_str(safe_cell_value(inc_table, r, 2, ""))
            incomes.append(IncomeItem(
                id=f"inc_{r}",
                name=name_val,
                amount=amt,
                day=day_val or ("Mês anterior" if "Economia" in name_val else f"Dia {r*5}")
            ))

    # Extract Categories
    categories: List[ExpenseCategory] = []
    cat_order = ["Casa", "Pessoal", "Credito", "Gastos"]
    table_to_cat = {
        "Expenses": "Casa",
        "Expenses-1-1-2-1": "Pessoal",
        "Expenses-1-1-2": "Credito",
        "Expenses-Gastos": "Gastos"
    }

    found_cats: Dict[str, List[ExpenseItem]] = {c: [] for c in cat_order}

    for tname, t in tables_by_name.items():
        if tname in ["Income", "Expenses-1", "Expenses-1-1", "Net"]:
            continue
        cat_name = str(safe_cell_value(t, 0, 0, "")).strip()
        if not cat_name or cat_name in ["Total despesas", "Data", "Mês controle"]:
            cat_name = table_to_cat.get(tname, "Outros")

        if cat_name not in found_cats:
            found_cats[cat_name] = []

        for r in range(1, t.num_rows):
            name_val = str(safe_cell_value(t, r, 0, "")).strip()
            if not name_val or "Total despesas" in name_val or "Despesas pagas" in name_val:
                continue
            if "#outlook" in name_val or "<style" in name_val:
                continue
            amt = parse_float_val(safe_cell_value(t, r, 1))
            paid = parse_bool_val(safe_cell_value(t, r, 2))
            due = parse_date_str(safe_cell_value(t, r, 3, "10"))
            if not due or due.lower() in ["none", "pago", "true", "false"]:
                due = f"{year:04d}-{month_num:02d}-10"
            clean_cat = cat_name.lower().replace(" ", "_")
            is_rec = False if clean_cat == "gastos" else True
            if clean_cat == "gastos":
                paid = True

            # Extração de parcelas caso estejam presentes no nome (ex: "Curso (2/10)" ou "2/12")
            inst_curr = None
            inst_tot = None
            m_inst = re.search(r"\(?(\d+)\s*[/xX]\s*(\d+)\)?", name_val)
            if m_inst:
                try:
                    parsed_curr = int(m_inst.group(1))
                    parsed_tot = int(m_inst.group(2))
                    if parsed_tot >= parsed_curr and parsed_tot > 1:
                        inst_curr = parsed_curr
                        inst_tot = parsed_tot
                except ValueError:
                    pass

            found_cats[cat_name].append(ExpenseItem(
                id=f"exp_{clean_cat}_{r}",
                name=name_val,
                amount=amt,
                paid=paid,
                due_day=due,
                is_recurring=is_rec,
                installments_current=inst_curr,
                installments_total=inst_tot
            ))

    for cat_name, items in found_cats.items():
        if items or cat_name in ["Casa", "Pessoal", "Credito", "Gastos"]:
            categories.append(ExpenseCategory(
                id=cat_name.lower().replace(" ", "_"),
                name=cat_name,
                items=items
            ))

    month = MonthData(
        id=month_id,
        title=title,
        year=year,
        month_number=month_num,
        file_path=filepath,
        last_modified=last_mod,
        is_in_drive=GOOGLE_DRIVE_DIR in filepath,
        incomes=incomes,
        categories=categories
    )

    ensure_gastos_category(month)
    return calculate_summary_and_timeline(month)

class NumbersManager:
    def __init__(self):
        ensure_data_dir()
        self.months: Dict[str, MonthData] = {}
        self.load_cache()

    def load_cache(self):
        if os.path.exists(CACHE_FILE):
            try:
                with open(CACHE_FILE, "r", encoding="utf-8") as f:
                    raw = json.load(f)
                    for mid, mdata in raw.items():
                        m = MonthData(**mdata)
                        ensure_gastos_category(m)
                        self.months[mid] = m
            except Exception as e:
                print(f"Error loading cache: {e}")

    def save_cache(self):
        ensure_data_dir()
        try:
            raw = {mid: m.model_dump() for mid, m in self.months.items()}
            with open(CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(raw, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Error saving cache: {e}")

    def scan_google_drive(self) -> int:
        count = 0
        if not os.path.exists(GOOGLE_DRIVE_DIR):
            return count

        # Sort so files with full year in name are processed after short names, or vice-versa
        # Actually sort files with 4 digits first so they set the primary data
        files = [f for f in os.listdir(GOOGLE_DRIVE_DIR) if f.endswith(".numbers")]
        # Process files without year first, then files with year so files with year take priority
        files.sort(key=lambda x: (1 if re.search(r"\d{4}", x) else 0, x))

        for f in files:
            full_path = os.path.join(GOOGLE_DRIVE_DIR, f)
            mtime = os.path.getmtime(full_path)
            iso_mtime = datetime.fromtimestamp(mtime).isoformat()
            meta = parse_filename_meta(f, full_path)
            if not meta:
                continue
            year, m_num, title = meta
            month_id = f"{year:04d}-{m_num:02d}"

            # Only parse if not present or newer
            if month_id not in self.months or self.months[month_id].last_modified != iso_mtime or (re.search(r"\d{4}", f) and not re.search(r"\d{4}", os.path.basename(self.months[month_id].file_path or ""))):
                parsed = parse_single_numbers_file(full_path)
                if parsed:
                    self.months[month_id] = parsed
                    count += 1

        self.save_cache()
        return count

    def list_months(self) -> List[MonthListItem]:
        self.scan_google_drive()
        items: List[MonthListItem] = []
        for mid, m in sorted(self.months.items(), key=lambda x: (x[1].year, x[1].month_number), reverse=True):
            items.append(MonthListItem(
                id=m.id,
                title=m.title,
                year=m.year,
                month_number=m.month_number,
                file_path=m.file_path,
                total_income=m.summary.total_income,
                received_income=m.summary.received_income,
                pending_income=m.summary.pending_income,
                current_balance=m.summary.current_balance,
                total_expenses=m.summary.total_expenses,
                total_paid=m.summary.total_paid,
                total_pending=m.summary.total_pending,
                balance=m.summary.balance,
                paid_percentage=m.summary.paid_percentage,
                is_in_drive=m.is_in_drive,
                last_modified=m.last_modified
            ))
        return items

    def get_month(self, month_id: str) -> Optional[MonthData]:
        self.scan_google_drive()
        m = self.months.get(month_id)
        if m:
            ensure_gastos_category(m)
        return m

    def update_month(self, month_id: str, updated: MonthData) -> MonthData:
        ensure_gastos_category(updated)
        updated = calculate_summary_and_timeline(updated)
        self.months[month_id] = updated
        target_path = updated.file_path or os.path.join(GOOGLE_DRIVE_DIR, f"{updated.title}.numbers")
        if os.path.exists(os.path.dirname(target_path)):
            try:
                self.write_numbers_file(updated, target_path)
            except Exception as e:
                print(f"Error auto-writing numbers file on update: {e}")
                updated.last_modified = datetime.now().isoformat()
                self.save_cache()
        else:
            updated.last_modified = datetime.now().isoformat()
            self.save_cache()
        return updated

    def create_month(self, req: CreateMonthRequest) -> MonthData:
        month_id = f"{req.year:04d}-{req.month_number:02d}"
        title = req.title or f"{MONTHS_NAMES_PT[req.month_number]} {req.year}"

        incomes: List[IncomeItem] = []
        categories: List[ExpenseCategory] = []

        base_month = None
        if req.clone_from_id and req.clone_from_id in self.months:
            base_month = self.months[req.clone_from_id]
        elif self.months:
            # clone from most recent
            base_month = sorted(self.months.values(), key=lambda x: (x.year, x.month_number), reverse=True)[0]

        if base_month:
            # Clone Incomes
            for inc in base_month.incomes:
                inc_day = inc.day
                # Replace year/month in date
                if inc_day and "-" in inc_day:
                    match = re.search(r"(\d{4})-(\d{2})-(\d{2})", inc_day)
                    if match:
                        day_num = match.group(3)
                        inc_day = f"{req.year:04d}-{req.month_number:02d}-{day_num}"
                
                # Check for Economias / Carry over balance
                amount = inc.amount
                if "Economia" in inc.name and req.carry_over_balance:
                    amount = max(0.0, base_month.summary.balance)

                incomes.append(IncomeItem(
                    id=f"inc_{uuid.uuid4().hex[:6]}",
                    name=inc.name,
                    amount=amount,
                    day=inc_day
                ))

            # Clone Categories
            for cat in base_month.categories:
                cloned_items: List[ExpenseItem] = []
                for exp in cat.items:
                    # As despesas não marcadas como recorrentes NÃO devem ser replicadas
                    if not getattr(exp, "is_recurring", True):
                        continue

                    # Tratamento de Parcelas
                    inst_curr = getattr(exp, "installments_current", None)
                    inst_tot = getattr(exp, "installments_total", None)

                    # Se não estiverem preenchidos nos campos, tenta inferir do nome (ex: "Curso (1/10)")
                    if (inst_curr is None or inst_tot is None) and exp.name:
                        m_inst = re.search(r"\(?(\d+)\s*[/xX]\s*(\d+)\)?", exp.name)
                        if m_inst:
                            try:
                                inst_curr = int(m_inst.group(1))
                                inst_tot = int(m_inst.group(2))
                            except ValueError:
                                pass

                    new_name = exp.name
                    next_curr = None

                    if inst_tot and inst_tot > 1:
                        curr = inst_curr if (inst_curr is not None and inst_curr > 0) else 1
                        # Se já era a última parcela (ex: 10 de 10), encerrou o parcelamento! NÃO copia!
                        if curr >= inst_tot:
                            continue
                        
                        next_curr = curr + 1
                        # Atualiza no nome se tiver padrão (X/Y)
                        if re.search(r"\(?(\d+)\s*[/xX]\s*(\d+)\)?", new_name):
                            new_name = re.sub(
                                r"\(?(\d+)\s*[/xX]\s*(\d+)\)?",
                                f"({next_curr}/{inst_tot})",
                                new_name,
                                count=1
                            )

                    due = exp.due_day
                    if due and "-" in due:
                        match = re.search(r"(\d{4})-(\d{2})-(\d{2})", due)
                        if match:
                            day_num = match.group(3)
                            due = f"{req.year:04d}-{req.month_number:02d}-{day_num}"
                    cloned_items.append(ExpenseItem(
                        id=f"exp_{cat.id}_{uuid.uuid4().hex[:6]}",
                        name=new_name,
                        amount=exp.amount,
                        paid=False if req.reset_paid else exp.paid,
                        due_day=due,
                        notes=exp.notes,
                        is_recurring=exp.is_recurring,
                        installments_current=next_curr,
                        installments_total=inst_tot
                    ))
                categories.append(ExpenseCategory(
                    id=cat.id,
                    name=cat.name,
                    items=cloned_items
                ))
        else:
            # Default empty templates
            incomes = [
                IncomeItem(id=f"inc_{uuid.uuid4().hex[:6]}", name="Salário / Renda Principal", amount=0.0, day=f"{req.year:04d}-{req.month_number:02d}-10"),
                IncomeItem(id=f"inc_{uuid.uuid4().hex[:6]}", name="Economias", amount=0.0, day="Mês anterior")
            ]
            categories = [
                ExpenseCategory(id="casa", name="Casa", items=[]),
                ExpenseCategory(id="pessoal", name="Pessoal", items=[]),
                ExpenseCategory(id="credito", name="Credito", items=[])
            ]

        new_month = MonthData(
            id=month_id,
            title=title,
            year=req.year,
            month_number=req.month_number,
            file_path=os.path.join(GOOGLE_DRIVE_DIR, f"{title}.numbers"),
            last_modified=datetime.now().isoformat(),
            is_in_drive=True,
            incomes=incomes,
            categories=categories
        )

        new_month = calculate_summary_and_timeline(new_month)
        self.months[month_id] = new_month
        self.save_cache()

        if req.sync_to_drive:
            self.write_numbers_file(new_month)

        return new_month

    def write_numbers_file(self, month: MonthData, target_path: Optional[str] = None) -> str:
        if not target_path:
            target_path = os.path.join(GOOGLE_DRIVE_DIR, f"{month.title}.numbers")

        doc = Document()
        sheet = doc.sheets[0]
        sheet.name = "Budget"

        # 1. Income Table
        t_inc = sheet.tables[0]
        t_inc.name = "Income"
        t_inc.write(0, 0, "Recebido")
        t_inc.write(0, 2, "Dia")
        row = 1
        for inc in month.incomes:
            t_inc.write(row, 0, inc.name)
            t_inc.write(row, 1, float(inc.amount))
            t_inc.write(row, 2, inc.day or "")
            row += 1
        t_inc.write(row, 0, "Total despesas")
        t_inc.write(row, 1, float(month.summary.total_expenses))
        row += 1
        t_inc.write(row, 0, "Total entrada no mês")
        t_inc.write(row, 1, float(month.summary.total_income))
        row += 1
        t_inc.write(row, 0, "Total restante no mês")
        t_inc.write(row, 1, float(month.summary.balance))

        # 2. Categories
        cat_tables_map = {
            "casa": "Expenses",
            "pessoal": "Expenses-1-1-2-1",
            "credito": "Expenses-1-1-2",
            "gastos": "Expenses-Gastos"
        }

        for cat in month.categories:
            table_name = cat_tables_map.get(cat.id, f"Expenses-{cat.id}")
            num_rows = max(4, len(cat.items) + 3)
            t_exp = sheet.add_table(table_name, num_rows, 4)
            t_exp.write(0, 0, cat.name)
            t_exp.write(0, 3, "Dia")
            r_idx = 1
            for it in cat.items:
                item_name = it.name
                if getattr(it, "installments_total", None) and it.installments_total > 1:
                    curr = it.installments_current or 1
                    if not re.search(r"\(?(\d+)\s*[/xX]\s*(\d+)\)?", item_name):
                        item_name = f"{item_name} ({curr}/{it.installments_total})"
                t_exp.write(r_idx, 0, item_name)
                t_exp.write(r_idx, 1, float(it.amount))
                t_exp.write(r_idx, 2, bool(it.paid))
                t_exp.write(r_idx, 3, str(it.due_day or ""))
                r_idx += 1
            t_exp.write(r_idx, 0, "Total despesas")
            t_exp.write(r_idx, 1, float(cat.total))
            r_idx += 1
            t_exp.write(r_idx, 0, "Despesas pagas")
            t_exp.write(r_idx, 1, float(cat.paid_total))

        # 3. Control Month Table
        t_ctrl = sheet.add_table("Expenses-1-1", 2, 1)
        t_ctrl.write(0, 0, "Mês controle")
        t_ctrl.write(1, 0, float(month.month_number))

        # 4. Daily Timeline Table
        t_time = sheet.add_table("Expenses-1", len(month.daily_timeline) + 1, 2)
        t_time.write(0, 0, "Data")
        t_time.write(0, 1, "Total dívida")
        for i, tl in enumerate(month.daily_timeline):
            t_time.write(i + 1, 0, f"{tl.date} 00:00:00")
            t_time.write(i + 1, 1, float(tl.total_debt))

        doc.save(target_path)
        mtime = os.path.getmtime(target_path)
        month.file_path = target_path
        month.last_modified = datetime.fromtimestamp(mtime).isoformat()
        month.is_in_drive = GOOGLE_DRIVE_DIR in target_path
        self.save_cache()
        return target_path

numbers_manager = NumbersManager()
