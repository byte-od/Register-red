import React, { useState } from 'react';
import { X, Copy, Sparkles, RefreshCw, Cloud, Repeat } from 'lucide-react';
import { MonthListItem, CreateMonthPayload } from '../types';

interface NewMonthModalProps {
  isOpen: boolean;
  onClose: () => void;
  months: MonthListItem[];
  currentMonthId: string;
  onCreateMonth: (payload: CreateMonthPayload) => Promise<void>;
}


export const NewMonthModal: React.FC<NewMonthModalProps> = ({
  isOpen,
  onClose,
  months,
  currentMonthId,
  onCreateMonth,
}) => {
  const current = months.find((m) => m.id === currentMonthId);
  
  // Predict next month
  let nextYear = 2026;
  let nextMonthNum = 11;
  if (current) {
    if (current.month_number === 12) {
      nextYear = current.year + 1;
      nextMonthNum = 1;
    } else {
      nextYear = current.year;
      nextMonthNum = current.month_number + 1;
    }
  }

  const [year, setYear] = useState<number>(nextYear);
  const [monthNumber, setMonthNumber] = useState<number>(nextMonthNum);
  const [cloneFromId, setCloneFromId] = useState<string>(currentMonthId);
  const [carryOverBalance, setCarryOverBalance] = useState<boolean>(true);
  const [resetPaid, setResetPaid] = useState<boolean>(true);
  const [syncToDrive, setSyncToDrive] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const monthNames = [
    '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onCreateMonth({
        year,
        month_number: monthNumber,
        clone_from_id: cloneFromId || undefined,
        carry_over_balance: carryOverBalance,
        reset_paid: resetPaid,
        sync_to_drive: syncToDrive,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar mês');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Criar Próxima Planilha
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gere o novo mês com despesas recorrentes e sincronização
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium">
              {error}
            </div>
          )}

          {/* Month & Year Selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Mês
              </label>
              <select
                value={monthNumber}
                onChange={(e) => setMonthNumber(parseInt(e.target.value, 10))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {monthNames.slice(1).map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Ano
              </label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
                <option value={2028}>2028</option>
              </select>
            </div>
          </div>

          {/* Base Clone Month */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Clonar despesas e receitas a partir de:
            </label>
            <div className="relative">
              <select
                value={cloneFromId}
                onChange={(e) => setCloneFromId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {months.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
              <Copy className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Recurrence Rule Banner */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-950 dark:text-indigo-200 flex items-start space-x-2.5">
            <Repeat className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-indigo-900 dark:text-indigo-200">
                Filtro de Dívidas Recorrentes Ativo
              </span>
              <span className="text-indigo-700 dark:text-indigo-300">
                Apenas as despesas marcadas como <strong>&quot;Recorrente&quot;</strong> serão copiadas para este novo mês. Gastos pontuais (únicos) serão automaticamente descartados.
              </span>
            </div>
          </div>

          {/* Options Switches */}
          <div className="space-y-3 pt-1">
            <label className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 cursor-pointer hover:bg-slate-100/60 transition-colors">
              <input
                type="checkbox"
                checked={resetPaid}
                onChange={(e) => setResetPaid(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Resetar status de pagamento para &quot;Pendente&quot;
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Todas as contas iniciam o novo mês como não pagas.
                </span>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 cursor-pointer hover:bg-slate-100/60 transition-colors">
              <input
                type="checkbox"
                checked={carryOverBalance}
                onChange={(e) => setCarryOverBalance(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Transferir saldo positivo como &quot;Economias (Mês anterior)&quot;
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Carrega a sobra do mês anterior para o caixa inicial.
                </span>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 cursor-pointer">
              <input
                type="checkbox"
                checked={syncToDrive}
                onChange={(e) => setSyncToDrive(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-emerald-300"
              />
              <div className="text-xs">
                <span className="font-semibold text-emerald-900 dark:text-emerald-300 flex items-center">
                  <Cloud className="w-3.5 h-3.5 mr-1" />
                  Salvar automaticamente no Google Drive (.numbers)
                </span>
                <span className="text-emerald-700 dark:text-emerald-400/80">
                  Cria o arquivo imediatamente na pasta Numbers do Google Drive.
                </span>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              <span>Criar {monthNames[monthNumber]} {year}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
