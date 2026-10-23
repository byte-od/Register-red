import React from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import { ExpenseCategory, ExpenseItem } from '../types';
import { formatBRL, displayExpenseName } from '../api';

interface UpcomingAlertProps {
  categories: ExpenseCategory[];
  year?: number;
  monthNumber?: number;
  monthTitle?: string;
  onTogglePaid: (itemId: string, paid: boolean) => void;
}

export const UpcomingAlert: React.FC<UpcomingAlertProps> = ({ 
  categories, 
  year,
  monthNumber,
  monthTitle,
  onTogglePaid 
}) => {
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;

  const isCurrentMonth = year === curYear && monthNumber === curMonth;
  const isFutureMonth = (year ?? 0) > curYear || (year === curYear && (monthNumber ?? 0) > curMonth);
  const isPastMonth = (year ?? 0) < curYear || (year === curYear && (monthNumber ?? 0) < curMonth);

  // Collect all unpaid items
  const unpaidItems: { item: ExpenseItem; categoryName: string; dayNum: number }[] = [];

  categories.forEach((cat) => {
    cat.items.forEach((it) => {
      if (!it.paid) {
        let dayNum = 10;
        if (it.due_day) {
          const match = it.due_day.match(/(\d{4})-(\d{2})-(\d{2})/);
          if (match) {
            dayNum = parseInt(match[3], 10);
          } else {
            const numMatch = it.due_day.match(/\b(\d{1,2})\b/);
            if (numMatch) dayNum = parseInt(numMatch[1], 10);
          }
        }
        unpaidItems.push({ item: it, categoryName: cat.name, dayNum });
      }
    });
  });

  if (unpaidItems.length === 0) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4 flex items-center space-x-3 text-emerald-800 dark:text-emerald-200 shadow-sm">
        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <div className="text-sm">
          <span className="font-semibold">Parabéns!</span> Todas as despesas cadastradas para este mês estão devidamente quitadas.
        </div>
      </div>
    );
  }

  // Sort by day number
  unpaidItems.sort((a, b) => a.dayNum - b.dayNum);
  const nextUp = unpaidItems.slice(0, 4);

  return (
    <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 rounded-2xl p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center space-x-2 text-amber-900 dark:text-amber-200">
          <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="font-semibold text-sm">
            {isFutureMonth 
              ? `Vencimentos Programados (${unpaidItems.length} despesas)`
              : isPastMonth
              ? `Contas em Aberto no Encerramento (${unpaidItems.length} pendentes)`
              : `Próximos Vencimentos Prioritários (${unpaidItems.length} pendentes)`}
          </span>
        </div>
        <span className="text-xs text-amber-700/80 dark:text-amber-300/80">
          {isFutureMonth
            ? `Prévia das primeiras contas programadas para ${monthTitle || 'o mês'}`
            : 'Clique em "Pagar" para dar baixa rápida'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {nextUp.map(({ item, categoryName, dayNum }) => (
          <div
            key={item.id}
            className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-800 rounded-xl p-3 flex items-center justify-between shadow-sm hover:border-amber-400 dark:hover:border-amber-700 transition-colors"
          >
            <div className="min-w-0 pr-2">
              <div className="flex items-center space-x-1.5">
                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                  Dia {dayNum}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {categoryName}
                </span>
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white truncate mt-0.5 flex items-center gap-1.5" title={item.name}>
                <span className="truncate">{displayExpenseName(item)}</span>
                {item.installments_total && item.installments_total > 1 && (
                  <span className="shrink-0 text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
                    {item.installments_current || 1}/{item.installments_total}
                  </span>
                )}
              </div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {formatBRL(item.amount)}
              </div>
            </div>

            <button
              onClick={() => onTogglePaid(item.id, true)}
              className="shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-all hover:scale-105 active:scale-95"
            >
              Pagar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
