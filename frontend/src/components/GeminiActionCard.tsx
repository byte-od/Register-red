import React, { useState } from 'react';
import { 
  Sparkles, Zap, Home, User, CreditCard, Volume2, 
  Smartphone, Send, Mic, MicOff, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import { ExpenseCategory } from '../types';

interface GeminiActionCardProps {
  currentMonthId: string;
  categories: ExpenseCategory[];
  onOpenQuickGastos: () => void;
  onOpenAddExpenseForCategory: (catId: string) => void;
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
              <span>Ações Rápidas & Gemini (Celular & Tablet)</span>
              <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                Voz & Texto
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Crie, leia e dê baixa em despesas de qualquer categoria com 1 toque ou comando natural
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenShortcutsGuide}
          className="inline-flex items-center self-start sm:self-auto px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-colors shrink-0"
        >
          <Smartphone className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
          <span>Configurar no Celular/Tablet</span>
        </button>
      </div>

      {/* 🚀 CALL TO ACTION BUTTONS (CTAs Rápidos de 1 Toque) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
        
        {/* CTA 1: Gastos Imprevistos */}
        <button
          type="button"
          onClick={onOpenQuickGastos}
          className="inline-flex items-center px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
        >
          <Zap className="w-3.5 h-3.5 mr-1.5 fill-white" />
          <span>+ Gastos (Imprevistos)</span>
        </button>

        {/* CTA 2: Gasto em Casa */}
        <button
          type="button"
          onClick={() => onOpenAddExpenseForCategory('casa')}
          className="inline-flex items-center px-3 py-2 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors shrink-0"
        >
          <Home className="w-3.5 h-3.5 mr-1.5" />
          <span>+ Casa</span>
        </button>

        {/* CTA 3: Gasto em Pessoal */}
        <button
          type="button"
          onClick={() => onOpenAddExpenseForCategory('pessoal')}
          className="inline-flex items-center px-3 py-2 rounded-xl text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-colors shrink-0"
        >
          <User className="w-3.5 h-3.5 mr-1.5" />
          <span>+ Pessoal</span>
        </button>

        {/* CTA 4: Gasto em Crédito */}
        <button
          type="button"
          onClick={() => onOpenAddExpenseForCategory('credito')}
          className="inline-flex items-center px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors shrink-0"
        >
          <CreditCard className="w-3.5 h-3.5 mr-1.5" />
          <span>+ Crédito</span>
        </button>

        {/* CTA 5: Ouvir Resumo em Voz Alta */}
        <button
          type="button"
          onClick={handleSpeakBriefing}
          className={`inline-flex items-center px-3 py-2 rounded-xl text-xs font-semibold border transition-all shrink-0 ${
            isSpeaking
              ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
          title="Ouvir resumo financeiro do mês em voz alta"
        >
          <Volume2 className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
          <span>{isSpeaking ? 'Parar Áudio' : 'Ouvir Resumo'}</span>
        </button>

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
