import React from 'react';
import { 
  TrendingUp, CheckCircle2, AlertCircle, 
  Wallet, PiggyBank, ArrowRight, Zap 
} from 'lucide-react';
import { MonthSummary } from '../types';
import { formatBRL } from '../api';

interface SummaryCardsProps {
  summary: MonthSummary;
  monthTitle: string;
  year?: number;
  monthNumber?: number;
  unforeseenTotal?: number;
  onOpenUnforeseenReport?: () => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ 
  summary, 
  monthTitle,
  year,
  monthNumber,
  unforeseenTotal = 0,
  onOpenUnforeseenReport
}) => {
  const isSurplus = summary.balance >= 0;

  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;

  const isCurrentMonth = year === curYear && monthNumber === curMonth;
  const isFutureMonth = (year ?? 0) > curYear || (year === curYear && (monthNumber ?? 0) > curMonth);
  const isPastMonth = (year ?? 0) < curYear || (year === curYear && (monthNumber ?? 0) < curMonth);

  return (
    <div className="space-y-4">
      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* 1. Receitas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {isFutureMonth ? 'Previsão de Entradas' : isPastMonth ? 'Entradas Realizadas' : 'Entradas / Receitas'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatBRL(summary.total_income)}
          </div>
          <div className="mt-2 text-xs space-y-0.5">
            {isFutureMonth ? (
              <>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-medium">
                  <span>Status:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Orçamento Previsto</span>
                </div>
                <div className="text-slate-400 dark:text-slate-500 text-[11px]">
                  Total orçado aguardando início de {monthTitle}
                </div>
              </>
            ) : isPastMonth ? (
              <div className="text-slate-400 dark:text-slate-500 text-[11px] pt-1">
                Mês encerrado • 100% das receitas creditadas
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Recebido até hoje:</span>
                  <span className="font-bold">{formatBRL(summary.received_income ?? summary.total_income)}</span>
                </div>
                {(summary.pending_income ?? 0) > 0 ? (
                  <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-medium">
                    <span>A receber:</span>
                    <span className="font-bold">{formatBRL(summary.pending_income ?? 0)}</span>
                  </div>
                ) : (
                  <div className="text-slate-400 dark:text-slate-500 text-[11px]">
                    100% das receitas creditadas
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* 2. Despesas Totais */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {isFutureMonth ? 'Despesas Previstas' : isPastMonth ? 'Despesas Fechadas' : 'Total Despesas'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatBRL(summary.total_expenses)}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
            <span>{summary.expense_count} contas cadastradas</span>
          </div>
        </div>

        {/* 3. Despesas Pagas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {isPastMonth ? 'Total Liquidado' : 'Total Pago'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
            {formatBRL(summary.total_paid)}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-600 dark:text-slate-400 font-medium">
            <span>
              {isFutureMonth
                ? `0 de ${summary.expense_count} contas (mês futuro)`
                : `${summary.paid_count} de ${summary.expense_count} contas pagas`}
            </span>
          </div>
        </div>

        {/* 4. A Pagar / Pendente */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {isFutureMonth ? 'Previsto a Pagar' : isPastMonth ? 'Pendente no Fechamento' : 'Pendente (A Pagar)'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {formatBRL(summary.total_pending)}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
            <span>
              {isFutureMonth
                ? `${summary.pending_count} contas programadas`
                : `${summary.pending_count} contas aguardando`}
            </span>
          </div>
        </div>

        {/* 5. Saldo Real em Caixa & Projetado */}
        <div className={`border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow ${
          isSurplus
            ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-300 dark:border-emerald-800'
            : 'bg-gradient-to-br from-rose-500/10 to-orange-500/5 border-rose-300 dark:border-rose-800'
        }`}>
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 mb-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider block">
                {isFutureMonth ? 'Saldo Previsto no Mês' : isPastMonth ? 'Saldo Final Fechado' : 'Saldo Real Hoje'}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                {isFutureMonth
                  ? 'Total Entradas − Despesas Previstas'
                  : isPastMonth
                  ? 'Resultado consolidado do mês'
                  : 'Recebido até hoje − Pago'}
              </span>
            </div>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              (isFutureMonth || isPastMonth ? summary.balance : (summary.current_balance ?? summary.balance)) >= 0
                ? 'bg-emerald-500 text-white'
                : 'bg-rose-500 text-white'
            }`}>
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold ${
            (isFutureMonth || isPastMonth ? summary.balance : (summary.current_balance ?? summary.balance)) >= 0
              ? 'text-emerald-700 dark:text-emerald-300'
              : 'text-rose-700 dark:text-rose-300'
          }`}>
            {formatBRL(isFutureMonth || isPastMonth ? summary.balance : (summary.current_balance ?? summary.balance))}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
            {isFutureMonth ? (
              <>
                <span className="text-slate-500 dark:text-slate-400">Previsão:</span>
                <span className={`font-bold ${isSurplus ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {isSurplus ? 'Superávit projetado' : 'Déficit projetado'}
                </span>
              </>
            ) : isPastMonth ? (
              <>
                <span className="text-slate-500 dark:text-slate-400">Resultado:</span>
                <span className={`font-bold ${isSurplus ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {isSurplus ? 'Fechado no azul' : 'Fechado no vermelho'}
                </span>
              </>
            ) : (
              <>
                <span className="text-slate-500 dark:text-slate-400">Projetado mês:</span>
                <span className={`font-bold ${isSurplus ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {formatBRL(summary.balance)}
                </span>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Progress Bar of Month Completion */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {isFutureMonth ? 'Planejamento Orçamentário:' : isPastMonth ? 'Liquidação Final:' : 'Progresso de Liquidação:'}
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            {isFutureMonth ? 'Aguardando Início' : `${summary.paid_percentage}%`}
          </div>
        </div>
        
        <div className="w-full sm:flex-1 max-w-xl bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${isFutureMonth ? 0 : Math.min(100, Math.max(0, summary.paid_percentage))}%` }}
          />
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
          {isFutureMonth
            ? `${formatBRL(summary.total_expenses)} previstos para ${monthTitle}`
            : `${formatBRL(summary.total_paid)} de ${formatBRL(summary.total_expenses)}`}
        </div>
      </div>

      {/* Unforeseen Expenses Quick Alert Banner */}
      {unforeseenTotal > 0 && onOpenUnforeseenReport && (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-200 dark:border-amber-800/60 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-amber-900 dark:text-amber-300">
            <Zap className="w-4 h-4 text-amber-500 shrink-0 fill-amber-500" />
            <span>
              <strong>Gastos Imprevistos:</strong> {formatBRL(unforeseenTotal)} registrados neste mês (
              {((unforeseenTotal / (summary.total_expenses || 1)) * 100).toFixed(1)}% do total).
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenUnforeseenReport}
            className="font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 underline shrink-0 cursor-pointer flex items-center"
          >
            <span>Ver Relatório Completo</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </button>
        </div>
      )}
    </div>
  );
};
