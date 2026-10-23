import { useState, useEffect, useCallback } from 'react';
import { fetchVapidPublicKey, subscribePush, unsubscribePush, testPushNotification, fetchPushStatus } from '../api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export interface PushDiagnostics {
  isSecureContext: boolean;
  hasServiceWorker: boolean;
  hasPushManager: boolean;
  hasNotification: boolean;
  isIos: boolean;
  isStandalone: boolean;
  unsupportedReason: string | null;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [diagnostics, setDiagnostics] = useState<PushDiagnostics>({
    isSecureContext: true,
    hasServiceWorker: true,
    hasPushManager: true,
    hasNotification: true,
    isIos: false,
    isStandalone: false,
    unsupportedReason: null,
  });
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [subscriptionCount, setSubscriptionCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const isSecure = window.isSecureContext ?? false;
    const hasSW = 'serviceWorker' in navigator;
    const hasPM = 'PushManager' in window;
    const hasNotif = 'Notification' in window;
    const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    let reason: string | null = null;
    if (!isSecure) {
      reason = 'Conexão insegura (HTTP detectado). O iOS e Android bloqueiam notificações push fora do HTTPS.';
    } else if (isIos && !isStandalone) {
      reason = 'No iOS (iPhone/iPad), o app precisa ser adicionado à Tela de Início para habilitar notificações push.';
    } else if (!hasNotif || !hasPM) {
      reason = 'Navegador atual não possui suporte à API de Notificações Push.';
    }

    const supported = isSecure && hasSW && hasPM && hasNotif;
    setIsSupported(supported);
    setDiagnostics({
      isSecureContext: isSecure,
      hasServiceWorker: hasSW,
      hasPushManager: hasPM,
      hasNotification: hasNotif,
      isIos,
      isStandalone,
      unsupportedReason: reason,
    });

    if (hasNotif) {
      setPermission(Notification.permission);
    }

    if (supported) {
      try {
        // Tenta registrar explicitamente se ainda não registrou
        navigator.serviceWorker.register('/sw.js').catch(() => {});
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      } catch (err) {
        console.warn('[Push] Erro ao checar subscrição:', err);
      }
    }

    // Busca contagem do backend
    fetchPushStatus()
      .then((res) => setSubscriptionCount(res.subscriptions_count))
      .catch(() => {});
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const subscribe = async (): Promise<boolean> => {
    if (!diagnostics.isSecureContext) {
      setError('Notificações exigem conexão segura (HTTPS). Acesse pelo domínio seguro da rede.');
      return false;
    }

    if (diagnostics.isIos && !diagnostics.isStandalone) {
      setError('No iPhone, toque em Compartilhar e escolha "Adicionar à Tela de Início". Abra pelo app instalado!');
      return false;
    }

    if (!('Notification' in window)) {
      setError('Este navegador não suporta notificações.');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Solicita permissão do usuário
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        setError('Permissão para notificações não foi concedida no aparelho.');
        setLoading(false);
        return false;
      }

      // 2. Garante Service Worker registrado e pronto com timeout de segurança
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.register('/sw.js');
      }

      const readyPromise = navigator.serviceWorker.ready;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Tempo esgotado aguardando o Service Worker.')), 8000)
      );
      const reg = (await Promise.race([readyPromise, timeoutPromise])) as ServiceWorkerRegistration;

      if (!reg || !reg.pushManager) {
        throw new Error('PushManager indisponível no Service Worker.');
      }

      // 3. Busca a chave pública VAPID do backend
      const vapidPublicKey = await fetchVapidPublicKey();
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      // 4. Inscreve o navegador no PushManager
      const existingSub = await reg.pushManager.getSubscription();
      let sub = existingSub;
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as any,
        });
      }

      // 5. Envia os dados para a API registrar o dispositivo
      const res = await subscribePush(sub.toJSON());
      setIsSubscribed(true);
      setSubscriptionCount(res.subscriptions_count);
      setLoading(false);
      return true;
    } catch (err: any) {
      console.error('[Push] Erro ao inscrever:', err);
      setError(err?.message || 'Falha ao ativar notificações push.');
      setLoading(false);
      return false;
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await unsubscribePush(endpoint);
      }
      setIsSubscribed(false);
      const status = await fetchPushStatus();
      setSubscriptionCount(status.subscriptions_count);
      setLoading(false);
      return true;
    } catch (err: any) {
      console.error('[Push] Erro ao desinscrever:', err);
      setError(err?.message || 'Falha ao desativar notificações.');
      setLoading(false);
      return false;
    }
  };

  const sendTest = async (): Promise<{ success: boolean; message: string }> => {
    setLoading(true);
    setError(null);
    try {
      const res = await testPushNotification(
        'Register Red 🔔',
        'Notificação de teste recebida com sucesso! Suas compras chegarão instantaneamente aqui.'
      );
      setLoading(false);
      return { success: true, message: res.message };
    } catch (err: any) {
      console.error('[Push] Erro ao disparar teste:', err);
      setError(err?.message || 'Erro ao disparar notificação.');
      setLoading(false);
      return { success: false, message: err?.message || 'Falha no envio.' };
    }
  };

  return {
    isSupported,
    diagnostics,
    permission,
    isSubscribed,
    subscriptionCount,
    loading,
    error,
    subscribe,
    unsubscribe,
    sendTest,
    checkSubscription,
  };
}
