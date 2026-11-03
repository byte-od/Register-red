import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, Check, CreditCard, Zap, Home, User, Tag, 
  Calendar, DollarSign, Calculator, ArrowRight, ShoppingBag
} from 'lucide-react';
import { ExpenseCategory, ExpenseItem, ConsolidateWishRequest } from '../types';
import { formatBRL, formatDateShort } from '../api';

interface ConsolidateWishModalProps {
  isOpen: boolean;
  item: ExpenseItem | null;
  categories: ExpenseCategory[];
  year?: number;
  monthNumber?: number;
  onClose: () => void;
  onConfirm: (payload: ConsolidateWishRequest) => Promise<void>;
}

const getTodayDateStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const ConsolidateWishModal: React.FC<ConsolidateWishModalProps> = ({
  isOpen,
  item,
  categories,
  year,
  monthNumber,
  onClose,
  onConfirm,
}) => {
  const [paymentMode, setPaymentMode] = useState<'single' | 'installment'>('single');
  const [installmentsTotal, setInstallmentsTotal] = useState<number>(10);
  const [customInstallmentAmount, setCustomInstallmentAmount] = useState<string>('');
  const [targetCategoryId, setTargetCategoryId] = useState<string>('credito');
  const [paid, setPaid] = useState<boolean>(false);
  const [dueDay, setDueDay] = useState<string>(getTodayDateStr());
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Available categories to move (exclude desejos)
  const availableCategories = categories.filter(
    (c) => c.id.toLowerCase() !== 'desejos'
  );

  useEffect(() => {
    if (item && isOpen) {
      setPaymentMode('single');
      setInstallmentsTotal(10);
      setCustomInstallmentAmount('');
      // Default to Credito or first available
      const defaultCat = availableCategories.find((c) => c.id.toLowerCase() === 'credito') || availableCategories[0];
      setTargetCategoryId(defaultCat ? defaultCat.id : 'credito');
      setPaid(false);
      setDueDay(item.due_day || getTodayDateStr());
      setNotes(item.notes || '');
      setIsSubmitting(false);
    }
  }, [item, isOpen]);

  // When target category changes, adjust defaults
  const handleSelectCategory = (catId: string) => {
    setTargetCategoryId(catId);
    if (catId.toLowerCase() === 'gastos') {
      setPaid(true);
      setPaymentMode('single');
    }
  };

  const handleSelectPaymentMode = (mode: 'single' | 'installment') => {
    setPaymentMode(mode);
    if (mode === 'installment') {
      // If moving as installment, prefer Cartão de Crédito
      const creditCat = availableCategories.find((c) => c.id.toLowerCase() === 'credito');
      if (creditCat) {
        setTargetCategoryId(creditCat.id);
        setPaid(false);
      }
    }
  };

  if (!isOpen || !item) return null;

  const originalAmount = item.amount || 0;
  const isInstallment = paymentMode === 'installment';
  
  // Installment calculation
  const calculatedInstallment = isInstallment && installmentsTotal > 0
    ? Math.round((originalAmount / installmentsTotal) * 100) / 100
    : originalAmount;

  const effectiveInstallmentAmount = customInstallmentAmount 
    ? parseFloat(customInstallmentAmount.replace(',', '.')) || calculatedInstallment
    : calculatedInstallment;

  const installmentPresets = [2, 3, 4, 5, 6, 10, 12, 18, 24];

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCategoryId) return;

    setIsSubmitting(true);
    try {
      const payload: ConsolidateWishRequest = {
        item_id: item.id,
        target_category_id: targetCategoryId,
        installments_total: isInstallment ? installmentsTotal : 1,
        installments_current: 1,
        installment_amount: isInstallment ? effectiveInstallmentAmount : originalAmount,
        paid: targetCategoryId.toLowerCase() === 'gastos' ? true : paid,
        due_day: dueDay || getTodayDateStr(),
        notes: notes.trim() || undefined,
      };

      await onConfirm(payload);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-rose-50/80 via-pink-50/50 to-purple-50/60 dark:from-rose-950/40 dark:via-pink-950/30 dark:to-purple-950/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Consolidar Despesa
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                  ✨ Do Desejo ao Real
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Mova este item para o orçamento ativo do mês
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            
            {/* Wish Item Card */}
            <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
                  Item da Lista de Desejos
                </span>
                <span className="font-bold text-sm text-slate-900 dark:text-white mt-0.5 block">
                  {item.name}
                </span>
                {item.due_day && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
                    Data prevista original: {formatDateShort(item.due_day)}
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
                  Preço Previsto
                </span>
                <span className="font-extrabold text-base text-rose-600 dark:text-rose-400 mt-0.5 block">
                  {formatBRL(originalAmount)}
                </span>
              </div>
            </div>

            {/* Formas de Pagamento / Parcelamento */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Como foi ou será realizado o pagamento?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectPaymentMode('single')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    !isInstallment
                      ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20 font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <DollarSign className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                  <span className="text-xs block">À Vista (1x)</span>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                    {formatBRL(originalAmount)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPaymentMode('installment')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isInstallment
                      ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/20 font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <Calculator className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                  <span className="text-xs block">Parcelado (Cartão / Carnê)</span>
                  <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 block mt-0.5">
                    {installmentsTotal}x de {formatBRL(calculatedInstallment)}
                  </span>
                </button>
              </div>
            </div>

            {/* Configuração de Parcelamento se selecionado */}
            {isInstallment && (
              <div className="p-3.5 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-300">
                    Número de Parcelas:
                  </span>
                  <span className="text-xs font-extrabold text-purple-700 dark:text-purple-400">
                    {installmentsTotal} parcelas
                  </span>
                </div>

                {/* Preset Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {installmentPresets.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setInstallmentsTotal(n)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        installmentsTotal === n
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100'
                      }`}
                    >
                      {n}x
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-purple-200/60 dark:border-purple-800/40">
                  <div>
                    <label className="block text-[10px] font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider mb-1">
                      Total de Parcelas
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="48"
                      value={installmentsTotal}
                      onChange={(e) => setInstallmentsTotal(Math.max(2, parseInt(e.target.value, 10) || 2))}
                      className="w-full bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider mb-1">
                      Valor da Parcela (R$)
                    </label>
                    <input
                      type="text"
                      placeholder={calculatedInstallment.toFixed(2)}
                      value={customInstallmentAmount}
                      onChange={(e) => setCustomInstallmentAmount(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-purple-800 dark:text-purple-300 bg-white/70 dark:bg-slate-900/60 p-2 rounded-lg border border-purple-200/50 dark:border-purple-800/50">
                  📌 Será lançado no orçamento como: <strong>{item.name} (1/{installmentsTotal})</strong> no valor mensal de <strong>{formatBRL(effectiveInstallmentAmount)}</strong>. O Register Red continuará replicando e avançando as parcelas nos meses seguintes até {installmentsTotal}/{installmentsTotal}.
                </div>
              </div>
            )}

            {/* Categoria de Destino */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Selecione a Categoria de Destino:
              </label>
              <div className="space-y-2">
                {availableCategories.map((cat) => {
                  const isSelected = targetCategoryId.toLowerCase() === cat.id.toLowerCase();
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat.id)}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {getCategoryIcon(cat.id)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">
                            {cat.name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {cat.id.toLowerCase() === 'credito' && 'Fatura de Cartão de Crédito'}
                            {cat.id.toLowerCase() === 'gastos' && 'Débito / Pix / Gasto Imediato (já liquidado)'}
                            {cat.id.toLowerCase() === 'casa' && 'Despesas com Moradia / Bens para Casa'}
                            {cat.id.toLowerCase() === 'pessoal' && 'Despesas Pessoais e Individuais'}
                          </div>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Data e Status de Pagamento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Data da Compra / Vencimento
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Status Pago se não for Gastos (em Gastos é sempre pago) */}
              {targetCategoryId.toLowerCase() !== 'gastos' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Status de Pagamento
                  </label>
                  <label className="flex items-center space-x-2.5 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paid}
                      onChange={(e) => setPaid(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {paid ? 'Já foi pago / liquidado' : 'A pagar na fatura / pendente'}
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Observações */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Observações / Detalhes (opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Comprado na Amazon, loja física..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !targetCategoryId}
              className="inline-flex items-center px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white shadow-md shadow-pink-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 mr-1.5 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>{isSubmitting ? 'Consolidando...' : 'Confirmar Consolidação'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
