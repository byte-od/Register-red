import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, Cloud, RefreshCw, PlusCircle, Download, 
  BarChart3, Moon, Sun, Table, FileSpreadsheet, Tablet, ChevronDown, Zap, Smartphone
} from 'lucide-react';
import { MonthListItem } from '../types';

interface NavbarProps {
  months: MonthListItem[];
  currentMonthId: string;
  onSelectMonth: (id: string) => void;
  onOpenNewMonthModal: () => void;
  onOpenTabletModal: () => void;
  onOpenInstallModal: () => void;
  onSyncDrive: () => void;
  isSyncing: boolean;
  activeTab: 'month' | 'unforeseen' | 'history';
  onTabChange: (tab: 'month' | 'unforeseen' | 'history') => void;
  isDark: boolean;
  onToggleDark: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  months,
  currentMonthId,
  onSelectMonth,
  onOpenNewMonthModal,
  onOpenTabletModal,
  onOpenInstallModal,
  onSyncDrive,
  isSyncing,
  activeTab,
  onTabChange,
  isDark,
  onToggleDark,
}) => {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Close export dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header 
      className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs pt-safe pl-safe pr-safe"
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), 0px)',
        paddingLeft: 'max(env(safe-area-inset-left, 0px), 0px)',
        paddingRight: 'max(env(safe-area-inset-right, 0px), 0px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 md:px-6 lg:px-8">
        
        {/* ========================================================= */}
        {/* DESKTOP LAYOUT (>= lg / 1024px): Single spacious row      */}
        {/* ========================================================= */}
        <div className="hidden lg:flex items-center justify-between h-16 gap-3 xl:gap-4">
          
          {/* Brand & Badges */}
          <div className="flex items-center space-x-2.5 shrink-0 min-w-0">
            <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base xl:text-lg text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
                  Gestão Numbers
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] xl:text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 shrink-0">
                  <Cloud className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400" />
                  <span>Drive</span>
                </span>
                <span className="hidden xl:inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] xl:text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 shrink-0" title="Automação 24h ativa no Mac: e-mails bancários sincronizados automaticamente via IMAP">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse mr-1" />
                  Gmail 24h
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Controls Bar */}
          <div className="flex items-center gap-1.5 xl:gap-2 shrink-0">
            
            {/* View Mode Tabs (Mês vs Imprevistos vs Histórico) */}
            <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
              <button
                type="button"
                onClick={() => onTabChange('month')}
                title="Visualizar Mês Atual"
                className={`flex items-center px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'month'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Table className="w-3.5 h-3.5 mr-1" />
                <span>Mês</span>
              </button>
              <button
                type="button"
                onClick={() => onTabChange('unforeseen')}
                title="Relatório de Gastos Imprevistos"
                className={`flex items-center px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'unforeseen'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400'
                }`}
              >
                <Zap className="w-3.5 h-3.5 mr-1 fill-current" />
                <span>Imprevistos</span>
              </button>
              <button
                type="button"
                onClick={() => onTabChange('history')}
                title="Histórico e Comparativos"
                className={`flex items-center px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'history'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 mr-1" />
                <span>Histórico</span>
              </button>
            </div>

            {/* Month Select Dropdown */}
            <div className="relative shrink-0">
              <select
                value={currentMonthId}
                onChange={(e) => onSelectMonth(e.target.value)}
                className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold text-xs xl:text-sm rounded-xl pl-7 pr-7 py-1.5 xl:py-2 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer shadow-xs max-w-[140px] truncate"
              >
                {months.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} {m.id === '2026-10' ? '★' : ''}
                  </option>
                ))}
              </select>
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Sync Drive Button */}
            <button
              type="button"
              onClick={onSyncDrive}
              disabled={isSyncing}
              title="Salvar e sincronizar no Google Drive"
              className="inline-flex items-center justify-center p-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-500' : ''}`} />
              <span className="hidden 2xl:inline ml-1.5">Sincronizar</span>
            </button>

            {/* New Month Button */}
            <button
              type="button"
              onClick={onOpenNewMonthModal}
              title="Criar próxima planilha mensal"
              className="inline-flex items-center justify-center px-2.5 py-1.5 xl:py-2 rounded-xl text-xs xl:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1" />
              <span className="hidden xl:inline">+ Novo Mês</span>
              <span className="xl:hidden">+ Novo</span>
            </button>



            {/* Export Dropdown */}
            <div className="relative shrink-0" ref={exportRef}>
              <button 
                type="button"
                onClick={() => setIsExportOpen(!isExportOpen)}
                title="Exportar planilha (.numbers ou Excel .xlsx)"
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              {isExportOpen && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 transition-all z-50">
                  <a
                    href={`/api/months/${currentMonthId}/export/numbers`}
                    download
                    onClick={() => setIsExportOpen(false)}
                    className="flex items-center px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
                    Baixar Planilha Numbers
                  </a>
                  <a
                    href={`/api/months/${currentMonthId}/export/excel`}
                    download
                    onClick={() => setIsExportOpen(false)}
                    className="flex items-center px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700"
                  >
                    <Table className="w-4 h-4 mr-2 text-emerald-600" />
                    Baixar Planilha Excel (.xlsx)
                  </a>
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={onToggleDark}
              title={isDark ? "Modo Claro" : "Modo Escuro"}
              aria-label={isDark ? "Modo Claro" : "Modo Escuro"}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all shadow-xs shrink-0"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
            </button>

          </div>
        </div>

        {/* ========================================================= */}
        {/* TABLET & MOBILE LAYOUT (< lg / 1024px): 2 clean rows      */}
        {/* ========================================================= */}
        <div className="lg:hidden py-2 space-y-2">
          
          {/* Row 1: Brand & Device/Theme Shortcuts */}
          <div className="flex items-center justify-between gap-2">
            
            {/* Brand Title + Compact Badges */}
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xs shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-slate-900 dark:text-white tracking-tight truncate">
                Gestão Numbers
              </span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 shrink-0">
                <Cloud className="w-2.5 h-2.5 sm:mr-0.5" />
                <span className="hidden sm:inline">Drive</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 shrink-0" title="Automação Gmail 24h ativa">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse mr-0.5" />
                Gmail
              </span>
            </div>

            {/* Quick Actions (Theme) */}
            <div className="flex items-center space-x-1 shrink-0">
              <button
                type="button"
                onClick={onToggleDark}
                title={isDark ? "Modo Claro" : "Modo Escuro"}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Row 2: Tabs, Month Select, Sync, Export & New Month */}
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            
            {/* View Mode Tabs (Mês, Imprevistos, Histórico) */}
            <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
              <button
                type="button"
                onClick={() => onTabChange('month')}
                title="Mês Atual"
                className={`p-1.5 sm:px-2.5 rounded-md text-xs font-semibold flex items-center transition-all ${
                  activeTab === 'month'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Table className="w-3.5 h-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Mês</span>
              </button>
              <button
                type="button"
                onClick={() => onTabChange('unforeseen')}
                title="Gastos Imprevistos"
                className={`p-1.5 sm:px-2.5 rounded-md text-xs font-semibold flex items-center transition-all ${
                  activeTab === 'unforeseen'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Zap className="w-3.5 h-3.5 sm:mr-1 fill-current" />
                <span className="hidden sm:inline">Imprevistos</span>
              </button>
              <button
                type="button"
                onClick={() => onTabChange('history')}
                title="Histórico"
                className={`p-1.5 sm:px-2.5 rounded-md text-xs font-semibold flex items-center transition-all ${
                  activeTab === 'history'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Histórico</span>
              </button>
            </div>

            {/* Month Select Dropdown (Fluid width with safety constraints) */}
            <div className="relative flex-1 min-w-[90px] max-w-[190px]">
              <select
                value={currentMonthId}
                onChange={(e) => onSelectMonth(e.target.value)}
                className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold text-xs rounded-lg pl-6 pr-6 py-1.5 truncate cursor-pointer shadow-xs"
              >
                {months.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
              <Calendar className="w-3 h-3 text-emerald-600 dark:text-emerald-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Quick Actions Group */}
            <div className="flex items-center space-x-1 shrink-0">
              
              {/* Sync Drive */}
              <button
                type="button"
                onClick={onSyncDrive}
                disabled={isSyncing}
                title="Sincronizar Google Drive"
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-500' : ''}`} />
              </button>

              {/* Export Dropdown */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsExportOpen(!isExportOpen)}
                  title="Exportar planilha"
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                {isExportOpen && (
                  <div className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 z-50">
                    <a
                      href={`/api/months/${currentMonthId}/export/numbers`}
                      download
                      onClick={() => setIsExportOpen(false)}
                      className="block px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                    >
                      Baixar .numbers
                    </a>
                    <a
                      href={`/api/months/${currentMonthId}/export/excel`}
                      download
                      onClick={() => setIsExportOpen(false)}
                      className="block px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                    >
                      Baixar Excel (.xlsx)
                    </a>
                  </div>
                )}
              </div>

              {/* New Month Button */}
              <button
                type="button"
                onClick={onOpenNewMonthModal}
                title="Novo Mês"
                className="p-1.5 sm:px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-bold text-white text-xs shrink-0 flex items-center transition-colors shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Mês</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </header>
  );
};
