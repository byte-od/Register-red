import os
import uuid
import socket
import shutil
import tempfile
import re
import html
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, UploadFile, File, Response, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse

try:
    from backend.models.schema import (
        MonthData, MonthListItem, CreateMonthRequest, SyncResult, ExpenseItem, ExpenseCategory, IncomeItem
    )
    from backend.services.numbers_service import numbers_manager, GOOGLE_DRIVE_DIR
    from backend.services.excel_service import generate_excel_workbook
    from backend.services.gmail_watcher import gmail_watcher
    from backend.services.action_history import action_history
except ImportError:
    from models.schema import (
        MonthData, MonthListItem, CreateMonthRequest, SyncResult, ExpenseItem, ExpenseCategory, IncomeItem
    )
    from services.numbers_service import numbers_manager, GOOGLE_DRIVE_DIR
    from services.excel_service import generate_excel_workbook
    from services.gmail_watcher import gmail_watcher
    from services.action_history import action_history

app = FastAPI(title="Gestão Financeira & Planilhas Numbers", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    gmail_watcher.start_background()

@app.on_event("shutdown")
def shutdown_event():
    gmail_watcher.stop()

@app.get("/api/months", response_model=List[MonthListItem])
def list_months():
    return numbers_manager.list_months()

@app.get("/api/months/{month_id}", response_model=MonthData)
def get_month(month_id: str):
    data = numbers_manager.get_month(month_id)
    if not data:
        raise HTTPException(status_code=404, detail="Mês não encontrado")
    return data

@app.post("/api/months", response_model=MonthData)
def create_month(req: CreateMonthRequest):
    try:
        new_month = numbers_manager.create_month(req)
        return new_month
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar mês: {str(e)}")

@app.put("/api/months/{month_id}", response_model=MonthData)
def update_month(month_id: str, updated: MonthData):
    try:
        saved = numbers_manager.update_month(month_id, updated)
        return saved
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar: {str(e)}")

@app.post("/api/months/{month_id}/toggle-paid")
def toggle_paid(month_id: str, item_id: str, paid: bool):
    month = numbers_manager.get_month(month_id)
    if not month:
        raise HTTPException(status_code=404, detail="Mês não encontrado")
    
    found_it = None
    found_cat = None
    for cat in month.categories:
        for it in cat.items:
            if it.id == item_id:
                it.paid = paid
                found_it = it
                found_cat = cat
                found = True
                break
        if found:
            break
            
    if not found or not found_it:
        raise HTTPException(status_code=404, detail="Item de despesa não encontrado")

    updated = numbers_manager.update_month(month_id, month)
    action_history.record(
        action_type="pay" if paid else "unpay",
        title=found_it.name,
        amount=found_it.amount,
        category=found_cat.name if found_cat else "Gastos",
        source="manual",
        status="Pago" if paid else "Pendente"
    )
    return {"success": True, "item_id": item_id, "paid": paid, "summary": updated.summary}

@app.post("/api/months/{month_id}/toggle-recurring")
def toggle_recurring(
    month_id: str,
    item_id: str,
    is_recurring: bool,
    installments_current: Optional[int] = Query(None),
    installments_total: Optional[int] = Query(None)
):
    month = numbers_manager.get_month(month_id)
    if not month:
        raise HTTPException(status_code=404, detail="Mês não encontrado")
    
    found = False
    for cat in month.categories:
        for it in cat.items:
            if it.id == item_id:
                if cat.id == "gastos":
                    it.is_recurring = False
                    it.installments_current = None
                    it.installments_total = None
                else:
                    it.is_recurring = is_recurring
                    it.installments_current = installments_current
                    it.installments_total = installments_total
                found = True
                break
        if found:
            break
            
    if not found:
        raise HTTPException(status_code=404, detail="Item de despesa não encontrado")

    updated = numbers_manager.update_month(month_id, month)
    return {
        "success": True,
        "item_id": item_id,
        "is_recurring": is_recurring,
        "installments_current": installments_current,
        "installments_total": installments_total
    }

@app.post("/api/months/{month_id}/move-item")
def move_item(
    month_id: str,
    item_id: str,
    target_cat_id: str,
    is_recurring: bool = True,
    installments_current: Optional[int] = Query(None),
    installments_total: Optional[int] = Query(None)
):
    month = numbers_manager.get_month(month_id)
    if not month:
        raise HTTPException(status_code=404, detail="Mês não encontrado")

    target_cat = next((c for c in month.categories if c.id.lower() == target_cat_id.lower()), None)
    if not target_cat:
        raise HTTPException(status_code=404, detail=f"Categoria de destino '{target_cat_id}' não encontrada")

    found_item = None
    source_cat = None
    for cat in month.categories:
        for it in cat.items:
            if it.id == item_id:
                found_item = it
                source_cat = cat
                break
        if found_item:
            break

    if not found_item:
        raise HTTPException(status_code=404, detail="Item de despesa não encontrado")

    # Remove da categoria de origem
    source_cat.items.remove(found_item)

    # Atualiza propriedades: recorrente, parcelas e novo id
    found_item.is_recurring = is_recurring
    found_item.installments_current = installments_current
    found_item.installments_total = installments_total
    found_item.id = f"exp_{target_cat.id}_{uuid.uuid4().hex[:6]}"

    # Adiciona à categoria de destino
    target_cat.items.append(found_item)

    updated = numbers_manager.update_month(month_id, month)
    inst_txt = f" ({installments_current}/{installments_total})" if installments_total else ""
    action_history.record(
        action_type="move",
        title=f"{found_item.name}{inst_txt}",
        amount=found_item.amount,
        category=target_cat.name,
        source="manual",
        status=f"Movido para {target_cat.name}"
    )
    return {
        "success": True,
        "item": found_item,
        "source_category": source_cat.id,
        "target_category": target_cat.id,
        "month": updated
    }


@app.post("/api/months/{month_id}/sync-drive", response_model=SyncResult)
def sync_to_drive(month_id: str):
    month = numbers_manager.get_month(month_id)
    if not month:
        raise HTTPException(status_code=404, detail="Mês não encontrado")
    try:
        path = numbers_manager.write_numbers_file(month)
        return SyncResult(
            success=True,
            message="Planilha sincronizada e atualizada com sucesso no Google Drive!",
            file_path=path
        )
    except Exception as e:
        return SyncResult(
            success=False,
            message=f"Erro ao sincronizar com Google Drive: {str(e)}"
        )

@app.get("/api/months/{month_id}/export/excel")
def export_excel(month_id: str):
    month = numbers_manager.get_month(month_id)
    if not month:
        raise HTTPException(status_code=404, detail="Mês não encontrado")
    
    buffer = generate_excel_workbook(month)
    filename = f"{month.title}.xlsx"
    headers = {
        'Content-Disposition': f'attachment; filename="{filename}"'
    }
    return Response(
        content=buffer.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers
    )

@app.get("/api/months/{month_id}/export/numbers")
def export_numbers(month_id: str):
    month = numbers_manager.get_month(month_id)
    if not month:
        raise HTTPException(status_code=404, detail="Mês não encontrado")
    
    # Check if existing file is available
    if month.file_path and os.path.exists(month.file_path):
        return FileResponse(
            month.file_path,
            filename=f"{month.title}.numbers",
            media_type="application/vnd.apple.numbers"
        )
    
    # Or generate fresh
    tmp = tempfile.NamedTemporaryFile(suffix=".numbers", delete=False)
    tmp_path = tmp.name
    tmp.close()
    numbers_manager.write_numbers_file(month, target_path=tmp_path)
    return FileResponse(
        tmp_path,
        filename=f"{month.title}.numbers",
        media_type="application/vnd.apple.numbers"
    )

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith(".numbers"):
        raise HTTPException(status_code=400, detail="Por favor, envie um arquivo .numbers válido")
    
    target_path = os.path.join(GOOGLE_DRIVE_DIR, file.filename)
    with open(target_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    numbers_manager.scan_google_drive()
    return {"success": True, "filename": file.filename, "message": "Arquivo salvo com sucesso no Google Drive!"}

@app.get("/api/stats/overview")
def get_stats_overview():
    months = numbers_manager.list_months()
    # Take last 6 to 12 months in chronological order
    recent = sorted(months[:12], key=lambda x: (x.year, x.month_number))
    return {
        "months": [m.title for m in recent],
        "incomes": [m.total_income for m in recent],
        "expenses": [m.total_expenses for m in recent],
        "balances": [m.balance for m in recent],
        "paid_rates": [m.paid_percentage for m in recent],
        "total_active_months": len(months),
        "drive_path": GOOGLE_DRIVE_DIR
    }

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

@app.get("/api/network-info")
def get_network_info():
    ip = get_local_ip()
    port = 8000
    return {
        "ip": ip,
        "port": port,
        "url": f"http://{ip}:{port}"
    }

@app.get("/api/qrcode")
def get_qrcode():
    import io, qrcode, qrcode.image.svg
    ip = get_local_ip()
    url = f"http://{ip}:8000"
    factory = qrcode.image.svg.SvgPathImage
    img = qrcode.make(url, image_factory=factory)
    buf = io.BytesIO()
    img.save(buf)
    return Response(content=buf.getvalue(), media_type="image/svg+xml")


# --- GEMINI / AI CALL-TO-ACTION & AUTOMATION ENDPOINTS ---

class GeminiActionPayload(BaseModel):
    command: Optional[str] = None
    action: Optional[str] = None  # "create", "read", "pay", "delete"
    category: Optional[str] = None  # "casa", "pessoal", "credito", "gastos"
    name: Optional[str] = None
    amount: Optional[float] = None
    due_day: Optional[str] = None
    paid: Optional[bool] = None
    notes: Optional[str] = None
    month_id: Optional[str] = None

def clean_email_html(raw_text: str) -> str:
    if "<" in raw_text and ">" in raw_text:
        raw_text = re.sub(r"(?is)<style.*?</style>", " ", raw_text)
        raw_text = re.sub(r"(?is)<script.*?</script>", " ", raw_text)
        # Preserva centavos separados por tags: ex 96<span...>,99</span>
        raw_text = re.sub(r"(\d+)\s*(?:<[^>]+>\s*)*([,.]\s*\d{2})\b", r"\1\2", raw_text)
        clean = re.sub(r"<[^>]+>", " ", raw_text)
        clean = html.unescape(clean)
    else:
        clean = raw_text

    # Remove caracteres de largura zero comuns em templates Nubank (e.g. \u200c, \ufeff)
    clean = re.sub(r"[\u200b\u200c\u200d\ufeff]", "", clean)
    clean = re.sub(r"\s+", " ", clean).strip()
    # Corrige espaçamento antes da vírgula decimal: ex "R$ 96 ,99" -> "R$ 96,99"
    clean = re.sub(r"(r\$\s*[\d.]+)\s*([,.])\s*(\d{1,2})\b", r"\1\2\3", clean, flags=re.I)
    return clean

def parse_gemini_command(cmd: str) -> Dict[str, Any]:
    cmd = clean_email_html(cmd)
    cmd_lower = cmd.lower().strip()
    
    # 0. Extração de Valor Monetário (sempre buscando após R$ e contando todas as casas decimais)
    amt_bank = None
    m_val = re.search(r"r\$\s*(\d{1,3}(?:\.\d{3})*|\d+)(?:[,.](\d{1,2}))?", cmd, re.I)
    if m_val:
        inteiro = m_val.group(1).replace(".", "")
        decimais = m_val.group(2) or "00"
        if len(decimais) == 1:
            decimais = decimais + "0"
        try:
            amt_bank = float(f"{inteiro}.{decimais}")
        except Exception:
            amt_bank = None

    # 0a. Recebimento de valores / Pix recebido / Transferência recebida
    m_inc_nu = re.search(r"(?:voc[êe]\s+recebeu\s+(?:uma\s+transfer[êe]ncia|um\s+pix|um\s+dep[óo]sito)?\s*(?:de\s+)?|transfer[êe]ncia\s+recebida\s+de\s+|pix\s+recebido(?::|\s+de)?\s*)r\$\s*([\d.,]+)(?:\s+(?:de|por)\s+(.+?))?(?:\.|$)", cmd, re.I)
    if m_inc_nu:
        origem = (m_inc_nu.group(2) or "Depósito / Pix").strip(" .")
        return {"action": "income", "name": f"Recebido: {origem}", "amount": amt_bank or 0.0}

    # 0b. Detecção de Despesas Bancárias / Nubank (Destinatário geralmente após 'para' ou 'em')
    CHARS = r"[a-zA-Z0-9\u00C0-\u00FF\s\'()/-]"
    bank_dest = None
    bank_cat = "gastos"

    # Compra no cartão de crédito / débito
    m_cartao = re.search(r"compra\s+(?:aprovada\s+)?(?:de\s+r\$\s*[\d.,]+\s+)?(?:no\s+(cr[ée]dito|d[ée]bito)\s+)?em\s+(" + CHARS + r"+?)(?:\s+aprovada|\.|$)", cmd, re.I)
    if m_cartao:
        tipo = (m_cartao.group(1) or "").lower()
        if "cr" in tipo:
            bank_cat = "credito"
        bank_dest = m_cartao.group(2).strip(" .:-")

    # Boleto: "Você pagou o boleto de R$ X de/para [FAVORECIDO]"
    if not bank_dest:
        m_bol = re.search(r"boleto\s+(?:de\s+r\$\s*[\d.,]+\s+)?(?:de|para)\s+(" + CHARS + r"+?)(?:\s+(?:com\s+sucesso|pago)|\.|$)", cmd, re.I)
        if m_bol:
            bank_dest = m_bol.group(1).strip(" .:-")

    # Pix / Transferência com verbos: Você realizou/transferiu/enviou/fez ... para [FAVORECIDO]
    if not bank_dest:
        m_verb = re.search(r"(?:voc[êe]\s+)?(?:transferiu|realizou\s+(?:uma\s+)?transfer[êe]ncia|enviou\s+(?:um\s+)?pix|fez\s+(?:um\s+)?pix|pagou)\s+(?:(?:de|no\s+valor(?:\s+de)?)\s+r\$\s*[\d.,]+\s+)?para\s+(" + CHARS + r"+?)(?:\s+(?:no\s+valor|valor|com\s+sucesso)|\.|$|\s+data:)", cmd, re.I)
        if m_verb:
            bank_dest = m_verb.group(1).strip(" .:-")

    # Nu Empresas / Nubank / Transferência / Pix enviado para [FAVORECIDO]
    if not bank_dest:
        m_transf = re.search(r"(?:transfer[êe]ncia\s+(?:entre\s+contas\s+(?:do\s+nubank\s+)?para|para|enviada\s+para)|pix\s+enviado\s+para)\s+(" + CHARS + r"+?)(?:\s+(?:foi\s+realizada|no\s+valor|com\s+sucesso)|\.|$)", cmd, re.I | re.S)
        if m_transf:
            bank_dest = m_transf.group(1).strip(" .:-")

    # Pix Automático Nubank: "Seu Pix Automático para [FAVORECIDO]"
    if not bank_dest:
        m_pix_auto = re.search(r"pix\s+autom[áa]tico\s+para\s+(" + CHARS + r"+?)(?:\s+(?:no\s+valor|valor|foi\s+conclu[íi]d)|\.|$)", cmd, re.I | re.S)
        if m_pix_auto:
            bank_dest = m_pix_auto.group(1).strip(" .:-")

    # Você pagou R$ X em [ESTABELECIMENTO]
    if not bank_dest:
        m_pagou = re.search(r"voc[êe]\s+pagou\s+(?:r\$\s*[\d.,]+\s+)?em\s+(" + CHARS + r"+?)(?:\s+com\s+sucesso|\.|$)", cmd, re.I)
        if m_pagou:
            bank_dest = m_pagou.group(1).strip(" .:-")

    # Genérico bancário: qualquer frase bancária contendo "para [FAVORECIDO]"
    if not bank_dest and amt_bank is not None and any(k in cmd_lower for k in ["nubank", "transferência", "transferencia", "pix", "comprovante", "pagamento"]):
        m_gen = re.search(r"\bpara\s+(" + CHARS + r"+?)(?=(?:\s+(?:no\s+valor|valor\s+de|valor\s+enviado|foi\s+realizada|foi\s+conclu[íi]d[ao]|com\s+sucesso))|(?:\s*[\.\n]|$))", cmd, re.I)
        if m_gen:
            bank_dest = m_gen.group(1).strip(" .:-")

    if bank_dest and amt_bank is not None and amt_bank > 0.0:
        bank_dest = re.sub(r"\s+", " ", bank_dest).strip(" .:-")
        bank_dest = re.split(r"(?i)\s+(?:no\s+dia|às\s+\d|\d{1,2}\s+[a-z]{3}\s+às)", bank_dest)[0].strip(" .:-")
        return {
            "action": "create",
            "name": bank_dest,
            "amount": amt_bank,
            "category": bank_cat,
            "paid": True,
            "notes": "Nubank Auto"
        }

    # 0c. Comandos de voz de receita: "Recebi 500 reais de freela", "Entrou 300 reais", etc.
    m_inc_voice = re.search(r"(?:recebi|entrou|ganhei|nova\s+receita|adicionar\s+receita|receita\s+de)\s+(?:r\$\s*)?([\d.,]+)(?:\s*reais)?(?:\s+(?:de|em|com|por)\s+(.+?))?(?:\.|$)", cmd, re.I)
    if m_inc_voice:
        amt_str = m_inc_voice.group(1).replace(".", "").replace(",", ".")
        amt = float(amt_str)
        origem = (m_inc_voice.group(2) or "Receita Extra").strip(" .")
        return {"action": "income", "name": origem, "amount": amt}

    # 1. Read / Resumo
    if any(k in cmd_lower for k in ['resumo', 'quanto gastei', 'quanto falta', 'saldo', 'relatorio', 'relatório', 'briefing', 'ler contas', 'minhas despesas']):
        return {'action': 'read'}
        
    # 2. Toggle Paid / Pay
    if any(k in cmd_lower for k in ['pagar', 'paguei', 'pago', 'quitei', 'quitar', 'dar baixa', 'baixar']):
        cleaned = re.sub(r'\b(pagar|paguei|pago|quitei|quitar|dar baixa|baixar|conta de|a conta|o|a)\b', '', cmd_lower).strip()
        return {'action': 'pay', 'name': cleaned, 'paid': True}
        
    if any(k in cmd_lower for k in ['desmarcar', 'pendente', 'nao paguei', 'não paguei']):
        cleaned = re.sub(r'\b(desmarcar|pendente|nao paguei|não paguei|conta de|a conta|o|a)\b', '', cmd_lower).strip()
        return {'action': 'pay', 'name': cleaned, 'paid': False}

    # 3. Delete
    if any(k in cmd_lower for k in ['deletar', 'excluir', 'remover', 'apagar']):
        cleaned = re.sub(r'\b(deletar|excluir|remover|apagar|o gasto|a despesa|gasto|despesa|o|a)\b', '', cmd_lower).strip()
        return {'action': 'delete', 'name': cleaned}

    # 4. Create Expense
    amount = amt_bank if amt_bank is not None else 0.0
    amt_match = None
    if not amount:
        amt_match = re.search(r'(?:r\$|\$)?\s*(\d+(?:[.,]\d{1,2})?)', cmd_lower)
        if amt_match:
            val_str = amt_match.group(1).replace(',', '.')
            try:
                amount = float(val_str)
            except Exception:
                amount = 0.0

    # Extract category
    category = 'gastos'
    if any(k in cmd_lower for k in [' em casa', ' na casa', 'categoria casa', ' de casa']):
        category = 'casa'
    elif any(k in cmd_lower for k in [' em pessoal', ' no pessoal', 'categoria pessoal', ' pessoal']):
        category = 'pessoal'
    elif any(k in cmd_lower for k in [' em credito', ' no credito', 'cartao', 'cartão', 'crédito', 'credito']):
        category = 'credito'
    elif any(k in cmd_lower for k in [' em gastos', ' nos gastos', 'categoria gastos', ' gastos']):
        category = 'gastos'

    # Extract name
    name = cmd
    name = re.sub(r'(?i)\b(adicionar|adicione|novo gasto|gasto|lancar|lançar|lance|criar|crie)\b', '', name)
    name = re.sub(r'(?i)(?:em|na|no|categoria)\s+(casa|pessoal|credito|crédito|gastos|cartão|cartao)', '', name)
    if amt_match:
        name = name.replace(amt_match.group(0), '')
        name = re.sub(r'(?i)\b(reais|real|r\$|\$)\b', '', name)
    name = re.sub(r'(?i)\b(em|na|no)\b', '', name)
    name = re.sub(r'^(?:de\s+|da\s+|do\s+)', '', name.strip(), flags=re.I)
    name = re.sub(r'\s+', ' ', name).strip(' :,.-')
    if not name:
        name = 'Gasto Avulso'

    return {'action': 'create', 'name': name, 'amount': amount, 'category': category}

def execute_gemini_action(payload: GeminiActionPayload) -> Dict[str, Any]:
    month_id = payload.month_id
    if not month_id:
        months_list = numbers_manager.list_months()
        if any(m.id == "2026-10" for m in months_list):
            month_id = "2026-10"
        elif months_list:
            month_id = months_list[0].id
        else:
            month_id = "2026-10"
            
    month = numbers_manager.get_month(month_id)
    if not month:
        raise HTTPException(status_code=404, detail=f"Mês {month_id} não encontrado")

    action = payload.action
    name = payload.name
    amount = payload.amount
    category = payload.category or "gastos"
    paid = payload.paid
    due_day = payload.due_day
    notes = payload.notes

    if payload.command:
        parsed = parse_gemini_command(payload.command)
        if not action:
            action = parsed.get("action")
        if not name:
            name = parsed.get("name")
        if amount is None and "amount" in parsed:
            amount = parsed.get("amount")
        if not payload.category and "category" in parsed:
            category = parsed.get("category")
        if paid is None and "paid" in parsed:
            paid = parsed.get("paid")

    action = (action or "create").lower()

    if action == "read":
        speech = (
            f"Em {month.title}, seu total de despesas é R$ {month.summary.total_expenses:,.2f} "
            f"com receitas de R$ {month.summary.total_income:,.2f}, resultando em um saldo de R$ {month.summary.balance:,.2f}. "
            f"Você já pagou {month.summary.paid_count} contas (R$ {month.summary.total_paid:,.2f}) e restam "
            f"{month.summary.pending_count} contas pendentes somando R$ {month.summary.total_pending:,.2f}."
        )
        cats_breakdown = [{
            "id": c.id,
            "name": c.name,
            "total": c.total,
            "paid_total": c.paid_total,
            "pending_total": c.pending_total,
            "items_count": len(c.items)
        } for c in month.categories]

        return {
            "success": True,
            "action": "read",
            "message": speech,
            "speech_text": speech,
            "month_id": month.id,
            "month_title": month.title,
            "summary": month.summary.model_dump(),
            "categories": cats_breakdown
        }

    elif action == "pay":
        if not name:
            return {"success": False, "message": "Por favor, informe o nome da conta para dar baixa."}
        
        target_name = name.lower().strip()
        matched_item = None
        matched_cat = None
        for cat in month.categories:
            for it in cat.items:
                if target_name in it.name.lower() or it.name.lower() in target_name:
                    matched_item = it
                    matched_cat = cat
                    break
            if matched_item:
                break
        
        if not matched_item:
            return {
                "success": False,
                "message": f"Nenhuma conta correspondente a '{name}' foi encontrada em {month.title}."
            }

        should_pay = True if paid is None else bool(paid)
        matched_item.paid = should_pay
        updated = numbers_manager.update_month(month.id, month)
        status_txt = "PAGA" if should_pay else "PENDENTE"
        speech = f"Conta '{matched_item.name}' no valor de R$ {matched_item.amount:,.2f} marcada como {status_txt} com sucesso!"
        return {
            "success": True,
            "action": "pay",
            "message": speech,
            "speech_text": speech,
            "item": matched_item.model_dump(),
            "category": matched_cat.id,
            "summary": updated.summary.model_dump()
        }

    elif action == "delete":
        if not name:
            return {"success": False, "message": "Por favor, informe o nome da conta para remover."}
        target_name = name.lower().strip()
        removed_item = None
        for cat in month.categories:
            for it in cat.items:
                if target_name in it.name.lower() or it.name.lower() in target_name:
                    removed_item = it
                    cat.items.remove(it)
                    break
            if removed_item:
                break

        if not removed_item:
            return {"success": False, "message": f"Nenhuma conta encontrada com o nome '{name}' para remover."}

        updated = numbers_manager.update_month(month.id, month)
        speech = f"Gasto '{removed_item.name}' removido com sucesso de {month.title}."
        return {
            "success": True,
            "action": "delete",
            "message": speech,
            "speech_text": speech,
            "summary": updated.summary.model_dump()
        }

    elif action in ["income", "receita"]:
        if not name:
            name = "Receita Extra"
        if amount is None or amount <= 0:
            return {"success": False, "message": "Por favor, informe o valor recebido."}

        new_inc = IncomeItem(
            id=f"inc_{int(datetime.now().timestamp()*1000)}",
            name=name.strip(),
            amount=round(float(amount), 2),
            day=due_day or datetime.now().strftime("%Y-%m-%d")
        )
        month.incomes.append(new_inc)
        updated = numbers_manager.update_month(month.id, month)
        try:
            numbers_manager.write_numbers_file(updated)
        except Exception:
            pass

        speech = (
            f"Receita '{new_inc.name}' de R$ {new_inc.amount:,.2f} registrada com sucesso! "
            f"Suas entradas totais subiram para R$ {updated.summary.total_income:,.2f} "
            f"e seu saldo restante aumentou para R$ {updated.summary.balance:,.2f}."
        )
        action_history.record(
            action_type="income",
            title=new_inc.name,
            amount=new_inc.amount,
            category="Receitas",
            source="gemini",
            status="Recebido"
        )
        return {
            "success": True,
            "action": "income",
            "message": speech,
            "speech_text": speech,
            "income": new_inc.model_dump(),
            "summary": updated.summary.model_dump()
        }

    else:  # action == "create"
        if not name:
            name = "Gasto Avulso"
        if amount is None or amount <= 0.0:
            return {
                "success": False,
                "message": "Nenhum valor financeiro válido foi identificado no comando ou e-mail."
            }

        # --- RECONCILIAÇÃO INTELIGENTE DE CONTAS PLANEJADAS ---
        # Se este pagamento bater com uma conta que já estava planejada e pendente na planilha
        # (ex: Aluguel, Luz, Internet, Condomínio, Claro, etc.), damos baixa nela em vez de duplicar em Gastos!
        BILL_ALIASES = {
            "luz": ["enel", "cpfl", "cemig", "eletropaulo", "energia", "luz", "energisa", "neoenergia", "copel", "light"],
            "agua": ["agua", "água", "sabesp", "sanepar", "copasa", "caesb", "dae", "saae", "corsan", "cedae"],
            "internet": ["internet", "fibra", "vero", "desktop", "claro net", "provedor", "starlink", "oi fibra"],
            "aluguel": ["aluguel", "imobiliaria", "imobiliária", "proprietario", "proprietário", "locacao", "locação", "imoveis", "imóveis", "matinhos"],
            "condominio": ["condominio", "condomínio", "administradora"],
            "gas": ["gas", "gás", "ultragaz", "liquigas", "copagaz", "supergasbras", "nacional gas"],
            "claro": ["claro"],
            "tim": ["tim"],
            "vivo": ["vivo"]
        }

        def bill_name_match(bill_n: str, target_n: str) -> bool:
            b = bill_n.lower().strip()
            t = target_n.lower().strip()
            if not b or not t:
                return False
            # Correspondência exata direta
            if b == t:
                return True
            # Verificação com limites de palavras para evitar falso positivo em palavras curtas
            if len(b) >= 3 and re.search(rf"\b{re.escape(b)}\b", t, re.I):
                return True
            if len(t) >= 4 and re.search(rf"\b{re.escape(t)}\b", b, re.I):
                return True
            # Aliases por concessionária / serviço com limites de palavras
            for key, words in BILL_ALIASES.items():
                if re.search(rf"\b{re.escape(key)}\b", b, re.I):
                    if any(re.search(rf"\b{re.escape(w)}\b", t, re.I) for w in words):
                        return True
            return False

        matched_pending = None
        matched_pending_cat = None
        clean_target = name.lower().strip()

        # 1. Match por nome e valor compatível (nunca dar baixa sem correspondência de nome!)
        for c in month.categories:
            if c.id == "gastos":
                continue
            for it in c.items:
                if not it.paid:
                    if bill_name_match(it.name, clean_target):
                        # Se o nome bateu, confere se o valor é plausível (tolerância para contas que variam como luz/água)
                        if amount == 0.0 or it.amount == 0.0 or abs(it.amount - amount) <= 100.0 or (it.amount > 0 and abs(it.amount - amount) / it.amount <= 0.4):
                            matched_pending = it
                            matched_pending_cat = c
                            break
            if matched_pending:
                break

        # 1b. Anti-duplicação: Se a conta já estava quitada e o e-mail for uma confirmação da mesma conta
        if not matched_pending:
            for c in month.categories:
                if c.id == "gastos":
                    continue
                for it in c.items:
                    if it.paid and bill_name_match(it.name, clean_target):
                        if amount == 0.0 or it.amount == 0.0 or abs(it.amount - amount) <= 100.0:
                            speech = (
                                f"A conta planejada '{it.name}' de R$ {it.amount:,.2f} já está marcada como quitada na categoria {c.name}. "
                                f"Nenhuma despesa duplicada foi gerada em Gastos."
                            )
                            return {
                                "success": True,
                                "action": "pay",
                                "reconciled": True,
                                "message": speech,
                                "speech_text": speech,
                                "category": c.id,
                                "item": it.model_dump(),
                                "summary": month.summary.model_dump()
                            }

        if matched_pending:
            # Baixa automática na conta planejada!
            matched_pending.paid = True
            if notes and not matched_pending.notes:
                matched_pending.notes = notes
            updated = numbers_manager.update_month(month.id, month)
            try:
                numbers_manager.write_numbers_file(updated)
            except Exception:
                pass
            
            speech = (
                f"Conta planejada '{matched_pending.name}' de R$ {matched_pending.amount:,.2f} "
                f"identificada e baixada com sucesso na categoria {matched_pending_cat.name}! "
                f"Saldo restante no mês: R$ {updated.summary.balance:,.2f}."
            )
            action_history.record(
                action_type="reconciled",
                title=matched_pending.name,
                amount=matched_pending.amount,
                category=matched_pending_cat.name,
                source="gmail" if notes and "Nubank" in notes else "gemini",
                status="Baixa automática"
            )
            return {
                "success": True,
                "action": "pay",
                "reconciled": True,
                "message": speech,
                "speech_text": speech,
                "category": matched_pending_cat.id,
                "item": matched_pending.model_dump(),
                "summary": updated.summary.model_dump()
            }

        cat_key = (category or "gastos").lower().strip()
        target_cat = None
        for c in month.categories:
            if c.id.lower() == cat_key or c.name.lower() == cat_key:
                target_cat = c
                break
        
        if not target_cat:
            for c in month.categories:
                if c.id == "gastos":
                    target_cat = c
                    break
            if not target_cat:
                target_cat = ExpenseCategory(id="gastos", name="Gastos", items=[])
                month.categories.append(target_cat)

        # Anti-duplicação na categoria: Se já existir um gasto idêntico (mesmo nome e mesmo valor)
        for it in target_cat.items:
            if it.name.lower().strip() == name.lower().strip() and abs(it.amount - round(float(amount), 2)) < 0.01:
                speech = (
                    f"O gasto '{it.name}' de R$ {it.amount:,.2f} já estava registrado na categoria {target_cat.name}. "
                    f"Nenhuma despesa duplicada foi gerada."
                )
                return {
                    "success": True,
                    "action": "create",
                    "duplicate": True,
                    "message": speech,
                    "speech_text": speech,
                    "category": target_cat.id,
                    "item": it.model_dump(),
                    "summary": month.summary.model_dump()
                }

        if target_cat.id == "gastos":
            is_rec = False
            item_paid = True
        else:
            is_rec = True
            item_paid = bool(paid) if paid is not None else False

        new_item = ExpenseItem(
            id=f"exp_{target_cat.id}_{int(datetime.now().timestamp()*1000)}",
            name=name.strip(),
            amount=round(float(amount), 2),
            paid=item_paid,
            due_day=due_day or datetime.now().strftime("%Y-%m-%d"),
            notes=notes,
            is_recurring=is_rec
        )
        target_cat.items.insert(0, new_item)
        updated = numbers_manager.update_month(month.id, month)
        try:
            numbers_manager.write_numbers_file(updated)
        except Exception:
            pass

        speech = (
            f"Gasto '{new_item.name}' de R$ {new_item.amount:,.2f} cadastrado e quitado com sucesso "
            f"na categoria {target_cat.name}! Saldo restante no mês: R$ {updated.summary.balance:,.2f}."
        )
        action_history.record(
            action_type="create",
            title=new_item.name,
            amount=new_item.amount,
            category=target_cat.name,
            source="gmail" if notes and "Nubank" in notes else "gemini",
            status="Quitado" if item_paid else "Pendente"
        )
        return {
            "success": True,
            "action": "create",
            "message": speech,
            "speech_text": speech,
            "category": target_cat.id,
            "item": new_item.model_dump(),
            "summary": updated.summary.model_dump()
        }

@app.post("/api/gemini/action")
def gemini_action_post(payload: GeminiActionPayload):
    return execute_gemini_action(payload)

@app.post("/api/gemini/email")
async def gemini_email_post(request: Request):
    body_bytes = await request.body()
    raw_text = body_bytes.decode("utf-8", errors="ignore")
    clean = clean_email_html(raw_text)
    print(f"[Email Received] Raw preview: {raw_text[:180]!r} | Cleaned: {clean[:120]!r}")
    payload = GeminiActionPayload(command=clean)
    result = execute_gemini_action(payload)
    print(f"[Email Processed] Action: {result.get('action')} | Success: {result.get('success')} | Message: {result.get('message')}")
    return result

@app.get("/api/gemini/action")
def gemini_action_get(
    cmd: Optional[str] = Query(None, description="Comando em linguagem natural"),
    action: Optional[str] = None,
    category: Optional[str] = None,
    name: Optional[str] = None,
    amount: Optional[float] = None,
    paid: Optional[bool] = None,
    month_id: Optional[str] = None
):
    payload = GeminiActionPayload(
        command=cmd,
        action=action,
        category=category,
        name=name,
        amount=amount,
        paid=paid,
        month_id=month_id
    )
    return execute_gemini_action(payload)

@app.get("/api/gmail-watcher/status")
def get_gmail_watcher_status():
    return {
        "running": gmail_watcher._running,
        "user": gmail_watcher.user,
        "interval_seconds": gmail_watcher.check_interval,
        "last_check": gmail_watcher.last_check.isoformat() if gmail_watcher.last_check else None,
        "last_status": gmail_watcher.last_status,
        "processed_count": gmail_watcher.processed_count
    }

@app.post("/api/gmail-watcher/check-now")
def trigger_gmail_watcher_check():
    results = gmail_watcher.check_new_emails()
    return {
        "success": True,
        "processed_count": len(results),
        "results": results
    }

@app.get("/api/recent-actions")
def get_recent_actions(limit: int = 10, month_id: Optional[str] = None):
    try:
        month_data = numbers_manager.get_month(month_id or "2026-10")
    except Exception:
        month_data = None
    return {
        "success": True,
        "actions": action_history.get_recent(limit=limit, month_data=month_data)
    }

@app.get("/api/gemini/briefing")
def gemini_briefing(month_id: Optional[str] = None):
    payload = GeminiActionPayload(action="read", month_id=month_id)
    return execute_gemini_action(payload)

@app.get("/api/gemini/tools")
def gemini_tools():
    return {
        "tools": [
            {
                "name": "create_expense",
                "description": "Cria um novo gasto na planilha Numbers em qualquer categoria (Gastos, Casa, Pessoal, Credito).",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string", "description": "Nome ou descrição da conta/gasto"},
                        "amount": {"type": "number", "description": "Valor em reais"},
                        "category": {"type": "string", "enum": ["gastos", "casa", "pessoal", "credito"], "description": "Categoria da despesa"},
                        "due_day": {"type": "string", "description": "Dia do vencimento ou data (ex: 2026-10-10)"},
                        "paid": {"type": "boolean", "description": "Se a conta já está paga"}
                    },
                    "required": ["name", "amount"]
                }
            },
            {
                "name": "read_finances",
                "description": "Lê o resumo financeiro atual, receitas, despesas, saldo e contas pendentes.",
                "parameters": {"type": "object", "properties": {}}
            },
            {
                "name": "pay_expense",
                "description": "Marca uma conta existente como paga ou pendente.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string", "description": "Nome da conta a dar baixa"},
                        "paid": {"type": "boolean", "description": "True para paga, False para pendente"}
                    },
                    "required": ["name"]
                }
            }
        ]
    }

@app.get("/api/gemini/openapi.json")
def get_gemini_openapi_json():
    local_ip = get_local_ip()
    return {
        "openapi": "3.0.1",
        "info": {
            "title": "Gestão Financeira Numbers API (Gemini Spark / Gems)",
            "description": "API personalizada para o Gemini gerenciar e consultar suas planilhas Numbers no Google Drive.",
            "version": "1.0.0"
        },
        "servers": [
            {"url": f"http://{local_ip}:8000", "description": "Servidor Local Wi-Fi"}
        ],
        "paths": {
            "/api/gemini/action": {
                "post": {
                    "summary": "Executa uma ação financeira ou comando em linguagem natural",
                    "operationId": "executeAction",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "command": {
                                            "type": "string",
                                            "description": "Comando em texto livre (ex: 'Almoço 45 em Gastos', 'Pagar luz', 'Quanto gastei?')"
                                        },
                                        "action": {
                                            "type": "string",
                                            "enum": ["create", "read", "pay", "delete"],
                                            "description": "Tipo de ação"
                                        },
                                        "category": {
                                            "type": "string",
                                            "enum": ["gastos", "casa", "pessoal", "credito"],
                                            "description": "Categoria da despesa"
                                        },
                                        "name": {
                                            "type": "string",
                                            "description": "Nome da conta ou gasto"
                                        },
                                        "amount": {
                                            "type": "number",
                                            "description": "Valor em reais"
                                        },
                                        "paid": {
                                            "type": "boolean",
                                            "description": "Se já está paga"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Resultado da ação",
                            "content": {"application/json": {"schema": {"type": "object"}}}
                        }
                    }
                },
                "get": {
                    "summary": "Executa comando rápido via GET (ideal para atalhos)",
                    "operationId": "executeCommandGet",
                    "parameters": [
                        {
                            "name": "cmd",
                            "in": "query",
                            "required": True,
                            "schema": {"type": "string"},
                            "description": "Comando falado ou digitado em português"
                        }
                    ],
                    "responses": {
                        "200": {"description": "Resultado"}
                    }
                }
            },
            "/api/gemini/briefing": {
                "get": {
                    "summary": "Resumo financeiro falado",
                    "operationId": "getFinancialBriefing",
                    "responses": {
                        "200": {"description": "Briefing com status atual"}
                    }
                }
            }
        }
    }

@app.get("/api/gemini/openapi.yaml")
def get_gemini_openapi_yaml():
    import json
    data = get_gemini_openapi_json()
    # Basic clean YAML format for Gemini
    yaml_lines = [
        "openapi: 3.0.1",
        "info:",
        "  title: Gestão Financeira Numbers API (Gemini)",
        "  description: API personalizada para o Gemini gerenciar e consultar suas planilhas Numbers no Google Drive.",
        "  version: 1.0.0",
        "servers:",
        f"  - url: http://{get_local_ip()}:8000",
        "paths:",
        "  /api/gemini/action:",
        "    post:",
        "      summary: Executa comando financeiro inteligente",
        "      operationId: executeAction",
        "      requestBody:",
        "        required: true",
        "        content:",
        "          application/json:",
        "            schema:",
        "              type: object",
        "              properties:",
        "                command:",
        "                  type: string",
        "                  description: Comando em linguagem natural (ex 'Almoço 45 em Gastos', 'Pagar luz', 'Quanto gastei?')",
        "                category:",
        "                  type: string",
        "                  enum: [gastos, casa, pessoal, credito]",
        "                name:",
        "                  type: string",
        "                amount:",
        "                  type: number",
        "      responses:",
        "        '200':",
        "          description: Resposta com mensagem e confirmação",
        "    get:",
        "      summary: Executa comando via GET",
        "      operationId: executeCommandGet",
        "      parameters:",
        "        - name: cmd",
        "          in: query",
        "          required: true",
        "          schema:",
        "            type: string",
        "      responses:",
        "        '200':",
        "          description: Sucesso",
        "  /api/gemini/briefing:",
        "    get:",
        "      summary: Resumo financeiro falado",
        "      operationId: getBriefing",
        "      responses:",
        "        '200':",
        "          description: Briefing atual"
    ]
    return Response(content="\n".join(yaml_lines), media_type="text/yaml")

@app.get("/api/gemini/gem-instructions")
def get_gem_instructions():
    return {
        "title": "Instruções do Sistema para o Custom Gem / App do Gemini",
        "system_instruction": (
            "Você é o assistente financeiro pessoal oficial integrado às planilhas Numbers do Google Drive. "
            "Sua função é permitir que o usuário consulte despesas, adicione novos gastos em qualquer categoria "
            "(Gastos, Casa, Pessoal, Crédito) e marque contas como pagas.\n\n"
            "Diretrizes:\n"
            "1. Sempre que o usuário mencionar um gasto do dia a dia não previsto (ex: almoço, farmácia, lanche, compras avulsas), "
            "lance diretamente na categoria 'gastos'.\n"
            "2. Se o usuário especificar uma categoria (ex: 'Casa', 'Pessoal', 'Crédito'), lance na categoria solicitada.\n"
            "3. Quando o usuário disser que pagou algo (ex: 'quitei a luz', 'paguei o aluguel'), chame a ação de pagamento para dar baixa.\n"
            "4. Quando o usuário perguntar quanto gastou ou pedir o resumo, use a ação de briefing/leitura e responda de forma clara, "
            "objetiva e amigável em português com os valores em Reais (R$).\n"
            "5. Confirme sempre a operação realizada, informando o nome do gasto, valor e o saldo restante no mês."
        )
    }


# Serve frontend build if dist folder exists
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host="0.0.0.0", port=8000, reload=True)
