import React from 'react';
import { 
  BarChart3, Calendar, ArrowUpRight, ArrowDownRight, 
  ExternalLink, FileSpreadsheet, TrendingUp, CheckCircle 
} from 'lucide-react';
import { MonthListItem, OverviewStats } from '../types';
import { formatBRL } from '../api';

interface HistoryViewProps {
  months: MonthListItem[];
  overview: OverviewStats | null;
  onSelectMonth: (id: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  months,
  overview,
  onSelectMonth,
}) => {
  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <BarChart3 className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Histórico & Comparativo Consolidado
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Visualização de todos os {months.length} meses indexados no Google Drive
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-500">
            <span className="flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5" />
              Entradas
            </span>
            <span className="flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 mr-1.5" />
              Despesas
            </span>
            <span className="flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 mr-1.5" />
              Sobra (Saldo)
            </span>
          </div>
        </div>

        {/* Multi-month Chart */}
        {overview && overview.months.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Evolução dos Últimos Meses
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {overview.months.slice(-6).map((monthName, idx) => {
                const actualIdx = overview.months.length - 6 + idx;
                const inc = overview.incomes[actualIdx] || 0;
                const exp = overview.expenses[actualIdx] || 0;
                const bal = overview.balances[actualIdx] || 0;
                const maxVal = Math.max(...overview.incomes, ...overview.expenses, 1);

                return (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700/60">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mb-2">
                      {monthName}
                    </div>

                    {/* Mini comparison bars */}
                    <div className="space-y-1.5">
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Entrada:</span>
                          <span className="font-semibold text-emerald-600">{formatBRL(inc)}</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-0.5">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${(inc / maxVal) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Saída:</span>
                          <span className="font-semibold text-indigo-600">{formatBRL(exp)}</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-0.5">
                          <div
                            className="bg-indigo-500 h-full rounded-full"
                            style={{ width: `${(exp / maxVal) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-between text-[11px] font-bold">
                        <span className="text-slate-400">Saldo:</span>
                        <span className={bal >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          {formatBRL(bal)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Comprehensive Table of All Months */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Todas as Planilhas ({months.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Clique no mês para abrir os detalhes completos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <th className="py-3 px-4">Planilha / Mês</th>
                <th className="py-3 px-4">Receitas</th>
                <th className="py-3 px-4">Despesas</th>
                <th className="py-3 px-4">Pago</th>
                <th className="py-3 px-4">Saldo Final</th>
                <th className="py-3 px-4">% Quitado</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {months.map((m) => {
                const isPositive = m.balance >= 0;
                const isCurrent = m.id === '2026-10';

                return (
                  <tr
                    key={m.id}
                    onClick={() => onSelectMonth(m.id)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                          {m.title}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Atual
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatBRL(m.total_income)}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {formatBRL(m.total_expenses)}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {formatBRL(m.total_paid)}
                    </td>

                    <td className={`py-3.5 px-4 font-bold ${
                      isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {formatBRL(m.balance)}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${Math.min(100, Math.max(0, m.paid_percentage))}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 font-mono">
                          {m.paid_percentage}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectMonth(m.id);
                        }}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/40 text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300 transition-colors"
                      >
                        Abrir
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
