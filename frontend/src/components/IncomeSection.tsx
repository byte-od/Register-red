import React from 'react';
import { Plus, TrendingUp, Edit2, Trash2, Calendar, DollarSign, CheckCircle2, Clock, PiggyBank } from 'lucide-react';
import { IncomeItem } from '../types';
import { formatBRL, formatDateShort } from '../api';

interface IncomeSectionProps {
  incomes: IncomeItem[];
  totalIncome: number;
  receivedIncome?: number;
  pendingIncome?: number;
  year?: number;
  monthNumber?: number;
  onAddIncome: () => void;
  onEditIncome: (item: IncomeItem) => void;
  onDeleteIncome: (itemId: string) => void;
}

const parseDay = (dayStr?: string): number => {
  if (!dayStr) return 99;
  const isoMatch = dayStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return parseInt(isoMatch[3], 10);
  const diaMatch = dayStr.match(/dia\s*(\d{1,2})/i);
  if (diaMatch) return parseInt(diaMatch[1], 10);
  const slashMatch = dayStr.match(/(\d{1,2})\/(\d{1,2})/);
  if (slashMatch) return parseInt(slashMatch[1], 10);
  const numMatch = dayStr.match(/\b(\d{1,2})\b/);
  if (numMatch) return parseInt(numMatch[1], 10);
  if (/mês anterior|anterior|economia/i.test(dayStr)) return 0;
  return 99;
};

const isInitialIncomeItem = (inc: IncomeItem): boolean => {
  return /economia|saldo anterior|mês anterior|anterior/i.test(inc.name) ||
         /anterior|economia/i.test(inc.day || '');
};

export const IncomeSection: React.FC<IncomeSectionProps> = ({
  incomes,
  totalIncome,
  receivedIncome,
  pendingIncome,
  year,
  monthNumber,
  onAddIncome,
  onEditIncome,
  onDeleteIncome,
}) => {
  const sortedIncomes = [...incomes].sort((a, b) => parseDay(a.day) - parseDay(b.day));
  const recIncome = receivedIncome ?? totalIncome;
  const pendIncome = pendingIncome ?? 0;

  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;

  const isCurrentMonth = year === curYear && monthNumber === curMonth;
  const isFutureMonth = (year ?? 0) > curYear || (year === curYear && (monthNumber ?? 0) > curMonth);
  const isPastMonth = (year ?? 0) < curYear || (year === curYear && (monthNumber ?? 0) < curMonth);

  const initialIncome = incomes.find(isInitialIncomeItem);
  const initialBalance = initialIncome?.amount || 0;
  const regularPending = Math.max(0, totalIncome - initialBalance);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      
      {/* Header */}
      <div className="p-4 sm:p-5 bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-xs shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {isFutureMonth ? 'Previsão de Receitas & Entradas' : 'Fontes de Receitas & Entradas'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isFutureMonth
                ? 'Planejamento orçamentário de receitas e economias para o próximo mês'
                : isPastMonth
                ? 'Histórico de receitas consolidadas do mês'
                : 'Salários, vales, adiantamentos e economias ordenados por data'}
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap sm:flex-nowrap gap-3">
          {/* Summary Mini-Cards */}
          <div className="flex items-center gap-2.5 text-xs bg-white/80 dark:bg-slate-900/80 border border-emerald-200/60 dark:border-emerald-800/60 rounded-xl px-3 py-1.5 shadow-2xs">
            {isFutureMonth ? (
              <>
                {initialBalance > 0 && (
                  <>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Saldo Inicial</span>
                      <span className="font-bold text-sky-600 dark:text-sky-400">{formatBRL(initialBalance)}</span>
                    </div>
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
                  </>
                )}
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">
                    {initialBalance > 0 ? 'A Receber no Mês' : 'A Receber'}
                  </span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {formatBRL(initialBalance > 0 ? regularPending : totalIncome)}
                  </span>
                </div>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Total Previsto</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{formatBRL(totalIncome)}</span>
                </div>
              </>
            ) : isPastMonth ? (
              <>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Total Recebido</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatBRL(totalIncome)}</span>
                </div>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Status</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">100% Creditado</span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Recebido</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatBRL(recIncome)}</span>
                </div>
                {pendIncome > 0 && (
                  <>
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">A Receber</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">{formatBRL(pendIncome)}</span>
                    </div>
                  </>
                )}
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Total Previsto</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{formatBRL(totalIncome)}</span>
                </div>
              </>
            )}
          </div>

          <button
            onClick={onAddIncome}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Nova Receita
          </button>
        </div>
      </div>

      {/* Incomes Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <th className="py-3 px-4">Fonte / Descrição</th>
              <th className="py-3 px-4">Valor</th>
              <th className="py-3 px-4">Data Prevista</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {sortedIncomes.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-xs text-slate-400">
                  Nenhuma receita cadastrada neste mês.
                </td>
              </tr>
            ) : (
              sortedIncomes.map((inc) => {
                const isInitial = isInitialIncomeItem(inc);

                return (
                  <tr key={inc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{inc.name}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                      {formatBRL(inc.amount)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-xs">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-medium">
                        <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                        {formatDateShort(inc.day)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {isInitial ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60">
                          <PiggyBank className="w-3.5 h-3.5 mr-1 text-sky-500" />
                          Saldo Inicial
                        </span>
                      ) : isFutureMonth ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                          <Clock className="w-3.5 h-3.5 mr-1 text-amber-500" />
                          A receber
                        </span>
                      ) : inc.received ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                          Recebido
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                          <Clock className="w-3.5 h-3.5 mr-1 text-amber-500" />
                          A receber
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEditIncome(inc)}
                          title="Editar"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteIncome(inc.id)}
                          title="Excluir"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
