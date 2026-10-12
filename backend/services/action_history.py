import os
import json
from datetime import datetime
from typing import List, Dict, Any, Optional

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
ACTIONS_FILE = os.path.join(BASE_DIR, "data", "recent_actions.json")

class ActionHistory:
    def __init__(self, max_items: int = 30):
        self.max_items = max_items
        self.actions: List[Dict[str, Any]] = []
        self.load()

    def load(self):
        os.makedirs(os.path.dirname(ACTIONS_FILE), exist_ok=True)
        if os.path.exists(ACTIONS_FILE):
            try:
                with open(ACTIONS_FILE, "r", encoding="utf-8") as f:
                    self.actions = json.load(f)
            except Exception:
                self.actions = []
        else:
            self.actions = []

    def save(self):
        try:
            with open(ACTIONS_FILE, "w", encoding="utf-8") as f:
                json.dump(self.actions[:self.max_items], f, indent=2, ensure_ascii=False)
        except Exception:
            pass

    def record(
        self,
        action_type: str,
        title: str,
        amount: Optional[float] = None,
        category: Optional[str] = None,
        source: str = "manual",
        status: str = "Concluído",
        details: Optional[str] = None
    ) -> Dict[str, Any]:
        item = {
            "id": f"act_{int(datetime.now().timestamp() * 1000)}",
            "type": action_type,
            "title": title,
            "amount": round(float(amount), 2) if amount is not None else None,
            "category": category or "Gastos",
            "source": source,
            "status": status,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.actions.insert(0, item)
        self.actions = self.actions[:self.max_items]
        self.save()
        return item

    def get_recent(self, limit: int = 10, month_data: Optional[Any] = None) -> List[Dict[str, Any]]:
        result = list(self.actions[:limit])
        
        # Se houver menos de 4 ações registradas no histórico recente,
        # completamos com os últimos gastos da planilha para não ficar vazio
        if len(result) < 4 and month_data:
            gastos_cat = next((c for c in getattr(month_data, "categories", []) if c.id == "gastos"), None)
            if gastos_cat and getattr(gastos_cat, "items", None):
                for exp in gastos_cat.items[:6]:
                    # Evita duplicar se já foi adicionado
                    if any(r.get("title") == exp.name and abs((r.get("amount") or 0) - exp.amount) < 0.01 for r in result):
                        continue
                    result.append({
                        "id": f"seed_{exp.id}",
                        "type": "create",
                        "title": exp.name,
                        "amount": exp.amount,
                        "category": "Gastos",
                        "source": "gmail" if exp.notes and "Nubank" in exp.notes else "manual",
                        "status": "Pago" if exp.paid else "Pendente",
                        "details": exp.due_day or "Planilha",
                        "timestamp": None
                    })
                    if len(result) >= limit:
                        break

        return result[:limit]

action_history = ActionHistory()
