import React, { useState } from 'react';
import { 
  X, Bell, BellRing, BellOff, CheckCircle2, AlertTriangle, 
  Smartphone, ShieldCheck, Zap, Info, Loader2, RefreshCw
} from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  onToast,
}) => {
  const {
    isSupported,
    permission,
    isSubscribed,
    subscriptionCount,
    loading,
    error,
    subscribe,
    unsubscribe,
    sendTest,
  } = usePushNotifications();

  const [testSent, setTestSent] = useState(false);

  if (!isOpen) return null;

  const isIos = typeof window !== 'undefined' && /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );

  const handleSubscribe = async () => {
    const ok = await subscribe();
    if (ok) {
      onToast('Notificações push ativadas com sucesso neste dispositivo!', 'success');
    } else if (error) {
      onToast(error, 'error');
    }
  };

  const handleUnsubscribe = async () => {
    const ok = await unsubscribe();
    if (ok) {
      onToast('Inscrição cancelada com sucesso.', 'info');
    }
  };

  const handleTest = async () => {
    setTestSent(false);
    const res = await sendTest();
    if (res.success) {
      setTestSent(true);
      onToast('Notificação de teste disparada! Verifique a tela do aparelho.', 'success');
      setTimeout(() => setTestSent(false), 5000);
    } else {
      onToast(res.message, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-900 dark:text-slate-100 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-950/40 dark:via-teal-950/20 shrink-0">
          <div className="flex items-center space-x-3 text-left">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20 shrink-0 flex items-center justify-center text-white">
              {isSubscribed ? <BellRing className="w-6 h-6 animate-pulse" /> : <Bell className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Notificações Push</span>
                {isSubscribed ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                    Ativo
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Inativo
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Alertas instantâneos no iPhone, iPad e Android
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 overflow-y-auto">

          {/* Status Box */}
          <div className={`p-4 rounded-2xl border ${
            isSubscribed 
              ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40' 
              : permission === 'denied'
                ? 'bg-red-50/70 dark:bg-red-950/20 border-red-200 dark:border-red-800/40'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60'
          }`}>
            <div className="flex items-start space-x-3">
              {isSubscribed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : permission === 'denied' ? (
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-5 h-5 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {isSubscribed
                    ? 'Este dispositivo está configurado para receber notificações!'
                    : permission === 'denied'
                      ? 'Permissão de notificação bloqueada pelo navegador'
                      : 'Notificações ainda não ativadas neste dispositivo'}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  {isSubscribed
                    ? 'Você receberá um aviso na tela sempre que um e-mail de compra (Nubank/InfinitePay) for registrado ou reconciliado.'
                    : permission === 'denied'
                      ? 'Para habilitar, acesse as Configurações do seu navegador ou do iOS/Android e permita notificações para este site.'
                      : 'Toque no botão abaixo para permitir o recebimento de alertas financeiros automáticos.'}
                </p>
              </div>
            </div>
          </div>

          {/* iOS Tip if running in Safari browser instead of PWA standalone */}
          {isIos && !isStandalone && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl text-xs text-amber-900 dark:text-amber-200 flex items-start space-x-2.5">
              <Smartphone className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Aviso para iPhone/iPad (iOS 16.4+):</span>
                <p className="mt-0.5 text-amber-800 dark:text-amber-300">
                  A Apple exige que o app seja adicionado à <strong>Tela de Início</strong> para receber notificações com o app fechado. Toque em <strong>Compartilhar</strong> no Safari e escolha <strong>"Adicionar à Tela de Início"</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Features explanation */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              O que você recebe
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-start space-x-2.5">
                <Zap className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Tempo Real</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Aviso imediato quando o Nubank confirma a compra</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-start space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Reconciliação</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Confirmação de baixa automática em contas previstas</p>
                </div>
              </div>
            </div>
          </div>

          {/* Devices Count */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-400">
            <span>Dispositivos ativos conectados:</span>
            <span className="font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded-lg bg-white dark:bg-slate-700 shadow-xs">
              {subscriptionCount} aparelho{subscriptionCount !== 1 ? 's' : ''}
            </span>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 rounded-xl">
              {error}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row gap-2 shrink-0">
          {!isSubscribed ? (
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={loading || !isSupported}
              className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Bell className="w-4 h-4 mr-2" />
              )}
              <span>Ativar Notificações no Aparelho</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleTest}
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                <span>Testar Notificação Agora 🔔</span>
              </button>
              
              <button
                type="button"
                onClick={handleUnsubscribe}
                disabled={loading}
                title="Desativar notificações neste aparelho"
                className="inline-flex items-center justify-center px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <BellOff className="w-4 h-4 mr-1.5" />
                <span>Desativar</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
