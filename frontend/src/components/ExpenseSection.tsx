import React, { useState } from 'react';
import { 
  Plus, Search, Check, Edit2, Trash2, Home, User, 
  CreditCard, Tag, Repeat, Zap, Calendar, DollarSign, X, ArrowRight
} from 'lucide-react';
import { ExpenseCategory, ExpenseItem } from '../types';
import { formatBRL, formatDateShort } from '../api';

interface ExpenseSectionProps {
  categories: ExpenseCategory[];
  onTogglePaid: (itemId: string, paid: boolean) => void;
  onToggleRecurring: (itemId: string, isRecurring: boolean) => void;
  onEditExpense: (catId: string, item: ExpenseItem) => void;
  onDeleteExpense: (catId: string, itemId: string) => void;
  onAddExpense: (catId: string) => void;
  onOpenQuickExpense: () => void;
  onQuickAddDirect: (expense: {
    name: string;
    amount: number;
    date: string;
    description?: string;
  }) => void;
  onMoveItemCategory?: (
    itemId: string,
    targetCatId: string,
    installmentsCurrent?: number,
    installmentsTotal?: number
  ) => Promise<void> | void;
}

const getTodayDateStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const ExpenseSection: React.FC<ExpenseSectionProps> = ({
  categories,
  onTogglePaid,
  onToggleRecurring,
  onEditExpense,
  onDeleteExpense,
  onAddExpense,
  onOpenQuickExpense,
  onQuickAddDirect,
  onMoveItemCategory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');

  // Inline Quick Add on "Gastos" category
  const [inlineName, setInlineName] = useState('');
  const [inlineAmount, setInlineAmount] = useState('');
  const [inlineDate, setInlineDate] = useState(getTodayDateStr());
  const [inlineDesc, setInlineDesc] = useState('');

  // Modal to transform a Gastos item into a recurring item in another category
  const [moveModalItem, setMoveModalItem] = useState<ExpenseItem | null>(null);
  const [selectedTargetCatId, setSelectedTargetCatId] = useState<string>('');
  const [isMoveInstallment, setIsMoveInstallment] = useState<boolean>(false);
  const [moveInstallmentsCurrent, setMoveInstallmentsCurrent] = useState<string>('1');
  const [moveInstallmentsTotal, setMoveInstallmentsTotal] = useState<string>('');
  const [isMoving, setIsMoving] = useState<boolean>(false);

  const availableTargetCategories = categories.filter(
    (c) => c.id.toLowerCase() !== 'gastos'
  );

  const handleOpenMoveModal = (item: ExpenseItem) => {
    setMoveModalItem(item);
    const firstCat = availableTargetCategories[0]?.id || '';
    setSelectedTargetCatId(firstCat);
    setIsMoveInstallment(false);
    setMoveInstallmentsCurrent('1');
    setMoveInstallmentsTotal('10');
  };

  const handleConfirmMove = async () => {
    if (!moveModalItem || !selectedTargetCatId || !onMoveItemCategory) return;
    setIsMoving(true);
    try {
      const parsedCurr = isMoveInstallment && moveInstallmentsCurrent ? parseInt(moveInstallmentsCurrent, 10) : undefined;
      const parsedTot = isMoveInstallment && moveInstallmentsTotal ? parseInt(moveInstallmentsTotal, 10) : undefined;
      await onMoveItemCategory(moveModalItem.id, selectedTargetCatId, parsedCurr, parsedTot);
      setMoveModalItem(null);
    } finally {
      setIsMoving(false);
    }
  };

  const getCategoryIcon = (catId: string) => {
    switch (catId.toLowerCase()) {
      case 'gastos':
        return <Zap className="w-4 h-4 text-amber-500 fill-amber-500/20" />;
      case 'casa':
        return <Home className="w-4 h-4 text-blue-500" />;
      case 'pessoal':
        return <User className="w-4 h-4 text-purple-500" />;
      case 'credito':
        return <CreditCard className="w-4 h-4 text-emerald-500" />;
      default:
        return <Tag className="w-4 h-4 text-slate-500" />;
    }
  };

  const handleInlineGastosSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineName.trim()) return;

    const parsedAmount = parseFloat(inlineAmount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    onQuickAddDirect({
      name: inlineName.trim(),
      amount: parsedAmount,
      date: inlineDate || getTodayDateStr(),
      description: inlineDesc.trim() || undefined,
    });

    setInlineName('');
    setInlineAmount('');
    setInlineDate(getTodayDateStr());
    setInlineDesc('');
  };

  return (
    <div className="space-y-6">
      
      {/* Controls & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar despesa por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>

        {/* Filter Pills & Quick Add Button */}
        <div className="flex items-center space-x-2.5 overflow-x-auto pb-1 md:pb-0">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
              }`}
            >
              Pendentes
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('paid')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'paid'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
              }`}
            >
              Pagas
            </button>
          </div>

          {/* ⚡ BOTÃO ADICIONAR RÁPIDO EM GASTOS */}
          <button
            type="button"
            onClick={onOpenQuickExpense}
            title="Adicionar gasto não previsto diretamente na categoria Gastos"
            className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-amber-500/20 transition-all shrink-0 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Zap className="w-3.5 h-3.5 mr-1.5 fill-white" />
            <span>+ Gasto Rápido</span>
          </button>
        </div>

      </div>

      {/* Category Cards */}
      <div className="space-y-6">
        {categories.map((category) => {
          const isGastos = category.id.toLowerCase() === 'gastos';

          const filteredItems = category.items.filter((item) => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus =
              statusFilter === 'all'
                ? true
                : statusFilter === 'paid'
                ? item.paid
                : !item.paid;
            return matchesSearch && matchesStatus;
          });

          return (
            <div
              key={category.id}
              className={`bg-white dark:bg-slate-900 border rounded-2xl shadow-xs overflow-hidden transition-all ${
                isGastos
                  ? 'border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-400/20 shadow-md'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Category Header */}
              <div
                className={`p-4 sm:p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isGastos
                    ? 'bg-gradient-to-r from-amber-50/90 to-orange-50/70 dark:from-amber-950/40 dark:to-orange-950/30 border-amber-200/80 dark:border-amber-800/50'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${
                      isGastos
                        ? 'bg-amber-500 text-white shadow-amber-500/20'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isGastos ? <Zap className="w-5 h-5 fill-white" /> : getCategoryIcon(category.id)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        {category.name}
                      </h3>
                      {isGastos && (
                        <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold bg-amber-200/80 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
                          ⚡ Gastos Não Previstos
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {category.items.length} itens
                      </span>
                    </div>
                    {isGastos && (
                      <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                        Despesas do mês que não estavam planejadas no orçamento inicial
                      </p>
                    )}
                  </div>
                </div>

                {/* Subtotals & Actions */}
                <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4">
                  <div className="text-left sm:text-right">
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {formatBRL(category.total)}
                    </div>
                    {isGastos ? (
                      <div className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                        Total Liquidado
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Pago: {formatBRL(category.paid_total)}
                        </span>
                        {' • '}
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          Falta: {formatBRL(category.pending_total)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {isGastos ? (
                      <button
                        type="button"
                        onClick={onOpenQuickExpense}
                        title="Adicionar novo gasto rápido"
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-all hover:scale-105 active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5 mr-1 fill-white" />
                        <span>+ Gasto Rápido</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onAddExpense(category.id)}
                        title="Adicionar gasto planejado"
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all hover:scale-105 active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        <span>Adicionar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ⚡ LINHA DE ENTRADA RÁPIDA INLINE EXCLUSIVA PARA A CATEGORIA "GASTOS" */}
              {isGastos && (
                <div className="p-3 bg-amber-50/70 dark:bg-amber-950/20 border-b border-amber-200/60 dark:border-amber-800/40">
                  <form
                    onSubmit={handleInlineGastosSubmit}
                    className="flex flex-wrap sm:flex-nowrap items-center gap-2"
                  >
                    <input
                      type="text"
                      required
                      placeholder="Nome do gasto (ex: Farmácia, Uber, Almoço)... *"
                      value={inlineName}
                      onChange={(e) => setInlineName(e.target.value)}
                      className="flex-1 min-w-[150px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Valor R$ *"
                      value={inlineAmount}
                      onChange={(e) => setInlineAmount(e.target.value)}
                      className="w-24 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                    />
                    <input
                      type="date"
                      value={inlineDate}
                      onChange={(e) => setInlineDate(e.target.value)}
                      title="Data do gasto (padrão hoje, alterável)"
                      className="w-32 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    />
                    <input
                      type="text"
                      placeholder="Descrição (opcional)..."
                      value={inlineDesc}
                      onChange={(e) => setInlineDesc(e.target.value)}
                      className="flex-1 min-w-[120px] hidden md:block bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-all hover:scale-105 active:scale-95 shrink-0 flex items-center"
                    >
                      <Zap className="w-3 h-3 mr-1 fill-white" />
                      <span>+ Lançar</span>
                    </button>
                  </form>
                </div>
              )}

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {!isGastos && <th className="py-3 px-4 w-12 text-center">Status</th>}
                      <th className="py-3 px-4">{isGastos ? 'Item / Gasto' : 'Descrição da Conta'}</th>
                      <th className="py-3 px-4">Valor</th>
                      <th className="py-3 px-4">{isGastos ? 'Data' : 'Data / Vencimento'}</th>
                      {!isGastos && <th className="py-3 px-4 w-12 text-center" title="Recorrência">Tipo</th>}
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={isGastos ? 4 : 6} className="py-6 text-center text-xs text-slate-400">
                          {isGastos
                            ? 'Nenhum gasto não previsto registrado até o momento. Use o botão "+ Gasto Rápido" para lançar.'
                            : 'Nenhuma despesa correspondente encontrada nesta categoria.'}
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                        >
                          {/* Paid Checkbox - Apenas para contas planejadas */}
                          {!isGastos && (
                            <td className="py-3.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => onTogglePaid(item.id, !item.paid)}
                                title={item.paid ? 'Marcar como pendente' : 'Marcar como pago'}
                                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                                  item.paid
                                    ? 'bg-emerald-500 text-white shadow-xs shadow-emerald-500/30 hover:bg-emerald-600'
                                    : 'border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500 text-transparent hover:text-emerald-500'
                                }`}
                              >
                                <Check className="w-4 h-4 stroke-[3]" />
                              </button>
                            </td>
                          )}

                          {/* Description */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`font-semibold transition-all ${
                                  !isGastos && item.paid
                                    ? 'line-through text-slate-400 dark:text-slate-500 font-normal'
                                    : 'text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                {item.name}
                              </span>
                              {item.installments_total && item.installments_total > 1 && (
                                <span className="inline-flex items-center text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 shadow-2xs">
                                  {item.installments_current || 1}/{item.installments_total}
                                </span>
                              )}
                              {item.notes && (
                                <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                  {item.notes}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Amount */}
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                            {formatBRL(item.amount)}
                          </td>

                          {/* Due Date */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                isGastos
                                  ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40'
                                  : item.paid
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {isGastos ? formatDateShort(item.due_day) : item.paid ? 'Quitado' : formatDateShort(item.due_day)}
                            </span>
                          </td>

                          {/* Recorrência / Tipo - Apenas para contas regulares */}
                          {!isGastos && (
                            <td className="py-3.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => onToggleRecurring(item.id, item.is_recurring === false ? true : false)}
                                title={
                                  item.is_recurring !== false
                                    ? item.installments_total && item.installments_total > 1
                                      ? `Despesa parcelada (${item.installments_current || 1} de ${item.installments_total}). Clique para alternar recorrência.`
                                      : 'Despesa recorrente contínua. Clique para tornar pontual.'
                                    : 'Despesa única / pontual (não copia). Clique para tornar recorrente.'
                                }
                                className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${
                                  item.is_recurring !== false
                                    ? item.installments_total && item.installments_total > 1
                                      ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/60 shadow-2xs'
                                      : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/60 shadow-2xs'
                                    : 'border border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 hover:text-slate-500 hover:border-slate-400'
                                }`}
                              >
                                <Repeat className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                              {isGastos && onMoveItemCategory && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenMoveModal(item)}
                                  title="Tornar Recorrente (mover para outra categoria)"
                                  className="p-1.5 rounded-lg text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                                >
                                  <Repeat className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => onEditExpense(category.id, item)}
                                title="Editar"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteExpense(category.id, item.id)}
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
        })}
      </div>

      {/* Modal: Tornar Recorrente e Mover de Categoria */}
      {moveModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/60 to-purple-50/40 dark:from-indigo-950/30 dark:to-purple-950/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                  <Repeat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Tornar Recorrente
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Mover de Gastos para categoria planejada
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMoveModalItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {/* Item Card */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Item selecionado</div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{moveModalItem.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Data: {formatDateShort(moveModalItem.due_day)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Valor</div>
                  <div className="font-extrabold text-base text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {formatBRL(moveModalItem.amount)}
                  </div>
                </div>
              </div>

              {/* Explicação */}
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 p-3 rounded-xl">
                💡 Este item foi registrado como <strong>gasto não previsto</strong>. Ao torná-lo <strong>recorrente</strong>, ele será movido para a categoria escolhida e passará a ser <strong>replicado automaticamente nos próximos meses</strong>.
              </p>

              {/* Seleção de Categoria */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Selecione a Categoria de Destino:
                </label>
                <div className="space-y-2">
                  {availableTargetCategories.map((cat) => {
                    const isSelected = selectedTargetCatId.toLowerCase() === cat.id.toLowerCase();
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedTargetCatId(cat.id)}
                        className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}>
                            {getCategoryIcon(cat.id)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">
                              {cat.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {cat.items.length} contas cadastradas • Total: {formatBRL(cat.total)}
                            </div>
                          </div>
                        </div>

                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Opção de Parcelamento */}
              <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-800/60 space-y-2.5">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMoveInstallment}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsMoveInstallment(checked);
                      if (checked && !moveInstallmentsTotal) {
                        setMoveInstallmentsTotal('10');
                        setMoveInstallmentsCurrent('1');
                      }
                    }}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 border-purple-300"
                  />
                  <div>
                    <span className="text-xs font-bold text-purple-900 dark:text-purple-300 block">
                      Tornar como Despesa Parcelada
                    </span>
                    <span className="text-[11px] text-purple-700 dark:text-purple-400">
                      Defina o número de parcelas desta conta (ex: 1/10).
                    </span>
                  </div>
                </label>

                {isMoveInstallment && (
                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-purple-200/60 dark:border-purple-800/40 mt-2">
                    <div>
                      <label className="block text-[10px] font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider mb-1">
                        Parcela Atual
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Ex: 1"
                        value={moveInstallmentsCurrent}
                        onChange={(e) => setMoveInstallmentsCurrent(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider mb-1">
                        Total de Parcelas
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="120"
                        placeholder="Ex: 10"
                        value={moveInstallmentsTotal}
                        onChange={(e) => setMoveInstallmentsTotal(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setMoveModalItem(null)}
                disabled={isMoving}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmMove}
                disabled={isMoving || !selectedTargetCatId}
                className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-102 active:scale-98 disabled:opacity-50"
              >
                <Repeat className={`w-3.5 h-3.5 mr-1.5 ${isMoving ? 'animate-spin' : ''}`} />
                <span>{isMoving ? 'Movendo...' : 'Confirmar e Mover'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
