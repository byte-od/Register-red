import React from 'react';
import { Plus, TrendingUp, Edit2, Trash2, Calendar, DollarSign } from 'lucide-react';
import { IncomeItem } from '../types';
import { formatBRL, formatDateShort } from '../api';

interface IncomeSectionProps {
  incomes: IncomeItem[];
  totalIncome: number;
  onAddIncome: () => void;
  onEditIncome: (item: IncomeItem) => void;
  onDeleteIncome: (itemId: string) => void;
}

export const IncomeSection: React.FC<IncomeSectionProps> = ({
  incomes,
  totalIncome,
  onAddIncome,
  onEditIncome,
  onDeleteIncome,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      
      {/* Header */}
      <div className="p-4 sm:p-5 bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-xs">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Fontes de Receitas & Entradas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Salários, vales, adiantamentos e economias
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-slate-500 dark:text-slate-400">Total Previsto:</div>
            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              {formatBRL(totalIncome)}
            </div>
          </div>

          <button
            onClick={onAddIncome}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all hover:scale-105 active:scale-95"
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
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {incomes.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-xs text-slate-400">
                  Nenhuma receita cadastrada neste mês.
                </td>
              </tr>
            ) : (
              incomes.map((inc) => (
                <tr key={inc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
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
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
