import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Tag, CheckSquare } from 'lucide-react';
import { ExpenseCategory, ExpenseItem } from '../types';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ExpenseCategory[];
  initialCategoryId?: string;
  initialItem?: ExpenseItem | null;
  onSave: (catId: string, item: ExpenseItem) => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  categories,
  initialCategoryId,
  initialItem,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [paid, setPaid] = useState(false);
  const [isRecurring, setIsRecurring] = useState(true);
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentsCurrent, setInstallmentsCurrent] = useState('1');
  const [installmentsTotal, setInstallmentsTotal] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const initialCat = initialCategoryId || categories[0]?.id || 'casa';
    const isCatGastos = initialCat.toLowerCase() === 'gastos';

    if (initialItem) {
      setName(initialItem.name || '');
      setAmount(initialItem.amount ? initialItem.amount.toString() : '');
      setCategoryId(initialCat);
      setDueDay(initialItem.due_day || '10');
      setPaid(isCatGastos ? true : !!initialItem.paid);
      setIsRecurring(isCatGastos ? false : initialItem.is_recurring !== false);
      setNotes(initialItem.notes || '');

      let hasInst = false;
      let instCurr = '1';
      let instTot = '';

      if (initialItem.installments_total && initialItem.installments_total > 1) {
        hasInst = true;
        instCurr = String(initialItem.installments_current || 1);
        instTot = String(initialItem.installments_total);
      } else if (initialItem.name) {
        const match = initialItem.name.match(/\(?(\d+)\s*[/xX]\s*(\d+)\)?/);
        if (match) {
          hasInst = true;
          instCurr = match[1];
          instTot = match[2];
        }
      }

      setIsInstallment(hasInst);
      setInstallmentsCurrent(instCurr);
      setInstallmentsTotal(instTot);
    } else {
      setName('');
      setAmount('');
      setCategoryId(initialCat);
      setDueDay('10');
      setPaid(isCatGastos ? true : false);
      setIsRecurring(isCatGastos ? false : true);
      setIsInstallment(false);
      setInstallmentsCurrent('1');
      setInstallmentsTotal('');
      setNotes('');
    }
  }, [initialItem, initialCategoryId, categories, isOpen]);

  if (!isOpen) return null;

  const isGastos = categoryId.toLowerCase() === 'gastos';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.')) || 0;
    const parsedCurrent = isRecurring && isInstallment && installmentsCurrent ? parseInt(installmentsCurrent, 10) : undefined;
    const parsedTotal = isRecurring && isInstallment && installmentsTotal ? parseInt(installmentsTotal, 10) : undefined;

    const item: ExpenseItem = {
      id: initialItem?.id || `exp_${Date.now()}`,
      name: name.trim(),
      amount: parsedAmount,
      paid: isGastos ? true : paid,
      due_day: dueDay.trim() || '10',
      notes: notes.trim() || undefined,
      is_recurring: isGastos ? false : isRecurring,
      installments_current: parsedTotal ? (parsedCurrent || 1) : undefined,
      installments_total: parsedTotal || undefined,
    };
    onSave(categoryId, item);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            {initialItem ? 'Editar Despesa' : 'Nova Despesa'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Categoria
            </label>
            <select
              value={categoryId}
              onChange={(e) => {
                const val = e.target.value;
                setCategoryId(val);
                if (val.toLowerCase() === 'gastos') {
                  setPaid(true);
                  setIsRecurring(false);
                }
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Descrição da Despesa
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Aluguel, Internet, Advogado..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Valor (R$)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">
                  R$
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Dia / Vencimento
              </label>
              <input
                type="text"
                placeholder="Ex: 10 ou 2026-10-10"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {isGastos ? (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-medium space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <span>⚡ Categoria Gastos</span>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Os itens desta categoria entram automaticamente como <strong>já pagos</strong> e <strong>não recorrentes</strong> (não serão replicados no próximo mês).
              </p>
            </div>
          ) : (
            <>
              <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={paid}
                  onChange={(e) => setPaid(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Marcar como já pago (quitado)
                </span>
              </label>

              <label className="flex items-center space-x-3 p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 cursor-pointer hover:bg-indigo-100/50 transition-colors">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-indigo-300"
                />
                <div className="text-xs">
                  <span className="font-semibold text-indigo-900 dark:text-indigo-300 block">
                    Dívida Recorrente (replicar para o mês seguinte)
                  </span>
                  <span className="text-indigo-700 dark:text-indigo-400">
                    Se desmarcado, esta dívida será pontual e NÃO será copiada para a próxima planilha.
                  </span>
                </div>
              </label>

              {isRecurring && (
                <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-800/60 space-y-2.5">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInstallment}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsInstallment(checked);
                        if (checked && !installmentsTotal) {
                          setInstallmentsTotal('10');
                          setInstallmentsCurrent('1');
                        }
                      }}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 border-purple-300"
                    />
                    <div>
                      <span className="text-xs font-bold text-purple-900 dark:text-purple-300 block">
                        Despesa Parcelada (com número de parcelas)
                      </span>
                      <span className="text-[11px] text-purple-700 dark:text-purple-400">
                        Marque se esta conta possui parcelas definidas (ex: 1/10).
                      </span>
                    </div>
                  </label>

                  {isInstallment && (
                    <div className="grid grid-cols-2 gap-3 pt-1 border-t border-purple-200/60 dark:border-purple-800/40 mt-2">
                      <div>
                        <label className="block text-[10px] font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider mb-1">
                          Parcela Atual
                        </label>
                        <input
                          type="number"
                          min="1"
                          placeholder="Ex: 1"
                          value={installmentsCurrent}
                          onChange={(e) => setInstallmentsCurrent(e.target.value)}
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
                          value={installmentsTotal}
                          onChange={(e) => setInstallmentsTotal(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div className="col-span-2 text-[10px] text-purple-800/80 dark:text-purple-300/80 leading-normal bg-purple-100/50 dark:bg-purple-900/30 p-2 rounded-lg">
                        💡 Ao criar novos meses, a parcela avançará automaticamente (ex: {installmentsCurrent || 1}/{installmentsTotal || 10} → {(parseInt(installmentsCurrent || '1', 10) + 1)}/{installmentsTotal || 10}) e a despesa <strong>deixará de ser copiada</strong> ao atingir a última parcela.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95"
            >
              Salvar Despesa
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
