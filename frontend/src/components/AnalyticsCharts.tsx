import React from 'react';
import { PieChart, BarChart2, CalendarRange, TrendingUp, Info } from 'lucide-react';
import { ExpenseCategory, DailyTimelineItem } from '../types';
import { formatBRL } from '../api';

interface AnalyticsChartsProps {
  categories: ExpenseCategory[];
  dailyTimeline: DailyTimelineItem[];
  totalExpenses: number;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  categories,
  dailyTimeline,
  totalExpenses,
}) => {
  // Collect all expenses for top ranking
  const allExpenses: { name: string; amount: number; paid: boolean; category: string }[] = [];
  categories.forEach((cat) => {
    cat.items.forEach((it) => {
      allExpenses.push({
        name: it.name,
        amount: it.amount,
        paid: it.paid,
        category: cat.name,
      });
    });
  });

  allExpenses.sort((a, b) => b.amount - a.amount);
  const topExpenses = allExpenses.slice(0, 5);

  const categoryColors: Record<string, { bg: string; fill: string; text: string }> = {
    casa: { bg: 'bg-blue-500', fill: '#3B82F6', text: 'text-blue-500' },
    pessoal: { bg: 'bg-purple-500', fill: '#A855F7', text: 'text-purple-500' },
    credito: { bg: 'bg-amber-500', fill: '#F59E0B', text: 'text-amber-500' },
    gastos: { bg: 'bg-orange-500', fill: '#F97316', text: 'text-orange-500' },
    outros: { bg: 'bg-emerald-500', fill: '#10B981', text: 'text-emerald-500' },
  };

  // Max value for daily cash flow curve
  const maxTimelineVal = Math.max(
    ...dailyTimeline.map((d) => Math.max(d.total_debt, d.total_income ?? 0)),
    1
  );
  const peakDebt = Math.max(...dailyTimeline.map((d) => d.total_debt), 0);
  const peakIncome = Math.max(...dailyTimeline.map((d) => d.total_income ?? 0), 0);
  const timelinePoints = dailyTimeline.filter((_, idx) => idx % 2 === 0 || idx === dailyTimeline.length - 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. Category Distribution Breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-base mb-4">
            <PieChart className="w-5 h-5 text-indigo-500" />
            <span>Distribuição por Categoria</span>
          </div>

          <div className="space-y-4">
            {categories.map((cat) => {
              const pct = totalExpenses > 0 ? (cat.total / totalExpenses) * 100 : 0;
              const color = categoryColors[cat.id.toLowerCase()] || categoryColors.outros;

              return (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300 flex items-center">
                      <span className={`w-2.5 h-2.5 rounded-full ${color.bg} mr-2`} />
                      {cat.name}
                    </span>
                    <div className="text-right">
                      <span className="text-slate-900 dark:text-white mr-1.5">
                        {formatBRL(cat.total)}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 font-normal">
                        ({pct.toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color.bg} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between">
          <span>Total consolidado:</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {formatBRL(totalExpenses)}
          </span>
        </div>
      </div>

      {/* 2. Top 5 Largest Expenses */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-base mb-4">
            <BarChart2 className="w-5 h-5 text-emerald-500" />
            <span>Top 5 Maiores Gastos</span>
          </div>

          <div className="space-y-3.5">
            {topExpenses.map((exp, index) => {
              const maxSingle = topExpenses[0]?.amount || 1;
              const barWidth = (exp.amount / maxSingle) * 100;

              return (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5 truncate pr-2">
                      <span className="w-4 text-slate-400 font-bold">{index + 1}.</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={exp.name}>
                        {exp.name}
                      </span>
                      <span className="text-[10px] text-slate-400">({exp.category})</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white shrink-0">
                      {formatBRL(exp.amount)}
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        exp.paid ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-500'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between">
          <span>Concentração no Top 5:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {totalExpenses > 0
              ? `${((topExpenses.reduce((acc, c) => acc + c.amount, 0) / totalExpenses) * 100).toFixed(1)}%`
              : '0%'}
          </span>
        </div>
      </div>

      {/* 3. Daily Cash Flow Curve (Income vs Expenses) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-base">
              <CalendarRange className="w-5 h-5 text-teal-500" />
              <span>Fluxo de Caixa</span>
            </div>
            {/* Legend */}
            <div className="flex items-center space-x-3 text-[11px] font-semibold">
              <span className="flex items-center text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1" />
                Receitas
              </span>
              <span className="flex items-center text-indigo-600 dark:text-indigo-400">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 mr-1" />
                Despesas
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Evolução diária comparando receitas creditadas e despesas acumuladas.
          </p>

          {/* SVG Area Chart */}
          <div className="relative h-32 w-full pt-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="incomeCurveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="expenseCurveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line x1="0" y1="20" x2="300" y2="20" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="3 3" />
              <line x1="0" y1="60" x2="300" y2="60" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="3 3" />

              {/* Path calculation */}
              {dailyTimeline.length > 1 && (
                <>
                  {/* Fill Area - Income */}
                  <path
                    d={`
                      M 0 100
                      ${dailyTimeline
                        .map((d, i) => {
                          const x = (i / (dailyTimeline.length - 1)) * 300;
                          const y = 100 - ((d.total_income ?? 0) / maxTimelineVal) * 85;
                          return `L ${x.toFixed(1)} ${y.toFixed(1)}`;
                        })
                        .join(' ')}
                      L 300 100 Z
                    `}
                    fill="url(#incomeCurveGradient)"
                  />

                  {/* Line - Income */}
                  <path
                    d={`
                      M 0 100
                      ${dailyTimeline
                        .map((d, i) => {
                          const x = (i / (dailyTimeline.length - 1)) * 300;
                          const y = 100 - ((d.total_income ?? 0) / maxTimelineVal) * 85;
                          return `L ${x.toFixed(1)} ${y.toFixed(1)}`;
                        })
                        .join(' ')}
                    `}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Line - Expenses */}
                  <path
                    d={`
                      M 0 100
                      ${dailyTimeline
                        .map((d, i) => {
                          const x = (i / (dailyTimeline.length - 1)) * 300;
                          const y = 100 - (d.total_debt / maxTimelineVal) * 85;
                          return `L ${x.toFixed(1)} ${y.toFixed(1)}`;
                        })
                        .join(' ')}
                    `}
                    fill="none"
                    stroke="#6366F1"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                    strokeLinecap="round"
                  />
                </>
              )}
            </svg>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
            <span>Dia 01</span>
            <span>Dia 10</span>
            <span>Dia 20</span>
            <span>Dia 31</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <span>Despesas:</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatBRL(peakDebt)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>Receitas:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatBRL(peakIncome)}</span>
          </div>
        </div>
      </div>

    </div>
  );
};
