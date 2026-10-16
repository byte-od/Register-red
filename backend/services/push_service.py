import os
import json
import base64
import logging
import threading
from typing import Dict, Any, List, Optional
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat, PrivateFormat, NoEncryption
from py_vapid import Vapid
from pywebpush import webpush, WebPushException

logger = logging.getLogger("push_service")
if not logger.handlers:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [push_service] %(message)s")

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
VAPID_FILE = os.path.join(BASE_DIR, "data", "vapid_keys.json")
SUBS_FILE = os.path.join(BASE_DIR, "data", "push_subscriptions.json")

class PushService:
    def __init__(self):
        self.vapid_email = os.environ.get("VAPID_CLAIM_EMAIL", "mailto:reisfilho1116@gmail.com")
        self.public_key: str = ""
        self.private_key_pem: str = ""
        self.vapid_instance = None
        self._load_or_create_vapid_keys()
        self.subscriptions: List[Dict[str, Any]] = self._load_subscriptions()

    def _load_or_create_vapid_keys(self):
        os.makedirs(os.path.dirname(VAPID_FILE), exist_ok=True)
        if os.path.exists(VAPID_FILE):
            try:
                with open(VAPID_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.public_key = data.get("public_key", "")
                    self.private_key_pem = data.get("private_key", "")
            except Exception as e:
                logger.warning(f"Erro ao carregar vapid_keys.json: {e}")

        if not self.public_key or not self.private_key_pem:
            logger.info("Gerando novo par de chaves VAPID para Web Push...")
            v = Vapid()
            v.generate_keys()
            raw_pub = v.public_key.public_bytes(
                encoding=Encoding.X962,
                format=PublicFormat.UncompressedPoint
            )
            self.public_key = base64.urlsafe_b64encode(raw_pub).rstrip(b"=").decode("utf-8")
            self.private_key_pem = v.private_key.private_bytes(
                encoding=Encoding.PEM,
                format=PrivateFormat.PKCS8,
                encryption_algorithm=NoEncryption()
            ).decode("utf-8")

            try:
                with open(VAPID_FILE, "w", encoding="utf-8") as f:
                    json.dump({
                        "public_key": self.public_key,
                        "private_key": self.private_key_pem
                    }, f, indent=2)
                logger.info("Chaves VAPID geradas e salvas com sucesso.")
            except Exception as e:
                logger.error(f"Erro ao salvar vapid_keys.json: {e}")

        if self.private_key_pem:
            try:
                self.vapid_instance = Vapid.from_pem(self.private_key_pem.encode("utf-8"))
            except Exception as e:
                logger.error(f"Erro ao instanciar Vapid: {e}")

    def _load_subscriptions(self) -> List[Dict[str, Any]]:
        os.makedirs(os.path.dirname(SUBS_FILE), exist_ok=True)
        if os.path.exists(SUBS_FILE):
            try:
                with open(SUBS_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Erro ao carregar push_subscriptions.json: {e}")
        return []

    def _save_subscriptions(self):
        try:
            with open(SUBS_FILE, "w", encoding="utf-8") as f:
                json.dump(self.subscriptions, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Erro ao salvar push_subscriptions.json: {e}")

    def add_subscription(self, sub_data: Dict[str, Any], user_agent: Optional[str] = None) -> bool:
        endpoint = sub_data.get("endpoint")
        if not endpoint:
            return False

        # Remove se já existia para atualizar dados
        self.subscriptions = [s for s in self.subscriptions if s.get("endpoint") != endpoint]
        
        entry = {
            "subscription": sub_data,
            "endpoint": endpoint,
            "user_agent": user_agent,
            "created_at": __import__("datetime").datetime.now().isoformat()
        }
        self.subscriptions.append(entry)
        self._save_subscriptions()
        logger.info(f"Nova inscrição Web Push cadastrada! Total de dispositivos: {len(self.subscriptions)}")
        return True

    def remove_subscription(self, endpoint: str):
        prev_len = len(self.subscriptions)
        self.subscriptions = [s for s in self.subscriptions if s.get("endpoint") != endpoint]
        if len(self.subscriptions) != prev_len:
            self._save_subscriptions()
            logger.info(f"Inscrição removida: {endpoint}")

    def send_push_to_all(self, title: str, body: str, url: str = "/", tag: Optional[str] = None):
        if not self.subscriptions:
            logger.info("Nenhum dispositivo cadastrado para envio de push notification.")
            return

        payload = json.dumps({
            "title": title,
            "body": body,
            "url": url,
            "tag": tag or f"notif_{int(__import__('time').time())}",
            "icon": "/icon-192.png",
            "badge": "/icon-192.png"
        })

        def _worker():
            stale_endpoints = []
            for item in list(self.subscriptions):
                sub_info = item.get("subscription")
                endpoint = item.get("endpoint")
                if not sub_info:
                    continue

                try:
                    # Chave privada temporária para a biblioteca pywebpush
                    # Salva chave PEM em arquivo se necessário ou passa DER
                    webpush(
                        subscription_info=sub_info,
                        data=payload,
                        vapid_private_key=self.vapid_instance,
                        vapid_claims={"sub": self.vapid_email}
                    )
                    logger.info(f"Notificação enviada com sucesso para endpoint: {endpoint[:45]}...")
                except WebPushException as ex:
                    logger.warning(f"Falha ao enviar push para {endpoint[:45]}: {ex}")
                    # Se o endpoint expirou (404 ou 410), marca para remover
                    if ex.response is not None and ex.response.status_code in [404, 410]:
                        stale_endpoints.append(endpoint)
                except Exception as ex:
                    logger.error(f"Erro inesperado no envio de push: {ex}")

            if stale_endpoints:
                for ep in stale_endpoints:
                    self.remove_subscription(ep)

        threading.Thread(target=_worker, daemon=True).start()

push_service = PushService()
