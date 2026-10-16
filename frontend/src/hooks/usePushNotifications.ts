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

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [subscriptionCount, setSubscriptionCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (!supported) return;

    setPermission(Notification.permission);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);

      // Atualiza também contagem do backend
      fetchPushStatus().then((res) => {
        setSubscriptionCount(res.subscriptions_count);
      }).catch(() => {});
    } catch (err) {
      console.warn('[Push] Erro ao verificar inscrição:', err);
    }
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const subscribe = async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Notificações Push não são suportadas neste navegador.');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Solicita permissão do usuário
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        setError('Permissão para notificações não foi concedida.');
        setLoading(false);
        return false;
      }

      // 2. Garante Service Worker pronto
      const reg = await navigator.serviceWorker.ready;

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
        'Notificação de teste! Suas compras e faturas chegarão instantaneamente aqui.'
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
