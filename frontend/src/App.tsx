import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Cloud, RefreshCw, AlertCircle, CheckCircle2, 
  Calendar, FileSpreadsheet, Plus, Smartphone 
} from 'lucide-react';

import { 
  MonthData, MonthListItem, ExpenseCategory, 
  ExpenseItem, IncomeItem, CreateMonthPayload, OverviewStats 
} from './types';
import { 
  fetchMonths, fetchMonth, updateMonth, toggleItemPaid, 
  toggleItemRecurring, moveItemCategory, createMonth, syncToDrive, fetchOverviewStats 
} from './api';

import { Navbar } from './components/Navbar';
import { SummaryCards } from './components/SummaryCards';
import { UpcomingAlert } from './components/UpcomingAlert';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { ExpenseSection } from './components/ExpenseSection';
import { IncomeSection } from './components/IncomeSection';
import { HistoryView } from './components/HistoryView';
import { NewMonthModal } from './components/NewMonthModal';
import { ExpenseModal } from './components/ExpenseModal';
import { IncomeModal } from './components/IncomeModal';
import { TabletModal } from './components/TabletModal';
import { InstallAppModal } from './components/InstallAppModal';
import { QuickExpenseModal } from './components/QuickExpenseModal';
import { GeminiActionCard } from './components/GeminiActionCard';
import { GeminiGuideModal } from './components/GeminiGuideModal';
import { UnforeseenReportView } from './components/UnforeseenReportView';
import { NotificationModal } from './components/NotificationModal';
import { usePWAInstall } from './hooks/usePWAInstall';
import { usePushNotifications } from './hooks/usePushNotifications';

export const App: React.FC = () => {
  const [months, setMonths] = useState<MonthListItem[]>([]);
  const [currentMonthId, setCurrentMonthId] = useState<string>('2026-10');
  const [currentMonth, setCurrentMonth] = useState<MonthData | null>(null);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [activeTab, setActiveTab] = useState<'month' | 'unforeseen' | 'history'>('month');
  
  const [loading, setLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Dark Mode State
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const toggleDarkMode = () => {
    setIsDark((prev) => !prev);
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#0f172a' : '#ffffff');
    }
  }, [isDark]);

  // Modals
  const [isNewMonthModalOpen, setIsNewMonthModalOpen] = useState(false);
  const [isTabletModalOpen, setIsTabletModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isQuickExpenseModalOpen, setIsQuickExpenseModalOpen] = useState(false);
  const [isGeminiGuideOpen, setIsGeminiGuideOpen] = useState(false);

  // Push Notifications & PWA Install
  const { isSubscribed: isPushSubscribed } = usePushNotifications();
  const { deferredPrompt, isStandalone, isMobile } = usePWAInstall();
  const [expenseModalConfig, setExpenseModalConfig] = useState<{
    isOpen: boolean;
    categoryId?: string;
    item?: ExpenseItem | null;
  }>({ isOpen: false });
  const [incomeModalConfig, setIncomeModalConfig] = useState<{
    isOpen: boolean;
    item?: IncomeItem | null;
  }>({ isOpen: false });

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Initial Data Load
  useEffect(() => {
    loadMonthsAndInitial();
  }, []);

  const loadMonthsAndInitial = async () => {
    setLoading(true);
    try {
      const monthList = await fetchMonths();
      setMonths(monthList);
      
      const targetId = monthList.some((m) => m.id === '2026-10')
        ? '2026-10'
        : monthList[0]?.id || '2026-10';
      
      setCurrentMonthId(targetId);
      const data = await fetchMonth(targetId);
      setCurrentMonth(data);

      const stats = await fetchOverviewStats().catch(() => null);
      if (stats) setOverview(stats);
    } catch (err: any) {
      showToast(err.message || 'Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMonth = async (monthId: string) => {
    setCurrentMonthId(monthId);
    setLoading(true);
    try {
      const data = await fetchMonth(monthId);
      setCurrentMonth(data);
      setActiveTab('month');
    } catch (err: any) {
      showToast(err.message || 'Erro ao carregar mês', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Toggle Paid Status
  const handleTogglePaid = async (itemId: string, paid: boolean) => {
    if (!currentMonth) return;

    // Optimistic Update
    const updatedCategories = currentMonth.categories.map((cat) => ({
      ...cat,
      items: cat.items.map((it) => (it.id === itemId ? { ...it, paid } : it)),
    }));

    const optimisticMonth: MonthData = {
      ...currentMonth,
      categories: updatedCategories,
    };
    setCurrentMonth(optimisticMonth);

    try {
      const result = await toggleItemPaid(currentMonthId, itemId, paid);
      
      // Update Summary from backend
      setCurrentMonth((prev) => (prev ? { ...prev, summary: result.summary } : prev));
      
      // Update Months list
      setMonths((prev) =>
        prev.map((m) =>
          m.id === currentMonthId
            ? {
                ...m,
                total_paid: result.summary.total_paid,
                total_pending: result.summary.total_pending,
                paid_percentage: result.summary.paid_percentage,
              }
            : m
        )
      );

      // Check if all are paid!
      if (paid && result.summary.paid_percentage === 100) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        showToast('Fantástico! Todas as contas do mês foram liquidadas!', 'success');
      } else {
        showToast(paid ? 'Conta marcada como paga!' : 'Conta marcada como pendente.', 'info');
      }
    } catch (err: any) {
      showToast('Erro ao atualizar status', 'error');
      // Rollback
      const reloaded = await fetchMonth(currentMonthId);
      setCurrentMonth(reloaded);
    }
  };

  // Toggle Recurring Status
  const handleToggleRecurring = async (itemId: string, isRecurring: boolean) => {
    if (!currentMonth) return;

    // Optimistic Update
    const updatedCategories = currentMonth.categories.map((cat) => ({
      ...cat,
      items: cat.items.map((it) => (it.id === itemId ? { ...it, is_recurring: isRecurring } : it)),
    }));

    setCurrentMonth({
      ...currentMonth,
      categories: updatedCategories,
    });

    try {
      await toggleItemRecurring(currentMonthId, itemId, isRecurring);
      showToast(
        isRecurring
          ? 'Despesa marcada como recorrente (será replicada no próximo mês).'
          : 'Despesa marcada como pontual (NÃO será copiada para o próximo mês).',
        'info'
      );
    } catch (err: any) {
      showToast('Erro ao atualizar recorrência', 'error');
      const reloaded = await fetchMonth(currentMonthId);
      setCurrentMonth(reloaded);
    }
  };

  // Move Item from Gastos to another category (making it recurring)
  const handleMoveItemCategory = async (
    itemId: string,
    targetCatId: string,
    installmentsCurrent?: number,
    installmentsTotal?: number
  ) => {
    if (!currentMonth) return;
    try {
      const res = await moveItemCategory(
        currentMonthId,
        itemId,
        targetCatId,
        true,
        installmentsCurrent,
        installmentsTotal
      );
      if (res.month) {
        setCurrentMonth(res.month);
      } else {
        const reloaded = await fetchMonth(currentMonthId);
        setCurrentMonth(reloaded);
      }
      await refreshList();
      const instInfo = installmentsTotal ? ` (Parcela ${installmentsCurrent || 1}/${installmentsTotal})` : '';
      showToast(`Item movido para "${res.target_category || targetCatId}"${instInfo} com sucesso!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Erro ao mover item de categoria', 'error');
    }
  };

  // Save Expense Item
  const handleSaveExpense = async (catId: string, item: ExpenseItem) => {
    if (!currentMonth) return;

    const finalItem: ExpenseItem =
      catId === 'gastos'
        ? { ...item, paid: true, is_recurring: false }
        : item;

    const updatedCategories = currentMonth.categories.map((cat) => {
      if (cat.id === catId) {
        const exists = cat.items.some((it) => it.id === finalItem.id);
        const newItems = exists
          ? cat.items.map((it) => (it.id === finalItem.id ? finalItem : it))
          : [...cat.items, finalItem];
        return { ...cat, items: newItems };
      }
      return cat;
    });

    const updated = { ...currentMonth, categories: updatedCategories };
    try {
      const saved = await updateMonth(currentMonthId, updated);
      setCurrentMonth(saved);
      showToast('Despesa salva com sucesso!');
      refreshList();
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar despesa', 'error');
    }
  };

  // Delete Expense Item
  const handleDeleteExpense = async (catId: string, itemId: string) => {
    if (!currentMonth) return;
    if (!confirm('Deseja realmente remover esta despesa?')) return;

    const updatedCategories = currentMonth.categories.map((cat) => {
      if (cat.id === catId) {
        return { ...cat, items: cat.items.filter((it) => it.id !== itemId) };
      }
      return cat;
    });

    const updated = { ...currentMonth, categories: updatedCategories };
    try {
      const saved = await updateMonth(currentMonthId, updated);
      setCurrentMonth(saved);
      showToast('Despesa removida.');
      refreshList();
    } catch (err: any) {
      showToast(err.message || 'Erro ao remover', 'error');
    }
  };

  // Save Income Item
  const handleSaveIncome = async (item: IncomeItem) => {
    if (!currentMonth) return;

    const exists = currentMonth.incomes.some((it) => it.id === item.id);
    const updatedIncomes = exists
      ? currentMonth.incomes.map((it) => (it.id === item.id ? item : it))
      : [...currentMonth.incomes, item];

    const updated = { ...currentMonth, incomes: updatedIncomes };
    try {
      const saved = await updateMonth(currentMonthId, updated);
      setCurrentMonth(saved);
      showToast('Receita salva com sucesso!');
      refreshList();
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar receita', 'error');
    }
  };

  // Delete Income Item
  const handleDeleteIncome = async (itemId: string) => {
    if (!currentMonth) return;
    if (!confirm('Deseja realmente remover esta receita?')) return;

    const updatedIncomes = currentMonth.incomes.filter((it) => it.id !== itemId);
    const updated = { ...currentMonth, incomes: updatedIncomes };
    try {
      const saved = await updateMonth(currentMonthId, updated);
      setCurrentMonth(saved);
      showToast('Receita removida.');
      refreshList();
    } catch (err: any) {
      showToast(err.message || 'Erro ao remover receita', 'error');
    }
  };

  // Quick Add specifically to "Gastos" (unplanned expenses of the month)
  const handleSaveQuickExpense = async (expense: {
    name: string;
    amount: number;
    date: string;
    description?: string;
  }) => {
    if (!currentMonth) return;

    let currentCategories = [...currentMonth.categories];
    const hasGastos = currentCategories.some((c) => c.id.toLowerCase() === 'gastos');

    if (!hasGastos) {
      currentCategories.push({
        id: 'gastos',
        name: 'Gastos',
        items: [],
        total: 0,
        paid_total: 0,
        pending_total: 0,
      });
    }

    const newItem: ExpenseItem = {
      id: `exp_gastos_${Date.now()}`,
      name: expense.name,
      amount: expense.amount,
      paid: true, // Na categoria Gastos tudo já entra pago
      due_day: expense.date,
      notes: expense.description,
      is_recurring: false, // Na categoria Gastos nada é recorrente
    };

    const updatedCategories = currentCategories.map((cat) => {
      if (cat.id.toLowerCase() === 'gastos') {
        return { ...cat, items: [newItem, ...cat.items] };
      }
      return cat;
    });

    const updated = { ...currentMonth, categories: updatedCategories };
    try {
      const saved = await updateMonth(currentMonthId, updated);
      setCurrentMonth(saved);
      showToast(`⚡ Gasto "${expense.name}" adicionado em Gastos!`);
      refreshList();
    } catch (err: any) {
      showToast(err.message || 'Erro ao adicionar gasto', 'error');
    }
  };

  // Sync to Google Drive
  const handleSyncDrive = async () => {
    setIsSyncing(true);
    try {
      const res = await syncToDrive(currentMonthId);
      if (res.success) {
        showToast('Planilha sincronizada e atualizada com sucesso no Google Drive!', 'success');
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Falha ao sincronizar com Google Drive', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Create New Month
  const handleCreateMonth = async (payload: CreateMonthPayload) => {
    try {
      const newMonth = await createMonth(payload);
      await refreshList();
      setCurrentMonthId(newMonth.id);
      setCurrentMonth(newMonth);
      setActiveTab('month');
      showToast(`Novo mês ${newMonth.title} criado com sucesso!`, 'success');
    } catch (err: any) {
      throw err;
    }
  };

  const refreshList = async () => {
    const list = await fetchMonths();
    setMonths(list);
    const stats = await fetchOverviewStats().catch(() => null);
    if (stats) setOverview(stats);
  };

  return (
    <div 
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors pb-16 pb-safe"
      style={{
        paddingBottom: 'calc(4rem + max(env(safe-area-inset-bottom, 0px), 0px))',
        paddingLeft: 'max(env(safe-area-inset-left, 0px), 0px)',
        paddingRight: 'max(env(safe-area-inset-right, 0px), 0px)',
      }}
    >
      
      {/* Navbar */}
      <Navbar
        months={months}
        currentMonthId={currentMonthId}
        onSelectMonth={handleSelectMonth}
        onOpenNewMonthModal={() => setIsNewMonthModalOpen(true)}
        onOpenTabletModal={() => setIsTabletModalOpen(true)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onOpenNotificationModal={() => setIsNotificationModalOpen(true)}
        isPushSubscribed={isPushSubscribed}
        onSyncDrive={handleSyncDrive}
        isSyncing={isSyncing}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isDark={isDark}
        onToggleDark={toggleDarkMode}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom duration-300">
          <div className={`px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2 text-sm font-semibold border ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : toast.type === 'error'
              ? 'bg-rose-600 text-white border-rose-500'
              : 'bg-slate-800 text-white border-slate-700'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {loading && !currentMonth ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-sm text-slate-500 font-medium">
              Carregando dados das planilhas do Google Drive...
            </p>
          </div>
        ) : activeTab === 'unforeseen' ? (
          <UnforeseenReportView
            currentMonthId={currentMonthId}
            months={months}
            onSelectMonth={handleSelectMonth}
            onOpenQuickExpense={() => setIsQuickExpenseModalOpen(true)}
            onDeleteExpense={handleDeleteExpense}
            onMoveItemCategory={handleMoveItemCategory}
            availableCategories={currentMonth?.categories || []}
            showToast={showToast}
          />
        ) : activeTab === 'history' ? (
          <HistoryView
            months={months}
            overview={overview}
            onSelectMonth={handleSelectMonth}
          />
        ) : currentMonth ? (
          <div className="space-y-6">
            
            {/* KPI Cards */}
            <SummaryCards
              summary={currentMonth.summary}
              monthTitle={currentMonth.title}
              year={currentMonth.year}
              monthNumber={currentMonth.month_number}
              unforeseenTotal={
                (currentMonth.categories.find((c) => c.id.toLowerCase() === 'gastos')?.total || 0) +
                currentMonth.categories
                  .filter((c) => c.id.toLowerCase() !== 'gastos')
                  .reduce((acc, c) => acc + c.items.filter((it) => !it.is_recurring).reduce((s, it) => s + it.amount, 0), 0)
              }
              onOpenUnforeseenReport={() => setActiveTab('unforeseen')}
            />

            {/* Gemini & Quick Action CTAs */}
            <GeminiActionCard
              currentMonthId={currentMonthId}
              categories={currentMonth.categories}
              onOpenQuickGastos={() => setIsQuickExpenseModalOpen(true)}
              onOpenAddExpenseForCategory={(catId) =>
                setExpenseModalConfig({ isOpen: true, categoryId: catId, item: null })
              }
              onOpenShortcutsGuide={() => setIsGeminiGuideOpen(true)}
              onRefreshMonth={async () => {
                const updated = await fetchMonth(currentMonthId);
                setCurrentMonth(updated);
                refreshList();
              }}
              showToast={showToast}
            />

            {/* Upcoming Bills Alert */}
            <UpcomingAlert
              categories={currentMonth.categories}
              year={currentMonth.year}
              monthNumber={currentMonth.month_number}
              monthTitle={currentMonth.title}
              onTogglePaid={(itemId, paid) => handleTogglePaid(itemId, paid)}
            />

            {/* Analytics Visual Charts */}
            <AnalyticsCharts
              categories={currentMonth.categories}
              dailyTimeline={currentMonth.daily_timeline}
              totalExpenses={currentMonth.summary.total_expenses}
            />

            {/* Incomes Section */}
            <IncomeSection
              incomes={currentMonth.incomes}
              totalIncome={currentMonth.summary.total_income}
              receivedIncome={currentMonth.summary.received_income}
              pendingIncome={currentMonth.summary.pending_income}
              year={currentMonth.year}
              monthNumber={currentMonth.month_number}
              onAddIncome={() => setIncomeModalConfig({ isOpen: true, item: null })}
              onEditIncome={(item) => setIncomeModalConfig({ isOpen: true, item })}
              onDeleteIncome={handleDeleteIncome}
            />

            {/* Expenses Categorized Section */}
            <ExpenseSection
              categories={currentMonth.categories}
              year={currentMonth.year}
              monthNumber={currentMonth.month_number}
              onTogglePaid={handleTogglePaid}
              onToggleRecurring={handleToggleRecurring}
              onEditExpense={(catId, item) =>
                setExpenseModalConfig({ isOpen: true, categoryId: catId, item })
              }
              onDeleteExpense={handleDeleteExpense}
              onAddExpense={(catId) =>
                setExpenseModalConfig({ isOpen: true, categoryId: catId, item: null })
              }
              onOpenQuickExpense={() => setIsQuickExpenseModalOpen(true)}
              onOpenUnforeseenReport={() => setActiveTab('unforeseen')}
              onQuickAddDirect={handleSaveQuickExpense}
              onMoveItemCategory={handleMoveItemCategory}
            />

          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            Nenhum dado encontrado para o mês selecionado.
          </div>
        )}

      </main>

      {/* Modals */}
      <NewMonthModal
        isOpen={isNewMonthModalOpen}
        onClose={() => setIsNewMonthModalOpen(false)}
        months={months}
        currentMonthId={currentMonthId}
        onCreateMonth={handleCreateMonth}
      />

      <ExpenseModal
        isOpen={expenseModalConfig.isOpen}
        onClose={() => setExpenseModalConfig({ isOpen: false })}
        categories={currentMonth?.categories || []}
        initialCategoryId={expenseModalConfig.categoryId}
        initialItem={expenseModalConfig.item}
        onSave={handleSaveExpense}
      />

      <IncomeModal
        isOpen={incomeModalConfig.isOpen}
        onClose={() => setIncomeModalConfig({ isOpen: false })}
        initialItem={incomeModalConfig.item}
        onSave={handleSaveIncome}
      />

      <TabletModal
        isOpen={isTabletModalOpen}
        onClose={() => setIsTabletModalOpen(false)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
      />

      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onInstallSuccess={() => showToast('Aplicativo instalado com sucesso!', 'success')}
      />

      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        onToast={showToast}
      />

      <QuickExpenseModal
        isOpen={isQuickExpenseModalOpen}
        onClose={() => setIsQuickExpenseModalOpen(false)}
        onSave={handleSaveQuickExpense}
      />

      <GeminiGuideModal
        isOpen={isGeminiGuideOpen}
        onClose={() => setIsGeminiGuideOpen(false)}
        serverUrl={window.location.origin}
      />



    </div>
  );
};

export default App;
