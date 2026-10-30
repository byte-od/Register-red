import os
import re
import json
import time
import email
import email.message
from email.message import Message
import imaplib
import logging
import threading
from email.header import decode_header
from datetime import datetime
from typing import Dict, Any, Optional, Set, List

logger = logging.getLogger("gmail_watcher")
if not logger.handlers:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [gmail_watcher] %(message)s")

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
ENV_PATH = os.path.join(BASE_DIR, ".env")
PROCESSED_FILE = os.path.join(BASE_DIR, "data", "processed_email_ids.json")

def load_env_file(path: str = ENV_PATH):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip().strip("'\"")
                    os.environ[k] = v

load_env_file()

def decode_mime_words(s: str) -> str:
    if not s:
        return ""
    try:
        decoded_fragments = decode_header(s)
        res = []
        for frag, enc in decoded_fragments:
            if isinstance(frag, bytes):
                res.append(frag.decode(enc or "utf-8", errors="ignore"))
            else:
                res.append(str(frag))
        return " ".join(res).strip()
    except Exception:
        return str(s)

def extract_email_body(msg: email.message.Message) -> str:
    body = ""
    if msg.is_multipart():
        plain_body = None
        html_body = None
        for part in msg.walk():
            ctype = part.get_content_type()
            if ctype == "text/plain" and not plain_body:
                pl = part.get_payload(decode=True)
                if pl:
                    plain_body = pl.decode(errors="ignore")
            elif ctype == "text/html" and not html_body:
                pl = part.get_payload(decode=True)
                if pl:
                    html_body = pl.decode(errors="ignore")
        body = plain_body or html_body or ""
    else:
        pl = msg.get_payload(decode=True)
        if pl:
            body = pl.decode(errors="ignore")
    return body

def is_financial_email(sender: str, subject: str) -> bool:
    s_low = sender.lower()
    sub_low = subject.lower()

    # Filtrar exclusivamente instituições financeiras autorizadas (Nubank e InfinitePay)
    is_valid_bank = any(b in s_low for b in [
        "@nubank.com.br", "nubank.com.br",
        "@infinitepay.io", "infinitepay.io"
    ])
    if not is_valid_bank:
        return False

    # Ignora avisos administrativos, falhas de cobrança, faturas a vencer, ou códigos de segurança
    ignore_keywords = [
        "lembrete", "aviso de fatura", "sua fatura fechou", "segurança", 
        "código de acesso", "codigo", "atrasado", "sua compra chegou", "finalize a sua compra",
        "falha no pagamento", "falha", "não conseguimos efetuar", "nao conseguimos efetuar",
        "pagamento não foi processado", "pagamento nao foi processado", "recusado", "cancelado",
        "segunda via", "novo boleto", "desconto especial", "novidade", "limite", "empréstimo", "emprestimo",
        "funções novas", "respostas pro seu", "sacolinha", "cobranças de outubro", "confira como ficam",
        "divulgação", "reputação"
    ]
    if any(ign in sub_low for ign in ignore_keywords):
        return False

    # Padrões obrigatórios de confirmação no assunto
    confirm_patterns = [
        "transferência realizada", "transferencia realizada",
        "transferência enviada", "transferencia enviada",
        "transferência recebida", "transferencia recebida",
        "você recebeu uma transferência", "voce recebeu uma transferencia",
        "você recebeu um pix", "voce recebeu um pix",
        "pix enviado", "pix realizado", "pix recebido", "pix automático", "pix automatico",
        "compra aprovada", "compra no débito", "compra no debito", "compra no crédito", "compra no credito",
        "pagamento realizado", "pagamento de boleto", "pagamento da conta realizado", "pagamento da conta aprovado", "pagamento aprovado", "pagamento confirmado",
        "comprovante de transferência", "comprovante de transferencia",
        "comprovante de pagamento", "comprovante pix", "comprovante de pix",
        "boleto pago", "boleto liquidado", "fatura paga",
        "venda aprovada", "venda realizada", "venda concluída", "venda concluida",
        "você vendeu", "voce vendeu", "pagamento recebido"
    ]
    if any(p in sub_low for p in confirm_patterns):
        return True

    return any(k in sub_low for k in ["transferência", "transferencia", "pix", "compra", "pagamento", "comprovante", "boleto", "venda"])

class GmailWatcher:
    def __init__(self):
        self.accounts = self._load_accounts()
        self.user = ", ".join([a["user"] for a in self.accounts]) if self.accounts else ""
        self.check_interval = int(os.environ.get("GMAIL_CHECK_INTERVAL_SECONDS", "15"))
        self.processed_ids: Set[str] = set()
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self.last_check: Optional[datetime] = None
        self.last_status: str = "Inativo"
        self.processed_count: int = 0
        self.load_processed_ids()

    def _load_accounts(self) -> List[Dict[str, str]]:
        load_env_file()
        accounts = []
        u1 = os.environ.get("GMAIL_USER", "reisfilho1116@gmail.com").strip()
        p1 = os.environ.get("GMAIL_APP_PASSWORD", "").replace(" ", "").strip()
        if u1 and p1:
            accounts.append({"user": u1, "password": p1, "owner": "Julio"})

        u2 = os.environ.get("GMAIL_USER_2", "").strip()
        p2 = os.environ.get("GMAIL_APP_PASSWORD_2", "").replace(" ", "").strip()
        if u2 and p2:
            accounts.append({"user": u2, "password": p2, "owner": "Camilla"})

        for i in range(3, 10):
            ui = os.environ.get(f"GMAIL_USER_{i}", "").strip()
            pi = os.environ.get(f"GMAIL_APP_PASSWORD_{i}", "").replace(" ", "").strip()
            if ui and pi:
                accounts.append({"user": ui, "password": pi, "owner": f"Conta {i}"})

        return accounts

    def load_processed_ids(self):
        os.makedirs(os.path.dirname(PROCESSED_FILE), exist_ok=True)
        if os.path.exists(PROCESSED_FILE):
            try:
                with open(PROCESSED_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.processed_ids = set(data)
            except Exception as e:
                logger.warning(f"Erro ao carregar processed_ids: {e}")
                self.processed_ids = set()

    def save_processed_ids(self):
        try:
            with open(PROCESSED_FILE, "w", encoding="utf-8") as f:
                json.dump(list(self.processed_ids), f, indent=2)
        except Exception as e:
            logger.error(f"Erro ao salvar processed_ids: {e}")

    def check_new_emails(self) -> List[Dict[str, Any]]:
        self.accounts = self._load_accounts()
        self.user = ", ".join([a["user"] for a in self.accounts]) if self.accounts else ""
        if not self.accounts:
            self.last_status = "Nenhuma credencial configurada no .env"
            return []

        try:
            # Lazy import to avoid circular dependency
            try:
                from backend.app import clean_email_html, execute_gemini_action, GeminiActionPayload
            except ImportError:
                from app import clean_email_html, execute_gemini_action, GeminiActionPayload
        except Exception as e:
            logger.error(f"Erro ao importar dependências do app: {e}")
            return []

        all_results = []
        search_domains = ["nubank.com.br", "infinitepay.io"]
        connected_owners = []
        errors = []

        for acc in self.accounts:
            user = acc["user"]
            password = acc["password"]
            owner = acc["owner"]
            mail = None
            try:
                mail = imaplib.IMAP4_SSL("imap.gmail.com", 993, timeout=30)
                mail.login(user, password)
                mail.select("INBOX")
                connected_owners.append(owner)

                for s_domain in search_domains:
                    status, data = mail.search(None, 'UNSEEN', 'FROM', f'"{s_domain}"')
                    if status != "OK" or not data or not data[0]:
                        continue

                    email_ids = data[0].split()
                    for eid in email_ids:
                        try:
                            res, hdata = mail.fetch(eid, "(BODY.PEEK[HEADER.FIELDS (MESSAGE-ID SUBJECT FROM DATE)])")
                            if res != "OK" or not hdata or not hdata[0] or not isinstance(hdata[0], tuple):
                                continue

                            h_msg = email.message_from_bytes(hdata[0][1])
                            msg_id = (h_msg.get("Message-ID") or "").strip()
                            subject = decode_mime_words(h_msg.get("Subject", ""))
                            sender = decode_mime_words(h_msg.get("From", ""))

                            id_key = f"{user}:{msg_id}" if msg_id else f"{user}:mid_{eid.decode()}"
                            if id_key in self.processed_ids:
                                mail.store(eid, "+FLAGS", "\\Seen")
                                continue

                            if not is_financial_email(sender, subject):
                                # Marca como lido avisos de marketing e registra ID
                                mail.store(eid, "+FLAGS", "\\Seen")
                                self.processed_ids.add(id_key)
                                continue

                            logger.info(f"[{owner}] Processando e-mail financeiro: [{subject}] de [{sender}]")

                            res, bdata = mail.fetch(eid, "(RFC822)")
                            if res != "OK" or not bdata or not bdata[0] or not isinstance(bdata[0], tuple):
                                continue

                            full_msg = email.message_from_bytes(bdata[0][1])
                            body_text = extract_email_body(full_msg)
                            if not body_text:
                                continue

                            cleaned = clean_email_html(body_text)
                            full_cmd = f"{subject}. {cleaned}" if subject else cleaned

                            acc_note = f"Auto ({owner})" if owner != "Julio" else "Nubank Auto"
                            payload = GeminiActionPayload(command=full_cmd, notes=acc_note)
                            action_res = execute_gemini_action(payload)

                            mail.store(eid, "+FLAGS", "\\Seen")
                            self.processed_ids.add(id_key)
                            self.save_processed_ids()
                            self.processed_count += 1

                            if action_res.get("success"):
                                logger.info(f"[{owner}] Ação concluída com sucesso: {action_res.get('message')}")
                            else:
                                logger.warning(f"[{owner}] Ação não executada ou comando ignorado: {action_res.get('message')}")

                            all_results.append({
                                "account": user,
                                "owner": owner,
                                "subject": subject,
                                "sender": sender,
                                "result": action_res
                            })
                        except Exception as inner_e:
                            logger.error(f"[{owner}] Erro ao processar e-mail {eid}: {inner_e}")

                mail.logout()

            except Exception as e:
                err_msg = str(e)
                logger.warning(f"Falha ao conectar no Gmail IMAP ({user}): {err_msg}")
                if "AUTHENTICATIONFAILED" in err_msg:
                    errors.append(f"Senha de app inválida para {user}")
                else:
                    errors.append(f"Erro em {user}: {err_msg[:40]}")
                if mail:
                    try:
                        mail.logout()
                    except Exception:
                        pass

        self.last_check = datetime.now()
        status_parts = []
        if connected_owners:
            status_parts.append(f"Conectado ({', '.join(connected_owners)})")
        if errors:
            status_parts.append(f"Atenção: {', '.join(errors)}")
        self.last_status = " | ".join(status_parts) if status_parts else "Nenhuma conta conectada"
        return all_results

    def _loop(self):
        logger.info(f"[GmailWatcher] Loop 24h ativado. Verificando a cada {self.check_interval}s...")
        while self._running:
            try:
                self.check_new_emails()
            except Exception as e:
                logger.error(f"[GmailWatcher] Exceção no loop: {e}")
            time.sleep(self.check_interval)

    def start_background(self):
        if self._thread and self._thread.is_alive():
            return
        self._running = True
        self._thread = threading.Thread(target=self._loop, name="GmailWatcherThread", daemon=True)
        self._thread.start()
        logger.info("[GmailWatcher] Thread de monitoramento 24h iniciada.")

    def stop(self):
        self._running = False
        if self._thread:
            self._thread.join(timeout=5)
        logger.info("[GmailWatcher] Monitoramento parado.")

gmail_watcher = GmailWatcher()

if __name__ == "__main__":
    print("Iniciando verificação manual de e-mails...")
    watcher = GmailWatcher()
    res = watcher.check_new_emails()
    print("Resultado:", res)
