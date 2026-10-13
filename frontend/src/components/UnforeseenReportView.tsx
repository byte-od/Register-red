import React, { useState, useEffect } from 'react';
import { 
  Zap, Calendar, DollarSign, TrendingDown, ArrowUpRight, 
  Download, Printer, Plus, Search, Filter, ArrowRight, 
  Trash2, Repeat, CheckCircle, AlertTriangle, Info, Sparkles,
  ShoppingBag, Utensils, Car, HeartPulse, Send, ChevronDown, 
  RefreshCw, FileSpreadsheet, ArrowUpDown
} from 'lucide-react';
import { 
  UnforeseenReportData, UnforeseenItem, MonthListItem, ExpenseCategory 
} from '../types';
import { 
  fetchUnforeseenReport, getUnforeseenExcelExportUrl, formatBRL, formatDateShort 
} from '../api';

interface UnforeseenReportViewProps {
  currentMonthId: string;
  months: MonthListItem[];
  onSelectMonth: (monthId: string) => void;
  onOpenQuickExpense: () => void;
  onDeleteExpense?: (catId: string, itemId: string) => void;
  onMoveItemCategory?: (
    itemId: string,
    targetCatId: string,
    installmentsCurrent?: number,
    installmentsTotal?: number
  ) => Promise<void> | void;
  availableCategories?: ExpenseCategory[];
  showToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const UnforeseenReportView: React.FC<UnforeseenReportViewProps> = ({
  currentMonthId,
  months,
  onSelectMonth,
  onOpenQuickExpense,
  onDeleteExpense,
  onMoveItemCategory,
  availableCategories = [],
  showToast,
}) => {
  const [report, setReport] = useState<UnforeseenReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubcat, setSelectedSubcat] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'amount_desc' | 'amount_asc' | 'date_desc' | 'name_asc'>('amount_desc');

  // Move Modal State
  const [moveItem, setMoveItem] = useState<UnforeseenItem | null>(null);
  const [targetCatId, setTargetCatId] = useState<string>('');
  const [isInstallment, setIsInstallment] = useState(false);
  const [instCurrent, setInstCurrent] = useState('1');
  const [instTotal, setInstTotal] = useState('10');
  const [isMoving, setIsMoving] = useState(false);

  const targetCategories = availableCategories.filter(
    (c) => c.id.toLowerCase() !== 'gastos'
  );

  const loadReport = async (monthId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUnforeseenReport(monthId);
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(currentMonthId);
  }, [currentMonthId]);

  const handlePrint = () => {
    window.print();
  };

  const handleOpenMove = (item: UnforeseenItem) => {
    setMoveItem(item);
    setTargetCatId(targetCategories[0]?.id || 'casa');
    setIsInstallment(false);
    setInstCurrent('1');
    setInstTotal('10');
  };

  const handleConfirmMove = async () => {
    if (!moveItem || !targetCatId || !onMoveItemCategory) return;
    setIsMoving(true);
    try {
      const pCurr = isInstallment && instCurrent ? parseInt(instCurrent, 10) : undefined;
      const pTot = isInstallment && instTotal ? parseInt(instTotal, 10) : undefined;
      await onMoveItemCategory(moveItem.id, targetCatId, pCurr, pTot);
      setMoveItem(null);
      showToast?.(`Gasto '${moveItem.name}' promovido para recorrente com sucesso!`, 'success');
      loadReport(currentMonthId);
    } catch (err: any) {
      showToast?.(err.message || 'Erro ao mover item', 'error');
    } finally {
      setIsMoving(false);
    }
  };

  const handleDelete = async (item: UnforeseenItem) => {
    if (!onDeleteExpense) return;
    if (!confirm(`Deseja realmente remover o gasto '${item.name}'?`)) return;
    try {
      await onDeleteExpense(item.original_category_id, item.id);
      showToast?.(`Gasto '${item.name}' removido.`);
      loadReport(currentMonthId);
    } catch (err: any) {
      showToast?.(err.message || 'Erro ao remover gasto', 'error');
    }
  };

  const getSubcategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'utensils':
        return <Utensils className="w-3.5 h-3.5" />;
      case 'car':
        return <Car className="w-3.5 h-3.5" />;
      case 'heart-pulse':
        return <HeartPulse className="w-3.5 h-3.5" />;
      case 'shopping-bag':
        return <ShoppingBag className="w-3.5 h-3.5" />;
      case 'send':
        return <Send className="w-3.5 h-3.5" />;
      default:
        return <Zap className="w-3.5 h-3.5" />;
    }
  };

  // Filtered and sorted items
  const filteredItems = (report?.items || [])
    .filter((it) => {
      const matchSearch = it.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (it.notes && it.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchSub = selectedSubcat === 'all' || it.subcategory_id === selectedSubcat;
      return matchSearch && matchSub;
    })
    .sort((a, b) => {
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc') return a.amount - b.amount;
      if (sortBy === 'date_desc') return (b.due_day || '').localeCompare(a.due_day || '');
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      return 0;
    });

  return (
    <div className="space-y-6 print:space-y-4 print:p-0">
      
      {/* 1. Header Banner & Executive Actions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm print:border-none print:shadow-none print:p-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Title & Badge */}
          <div className="flex items-start space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
              <Zap className="w-6 h-6 fill-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Relatório de Gastos Imprevistos
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Despesas Não Previstas
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Auditoria e raio-x de compras pontuais, saídas avulsas e impacto na liquidez de {report?.month_title || currentMonthId}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2 print:hidden">
            
            {/* Month Selector */}
            <div className="relative">
              <select
                value={currentMonthId}
                onChange={(e) => onSelectMonth(e.target.value)}
                className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold text-xs rounded-xl pl-8 pr-7 py-2 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all cursor-pointer shadow-xs"
              >
                {months.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
              <Calendar className="w-3.5 h-3.5 text-amber-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Print / PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              title="Imprimir ou Salvar como PDF"
              className="inline-flex items-center px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-600 dark:text-slate-300" />
              <span>Imprimir / PDF</span>
            </button>

            {/* Export Excel Button */}
            <a
              href={getUnforeseenExcelExportUrl(currentMonthId)}
              download
              title="Baixar planilha Excel com todos os dados dos imprevistos"
              className="inline-flex items-center px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" />
              <span>Exportar Excel</span>
            </a>

            {/* Quick Add Button */}
            <button
              type="button"
              onClick={onOpenQuickExpense}
              className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>+ Gasto Rápido</span>
            </button>

          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">
            Calculando métricas e agrupando gastos imprevistos...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 text-center">
          <p className="font-bold">Erro ao carregar relatório:</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      ) : report ? (
        <>
          {/* 2. Top Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* KPI 1: Total Gasto em Imprevistos */}
            <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 shadow-sm relative overflow-hidden bg-gradient-to-b from-amber-500/5 to-transparent">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center">
                  <Zap className="w-3 h-3 mr-1 fill-amber-500 text-amber-500" />
                  Total Imprevistos
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300">
                  {report.percentage_of_expenses}% do orç.
                </span>
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {formatBRL(report.total_unforeseen)}
              </div>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                de {formatBRL(report.total_expenses)} em despesas totais
              </div>
            </div>

            {/* KPI 2: Impacto no Saldo Líquido */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Impacto no Saldo</span>
                <Sparkles className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {formatBRL(report.balance_without_unforeseen)}
              </div>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center">
                <span>Saldo sem imprevistos (hoje: {formatBRL(report.current_balance)})</span>
              </div>
            </div>

            {/* KPI 3: Qtd. Lançamentos */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Lançamentos</span>
                <span className="text-xs text-slate-400 font-medium">Contagem</span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {report.unforeseen_count}
              </div>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                despesas avulsas registradas
              </div>
            </div>

            {/* KPI 4: Ticket Médio */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Ticket Médio</span>
                <DollarSign className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {formatBRL(report.average_ticket)}
              </div>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                média por transação imprevista
              </div>
            </div>

            {/* KPI 5: Maior Gasto Único */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Maior Imprevisto</span>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400 truncate">
                {report.highest_item ? formatBRL(report.highest_item.amount) : 'R$ 0,00'}
              </div>
              <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 font-semibold truncate" title={report.highest_item?.name}>
                {report.highest_item ? report.highest_item.name : 'Nenhum'}
              </div>
            </div>

          </div>

          {/* 3. Smart Insights & Diagnóstico Financeiro */}
          {report.insights && report.insights.length > 0 && (
            <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent dark:from-amber-950/40 dark:via-orange-950/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center space-x-2 text-amber-900 dark:text-amber-300 font-black text-sm mb-3">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Diagnóstico Inteligente & Dicas de Economia</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {report.insights.map((ins, idx) => {
                  const badgeColor =
                    ins.type === 'warning'
                      ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/60 dark:text-amber-200 dark:border-amber-700'
                      : ins.type === 'tip'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-200 dark:border-emerald-700'
                      : ins.type === 'success'
                      ? 'bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-900/60 dark:text-teal-200 dark:border-teal-700'
                      : 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-900/60 dark:text-indigo-200 dark:border-indigo-700';

                  const iconColor =
                    ins.type === 'warning'
                      ? <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      : ins.type === 'tip'
                      ? <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      : ins.type === 'success'
                      ? <CheckCircle className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                      : <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />;

                  return (
                    <div
                      key={idx}
                      className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-xl flex items-start space-x-3 shadow-xs"
                    >
                      {iconColor}
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                          <span>{ins.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                          {ins.message}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Visual Charts Grid (2 x 2) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Distribuição por Sub-natureza Temática */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-base">
                    <Filter className="w-4 h-4 text-amber-500" />
                    <span>Distribuição por Subcategoria</span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Onde você gastou</span>
                </div>

                <div className="space-y-3.5">
                  {report.subcategories.map((sc) => {
                    return (
                      <div key={sc.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-700 dark:text-slate-300 flex items-center">
                            <span
                              className="w-2.5 h-2.5 rounded-full mr-2"
                              style={{ backgroundColor: sc.color }}
                            />
                            {sc.name}
                            <span className="text-[10px] text-slate-400 font-normal ml-1.5">
                              ({sc.count} {sc.count === 1 ? 'item' : 'itens'})
                            </span>
                          </span>
                          <div className="text-right">
                            <span className="text-slate-900 dark:text-white font-bold mr-1.5">
                              {formatBRL(sc.total)}
                            </span>
                            <span className="text-slate-400 font-normal">
                              ({sc.percentage}%)
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.max(4, sc.percentage)}%`,
                              backgroundColor: sc.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between">
                <span>Concentração total em imprevistos:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatBRL(report.total_unforeseen)}
                </span>
              </div>
            </div>

            {/* Chart 2: Top 5 Maiores Gastos Imprevistos */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-base">
                    <TrendingDown className="w-4 h-4 text-rose-500" />
                    <span>Top 5 Maiores Gastos Imprevistos</span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Ranking</span>
                </div>

                <div className="space-y-3">
                  {report.top_items.map((exp, index) => {
                    const maxVal = report.top_items[0]?.amount || 1;
                    const pctOfMax = (exp.amount / maxVal) * 100;
                    const pctOfTotal = report.total_unforeseen > 0 ? (exp.amount / report.total_unforeseen) * 100 : 0;

                    return (
                      <div key={exp.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2 truncate pr-2">
                            <span className="w-4 text-slate-400 font-bold">{index + 1}.</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate" title={exp.name}>
                              {exp.name}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                              {exp.subcategory_name}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-black text-slate-900 dark:text-white mr-1.5">
                              {formatBRL(exp.amount)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({pctOfTotal.toFixed(1)}%)
                            </span>
                          </div>
                        </div>

                        {/* Bar */}
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-500 rounded-full transition-all duration-500"
                            style={{ width: `${pctOfMax}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between">
                <span>Concentração no Top 5:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  {report.total_unforeseen > 0
                    ? `${((report.top_items.reduce((acc, c) => acc + c.amount, 0) / report.total_unforeseen) * 100).toFixed(1)}% dos imprevistos`
                    : '0%'}
                </span>
              </div>
            </div>

            {/* Chart 3: Linha do Tempo Diária */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-base">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span>Concentração Diária</span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Dias com Saídas</span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Distribuição dos valores pagos de acordo com o dia de ocorrência no mês.
                </p>

                {/* Timeline Grid */}
                {report.daily_distribution.length > 0 ? (
                  <div className="space-y-2.5">
                    {report.daily_distribution.map((d) => {
                      const maxDaily = Math.max(...report.daily_distribution.map((x) => x.total), 1);
                      const pctWidth = (d.total / maxDaily) * 100;

                      return (
                        <div key={d.day} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              Dia {d.day} ({formatDateShort(d.date)})
                              <span className="text-[10px] text-slate-400 ml-1.5 font-normal">
                                • {d.count} {d.count === 1 ? 'gasto' : 'gastos'}
                              </span>
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {formatBRL(d.total)}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${pctWidth}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400">
                    Nenhum lançamento diário registrado.
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between">
                <span>Total de dias com imprevistos:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {report.daily_distribution.length} dias
                </span>
              </div>
            </div>

            {/* Chart 4: Comparativo Histórico de Imprevistos */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-base">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span>Evolução Histórica de Imprevistos</span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Mês a Mês</span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Volume de gastos avulsos comparado com os demais meses indexados.
                </p>

                {/* Monthly Evolution Mini-bars */}
                {report.history_comparison && report.history_comparison.length > 0 ? (
                  <div className="space-y-2.5">
                    {report.history_comparison.slice(-6).map((m) => {
                      const maxHistory = Math.max(...report.history_comparison.map((x) => x.total_unforeseen), 1);
                      const barW = (m.total_unforeseen / maxHistory) * 100;

                      return (
                        <div
                          key={m.month_id}
                          className={`p-2 rounded-xl transition-all cursor-pointer ${
                            m.is_current
                              ? 'bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                          onClick={() => onSelectMonth(m.month_id)}
                        >
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className={`font-semibold flex items-center ${
                              m.is_current ? 'text-amber-800 dark:text-amber-300 font-bold' : 'text-slate-700 dark:text-slate-300'
                            }`}>
                              {m.month_title}
                              {m.is_current && (
                                <span className="ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 font-bold">
                                  Atual
                                </span>
                              )}
                            </span>
                            <div className="text-right">
                              <span className="font-bold text-slate-900 dark:text-white mr-1.5">
                                {formatBRL(m.total_unforeseen)}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                ({m.percentage_of_expenses}%)
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                m.is_current ? 'bg-amber-500' : 'bg-purple-500'
                              }`}
                              style={{ width: `${Math.max(3, barW)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400">
                    Histórico consolidado não disponível.
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between">
                <span>Clique em qualquer mês para carregar:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {months.length} meses indexados
                </span>
              </div>
            </div>

          </div>

          {/* 5. Tabela Completa e Interativa de Imprevistos */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            
            {/* Table Header Controls */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center">
                  <span>Listagem Completa de Imprevistos</span>
                  <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'itens'}
                  </span>
                </h3>
              </div>

              {/* Search, Filter Pills and Sort */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Filtrar por nome ou nota..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Subcategory Filter Select */}
                <div className="relative">
                  <select
                    value={selectedSubcat}
                    onChange={(e) => setSelectedSubcat(e.target.value)}
                    className="appearance-none w-full sm:w-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-3 pr-7 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="all">Todas Subcategorias</option>
                    {report.subcategories.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        {sc.name} ({sc.count})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Sort Select */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="appearance-none w-full sm:w-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-3 pr-7 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="amount_desc">Maior Valor</option>
                    <option value="amount_asc">Menor Valor</option>
                    <option value="date_desc">Data Mais Recente</option>
                    <option value="name_asc">Nome (A-Z)</option>
                  </select>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

              </div>
            </div>

            {/* Table Content */}
            {filteredItems.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Nenhum gasto imprevisto encontrado com os filtros atuais.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4 w-28">Data</th>
                      <th className="py-3 px-4">Descrição do Gasto</th>
                      <th className="py-3 px-4">Sub-natureza</th>
                      <th className="py-3 px-4 text-right">Valor</th>
                      <th className="py-3 px-4 text-center print:hidden">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredItems.map((item) => (
                      <tr 
                        key={item.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* Data */}
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono">
                          {formatDateShort(item.due_day)}
                        </td>

                        {/* Nome & Notas */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {item.name}
                          </div>
                          {item.notes && (
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {item.notes}
                            </div>
                          )}
                        </td>

                        {/* Subcategoria Tag */}
                        <td className="py-3 px-4">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
                            style={{
                              backgroundColor: `${item.subcategory_color}18`,
                              color: item.subcategory_color,
                            }}
                          >
                            <span className="mr-1">
                              {getSubcategoryIcon(item.subcategory_icon)}
                            </span>
                            {item.subcategory_name}
                          </span>
                        </td>

                        {/* Valor */}
                        <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white text-sm">
                          {formatBRL(item.amount)}
                        </td>

                        {/* Ações */}
                        <td className="py-3 px-4 text-center print:hidden">
                          <div className="flex items-center justify-center space-x-1">
                            
                            {/* Botão Mover para Recorrente */}
                            <button
                              type="button"
                              onClick={() => handleOpenMove(item)}
                              title="Tornar este gasto recorrente para os próximos meses (mover para Casa, Pessoal ou Crédito)"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
                            >
                              <Repeat className="w-3.5 h-3.5" />
                            </button>

                            {/* Botão Excluir */}
                            {onDeleteExpense && (
                              <button
                                type="button"
                                onClick={() => handleDelete(item)}
                                title="Remover este gasto"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Table Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs text-slate-500">
              <span>Total listado nesta visão:</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {formatBRL(filteredItems.reduce((acc, it) => acc + it.amount, 0))}
              </span>
            </div>

          </div>
        </>
      ) : null}

      {/* Modal: Promover Gasto para Recorrente em Outra Categoria */}
      {moveItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-950/40 dark:to-purple-950/40">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                  <Repeat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Tornar Gasto Recorrente
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Mover de Imprevistos para outra categoria com replicação mensal
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              
              {/* Item Info Box */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <div className="text-slate-500 dark:text-slate-400">Item Selecionado:</div>
                <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                  {moveItem.name} — <span className="text-emerald-600">{formatBRL(moveItem.amount)}</span>
                </div>
              </div>

              {/* Destination Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Categoria de Destino *
                </label>
                <select
                  value={targetCatId}
                  onChange={(e) => setTargetCatId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {targetCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Installments Checkbox */}
              <div className="pt-1">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInstallment}
                    onChange={(e) => setIsInstallment(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                  />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Este gasto é parcelado? (ex: 1/10)
                  </span>
                </label>
              </div>

              {/* Installment numbers */}
              {isInstallment && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/40 rounded-xl">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Parcela Atual
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={instCurrent}
                      onChange={(e) => setInstCurrent(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Total de Parcelas
                    </label>
                    <input
                      type="number"
                      min="2"
                      value={instTotal}
                      onChange={(e) => setInstTotal(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setMoveItem(null)}
                  disabled={isMoving}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmMove}
                  disabled={isMoving}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all flex items-center"
                >
                  {isMoving ? (
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  <span>Mover e Tornar Recorrente</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
