import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Zap, Volume2, Smartphone, Send, Mic, MicOff, 
  CheckCircle2, RefreshCw, History, ArrowRightLeft, Mail, ShoppingBag, 
  TrendingUp, Clock, ChevronDown, ChevronUp
} from 'lucide-react';
import { ExpenseCategory, RecentAction } from '../types';
import { fetchRecentActions, formatBRL } from '../api';

interface GeminiActionCardProps {
  currentMonthId: string;
  categories: ExpenseCategory[];
  onOpenQuickGastos?: () => void;
  onOpenAddExpenseForCategory?: (catId: string) => void;
  onOpenShortcutsGuide: () => void;
  onRefreshMonth: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const GeminiActionCard: React.FC<GeminiActionCardProps> = ({
  currentMonthId,
  categories,
  onOpenQuickGastos,
  onOpenAddExpenseForCategory,
  onOpenShortcutsGuide,
  onRefreshMonth,
  showToast,
}) => {
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [actions, setActions] = useState<RecentAction[]>([]);
  const [loadingActions, setLoadingActions] = useState(false);
  const [showAllActions, setShowAllActions] = useState(false);

  const loadRecentActions = async () => {
    try {
      setLoadingActions(true);
      const list = await fetchRecentActions(8, currentMonthId);
      setActions(list);
    } catch (err) {
      console.error('Erro ao buscar ações recentes', err);
    } finally {
      setLoadingActions(false);
    }
  };

  useEffect(() => {
    loadRecentActions();
    const interval = setInterval(loadRecentActions, 15000); // Polling a cada 15s para detectar automações
    return () => clearInterval(interval);
  }, [currentMonthId]);

  // Voice Recognition via Web Speech API
  const handleToggleVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast('Reconhecimento de voz não suportado neste navegador.', 'error');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCommand(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Submit AI Command
  const handleSubmitCommand = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = command.trim();
    if (!text) return;

    setLoading(true);
    setResponseMsg(null);

    try {
      const res = await fetch('/api/gemini/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: text, month_id: currentMonthId }),
      });

      const data = await res.json();
      if (data.success) {
        setResponseMsg(data.speech_text || data.message);
        showToast(data.message, 'success');
        onRefreshMonth();
        loadRecentActions();
        setCommand('');
      } else {
        setResponseMsg(`⚠️ ${data.message}`);
        showToast(data.message, 'error');
      }
    } catch (err: any) {
      setResponseMsg('Erro de comunicação com o servidor.');
      showToast('Erro ao processar comando.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Speak financial summary aloud (Text-to-Speech)
  const handleSpeakBriefing = async () => {
    if (!('speechSynthesis' in window)) {
      showToast('Síntese de voz não suportada neste dispositivo.', 'error');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    try {
      const res = await fetch(`/api/gemini/briefing?month_id=${currentMonthId}`);
      const data = await res.json();
      if (data.speech_text) {
        setResponseMsg(data.speech_text);
        const utterance = new SpeechSynthesisUtterance(data.speech_text);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.05;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      showToast('Falha ao obter resumo falado.', 'error');
    }
  };

  const getActionIcon = (act: RecentAction) => {
    switch (act.type) {
      case 'toggle_paid':
      case 'reconciled':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'income':
        return <TrendingUp className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />;
      case 'move':
        return <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
      case 'create':
      default:
        return <ShoppingBag className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  const getActionBg = (act: RecentAction) => {
    switch (act.type) {
      case 'toggle_paid':
      case 'reconciled':
        return 'bg-emerald-100 dark:bg-emerald-950/80';
      case 'income':
        return 'bg-teal-100 dark:bg-teal-950/80';
      case 'move':
        return 'bg-blue-100 dark:bg-blue-950/80';
      case 'create':
      default:
        return 'bg-indigo-100 dark:bg-indigo-950/80';
    }
  };

  const getSourceBadge = (source: string, isSeed?: boolean) => {
    if (isSeed) {
      return (
        <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 px-1.5 py-0.5 rounded-md">
          <span>Planilha</span>
        </span>
      );
    }
    if (source === 'gmail') {
      return (
        <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 px-1.5 py-0.5 rounded-md">
          <Mail className="w-2.5 h-2.5 text-emerald-500" />
          <span>Gmail 24h</span>
        </span>
      );
    }
    if (source === 'gemini_ai' || source === 'gemini') {
      return (
        <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 px-1.5 py-0.5 rounded-md">
          <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
          <span>IA</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 px-1.5 py-0.5 rounded-md">
        <span>Manual</span>
      </span>
    );
  };

  const formatActionTime = (act: RecentAction) => {
    // Se for item importado como seed histórico da planilha
    if (act.id.startsWith('seed_')) {
      if (act.details && act.details !== 'Planilha') {
        if (act.details.includes('-')) {
          const parts = act.details.split('-');
          if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
        }
        return act.details;
      }
      return 'Planilha';
    }

    if (!act.timestamp) {
      return act.details || 'Planilha';
    }

    try {
      const date = new Date(act.timestamp);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diffSec < 60) return 'Agora';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m atrás`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h atrás`;
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch {
      return '';
    }
  };

  const displayedActions = showAllActions ? actions.slice(0, 8) : actions.slice(0, 4);

  return (
    <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-pink-950/40 border border-indigo-200/80 dark:border-indigo-800/60 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <Sparkles className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Central de Inteligência & Ações (Mac, Celular & Tablet)</span>
              <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                Voz & Texto
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Controle por voz, linguagem natural e automação 24h via Gmail e IA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={onOpenShortcutsGuide}
            className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-colors shrink-0"
          >
            <Smartphone className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
            <span>Configurar Dispositivos</span>
          </button>
        </div>
      </div>

      {/* 🕒 ÚLTIMAS AÇÕES (Substitui os atalhos rápidos) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Últimas Ações</span>
            </div>
            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/80 px-2 py-0.5 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Tempo Real</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSpeakBriefing}
              className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all ${
                isSpeaking
                  ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse'
                  : 'bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-white shadow-2xs'
              }`}
              title="Ouvir resumo financeiro do mês em voz alta"
            >
              <Volume2 className="w-3.5 h-3.5 mr-1 text-indigo-500" />
              <span>{isSpeaking ? 'Parar Áudio' : 'Ouvir Resumo'}</span>
            </button>

            <button
              type="button"
              onClick={loadRecentActions}
              disabled={loadingActions}
              className="text-[11px] text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 p-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800 transition-colors"
              title="Recarregar últimas ações"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingActions ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Cards das ações recentes */}
        {actions.length === 0 ? (
          <div className="bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-3.5 text-center text-xs text-slate-500 dark:text-slate-400">
            Nenhuma ação recente registrada ainda.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {displayedActions.map((act) => (
              <div
                key={act.id}
                className="bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-2.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-1.5"
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${getActionBg(act)}`}>
                      {getActionIcon(act)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate" title={act.title}>
                        {act.title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="truncate">{act.category || 'Geral'}</span>
                        {act.status && (
                          <>
                            <span>•</span>
                            <span className={act.status === 'Pago' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-500'}>
                              {act.status}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {act.amount !== null && act.amount !== undefined && (
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {formatBRL(act.amount)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  {getSourceBadge(act.source, act.id.startsWith('seed_'))}
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {formatActionTime(act)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Toggle para mostrar até 8 ações se houver mais de 4 */}
        {actions.length > 4 && (
          <div className="flex justify-center pt-0.5">
            <button
              type="button"
              onClick={() => setShowAllActions(!showAllActions)}
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 py-0.5 px-2 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
            >
              {showAllActions ? (
                <>
                  <span>Mostrar menos</span>
                  <ChevronUp className="w-3 h-3" />
                </>
              ) : (
                <>
                  <span>Ver mais ({actions.length})</span>
                  <ChevronDown className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 💬 BARRA DE COMANDO EM LINGUAGEM NATURAL */}
      <form onSubmit={handleSubmitCommand} className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Digite ou dite: ex: 'Almoço 45 em Gastos', 'Pagar Luz', 'Internet 120 em Casa'..."
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            disabled={loading}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl pl-4 pr-11 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs font-medium"
          />
          <button
            type="button"
            onClick={handleToggleVoice}
            title={isListening ? 'Parar gravação' : 'Ditar comando por voz'}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-xl transition-all ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse'
                : 'text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading || !command.trim()}
          className="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 shrink-0"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 fill-white" />
              <span className="hidden sm:inline">Executar</span>
            </>
          )}
        </button>
      </form>

      {/* RESPOSTA DO GEMINI EM BALÃO DE FALA */}
      {responseMsg && (
        <div className="p-3.5 bg-white/90 dark:bg-slate-900/90 border border-indigo-200/80 dark:border-indigo-800/80 rounded-2xl text-xs text-slate-800 dark:text-slate-200 shadow-sm flex items-start gap-2.5 animate-in fade-in duration-150">
          <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 leading-relaxed">
            <strong className="text-indigo-600 dark:text-indigo-400 block mb-0.5">Gemini:</strong>
            {responseMsg}
          </div>
          <button
            type="button"
            onClick={() => setResponseMsg(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            &times;
          </button>
        </div>
      )}

    </div>
  );
};
