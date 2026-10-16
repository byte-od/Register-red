import React from 'react';
import { 
  TrendingUp, TrendingDown, CheckCircle2, AlertCircle, 
  Wallet, PiggyBank, ArrowUpRight, ArrowDownRight, Sparkles, Zap, ArrowRight 
} from 'lucide-react';
import { MonthSummary } from '../types';
import { formatBRL } from '../api';

interface SummaryCardsProps {
  summary: MonthSummary;
  monthTitle: string;
  unforeseenTotal?: number;
  onOpenUnforeseenReport?: () => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ 
  summary, 
  monthTitle,
  unforeseenTotal = 0,
  onOpenUnforeseenReport
}) => {
  const isSurplus = summary.balance >= 0;

  return (
    <div className="space-y-4">
      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* 1. Receitas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Entradas / Receitas</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatBRL(summary.total_income)}
          </div>
          <div className="mt-2 text-xs space-y-0.5">
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
          </div>
        </div>

        {/* 2. Despesas Totais */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Despesas</span>
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
            <span className="text-xs font-semibold uppercase tracking-wider">Total Pago</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
            {formatBRL(summary.total_paid)}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-600 dark:text-slate-400 font-medium">
            <span>{summary.paid_count} de {summary.expense_count} contas pagas</span>
          </div>
        </div>

        {/* 4. A Pagar / Pendente */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pendente (A Pagar)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {formatBRL(summary.total_pending)}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
            <span>{summary.pending_count} contas aguardando</span>
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
              <span className="text-xs font-semibold uppercase tracking-wider block">Saldo Real Hoje</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Recebido até hoje − Pago</span>
            </div>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              (summary.current_balance ?? summary.balance) >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
            }`}>
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold ${
            (summary.current_balance ?? summary.balance) >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
          }`}>
            {formatBRL(summary.current_balance ?? summary.balance)}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Projetado mês:</span>
            <span className={`font-bold ${isSurplus ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatBRL(summary.balance)}
            </span>
          </div>
        </div>

      </div>

      {/* Progress Bar of Month Completion */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Progresso de Liquidação:
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            {summary.paid_percentage}%
          </div>
        </div>
        
        <div className="w-full sm:flex-1 max-w-xl bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${Math.min(100, Math.max(0, summary.paid_percentage))}%` }}
          />
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
          {formatBRL(summary.total_paid)} de {formatBRL(summary.total_expenses)}
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
