import React, { useState } from 'react';
import { 
  X, Bell, BellRing, BellOff, CheckCircle2, AlertTriangle, 
  Smartphone, ShieldCheck, Zap, Info, Loader2, Lock, Copy, Check, ExternalLink, HelpCircle
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
    diagnostics,
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
  const [copied, setCopied] = useState(false);
  const [showDnsHelp, setShowDnsHelp] = useState(false);

  if (!isOpen) return null;

  const httpsUrl = 'https://thetods-macbook-pro.tail3f11dd.ts.net';

  const handleCopyHttps = () => {
    navigator.clipboard.writeText(httpsUrl);
    setCopied(true);
    onToast('Link HTTPS seguro copiado!', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSubscribe = async () => {
    if (!diagnostics.isSecureContext) {
      onToast('Para ativar notificações, acesse pelo link seguro HTTPS.', 'error');
      return;
    }
    if (diagnostics.isIos && !diagnostics.isStandalone) {
      onToast('No iPhone, adicione o app à Tela de Início primeiro!', 'error');
      return;
    }

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
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 overflow-y-auto">

          {/* 1. Alerta Crítico: Conexão Insegura (HTTP) */}
          {!diagnostics.isSecureContext && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs space-y-2.5 text-amber-950 dark:text-amber-200">
              <div className="flex items-center space-x-2 font-bold text-amber-800 dark:text-amber-300">
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Acesso via HTTP Inseguro Detectado</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                O <strong>Safari (iOS)</strong> e o <strong>Chrome (Android)</strong> bloqueiam o envio de notificações em conexões sem criptografia SSL (como <code className="bg-amber-100 dark:bg-amber-950/60 px-1 py-0.5 rounded font-mono">http://100.x.y.z:8000</code>).
              </p>

              <div className="pt-1 space-y-1.5">
                <span className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Acesse pelo endereço seguro oficial da sua rede:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={httpsUrl}
                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyHttps}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shrink-0 cursor-pointer flex items-center space-x-1 shadow-xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Botão para ajuda de DNS */}
              <button
                type="button"
                onClick={() => setShowDnsHelp(!showDnsHelp)}
                className="text-[11px] text-amber-800 dark:text-amber-300 underline font-semibold flex items-center space-x-1 pt-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>O link acima não abre no iPhone? Toque aqui para resolver</span>
              </button>

              {showDnsHelp && (
                <div className="p-3 bg-white/70 dark:bg-slate-800/70 rounded-xl border border-amber-200 dark:border-amber-800/50 text-[11px] text-slate-700 dark:text-slate-300 space-y-1.5">
                  <p className="font-bold text-slate-900 dark:text-white">Para o iPhone reconhecer o domínio MagicDNS (.ts.net):</p>
                  <ol className="list-decimal list-inside space-y-1 pl-1">
                    <li>Abra o app <strong>Tailscale</strong> no seu iPhone</li>
                    <li>Toque nas <strong>Configurações (ícone de engrenagem)</strong></li>
                    <li>Acesse <strong>DNS Settings</strong> e ative <strong>"Use Tailscale DNS settings"</strong></li>
                    <li>Pronto! O Safari abrirá o link com HTTPS e cadeado verde nativo.</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* 2. Requisito iOS PWA: Adicionar à Tela de Início */}
          {diagnostics.isIos && !diagnostics.isStandalone && diagnostics.isSecureContext && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-xs space-y-2 text-blue-950 dark:text-blue-200">
              <div className="flex items-center space-x-2 font-bold text-blue-800 dark:text-blue-300">
                <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Requisito Obrigatório da Apple (iOS 16.4+)</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                No iPhone, a Apple <strong>só autoriza notificações para apps adicionados à Tela de Início</strong>. No Safari comum, o recurso é bloqueado pelo próprio sistema operacional.
              </p>
              <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-blue-200 dark:border-blue-800/50 space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                <p className="font-bold text-slate-900 dark:text-white">Passo a passo rápido:</p>
                <ol className="list-decimal list-inside space-y-1 pl-1">
                  <li>Toque no botão <strong>Compartilhar (ícone com quadrado e seta ⎋)</strong> na barra inferior do Safari</li>
                  <li>Role para baixo e selecione <strong>"Adicionar à Tela de Início"</strong></li>
                  <li>Feche o Safari e <strong>abra pelo ícone instalado</strong> na tela do seu iPhone</li>
                  <li>Toque no sino 🔔 e autorize o recebimento!</li>
                </ol>
              </div>
            </div>
          )}

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
                      ? 'Permissão de notificação bloqueada no aparelho'
                      : 'Notificações ainda não ativadas neste dispositivo'}
                </p>
                <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                  {isSubscribed
                    ? 'Você receberá um aviso na tela sempre que um e-mail de compra (Nubank/InfinitePay) for registrado ou reconciliado.'
                    : permission === 'denied'
                      ? 'Para habilitar, acesse os Ajustes do seu aparelho (Configurações ➔ Notificações ➔ Safari/Chrome) e autorize as notificações.'
                      : 'Toque no botão abaixo para permitir o recebimento de alertas financeiros automáticos.'}
                </p>
              </div>
            </div>
          </div>

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
            <span>Dispositivos conectados na rede:</span>
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
              disabled={loading}
              className={`flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md transition-all cursor-pointer ${
                !isSupported
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 active:scale-[0.98]'
              }`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Bell className="w-4 h-4 mr-2" />
              )}
              <span>
                {!diagnostics.isSecureContext
                  ? 'Requer HTTPS para Ativar'
                  : diagnostics.isIos && !diagnostics.isStandalone
                    ? 'Adicione à Tela de Início'
                    : 'Ativar Notificações no Aparelho'}
              </span>
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
