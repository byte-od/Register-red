import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, Cloud, RefreshCw, PlusCircle, Download, 
  BarChart3, Moon, Sun, Table, FileSpreadsheet, Tablet, ChevronDown
} from 'lucide-react';
import { MonthListItem } from '../types';

interface NavbarProps {
  months: MonthListItem[];
  currentMonthId: string;
  onSelectMonth: (id: string) => void;
  onOpenNewMonthModal: () => void;
  onOpenTabletModal: () => void;
  onSyncDrive: () => void;
  isSyncing: boolean;
  activeTab: 'month' | 'history';
  onTabChange: (tab: 'month' | 'history') => void;
  isDark: boolean;
  onToggleDark: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  months,
  currentMonthId,
  onSelectMonth,
  onOpenNewMonthModal,
  onOpenTabletModal,
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
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        
        {/* DESKTOP & TABLET LAYOUT (>= sm / 640px): Clean single row */}
        <div className="hidden sm:flex items-center justify-between h-16 gap-2 lg:gap-4">
          
          {/* Brand & Title */}
          <div className="flex items-center space-x-2.5 shrink-0">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5 md:space-x-2">
                <span className="font-bold text-base md:text-lg text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
                  Gestão Numbers
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] md:text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 shrink-0">
                  <Cloud className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1" />
                  <span className="hidden md:inline">Google </span>Drive
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden xl:block">
                Sincronizado diretamente com seus arquivos .numbers
              </p>
            </div>
          </div>

          {/* Interactive Controls Bar */}
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            
            {/* View Mode Tabs (Mês vs Histórico) */}
            <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
              <button
                type="button"
                onClick={() => onTabChange('month')}
                title="Visualizar Mês Atual"
                className={`flex items-center px-2 md:px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'month'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Table className="w-3.5 h-3.5 md:mr-1" />
                <span className="hidden md:inline">Mês</span>
              </button>
              <button
                type="button"
                onClick={() => onTabChange('history')}
                title="Histórico e Comparativos"
                className={`flex items-center px-2 md:px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'history'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 md:mr-1" />
                <span className="hidden md:inline">Histórico</span>
              </button>
            </div>

            {/* Month Select Dropdown */}
            <div className="relative shrink-0">
              <select
                value={currentMonthId}
                onChange={(e) => onSelectMonth(e.target.value)}
                className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold text-xs md:text-sm rounded-xl pl-7 pr-7 py-1.5 md:py-2 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer shadow-xs max-w-[125px] md:max-w-[160px] truncate"
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
              title="Salvar e atualizar arquivo .numbers no Google Drive"
              className="inline-flex items-center justify-center p-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-500' : ''}`} />
              <span className="hidden xl:inline ml-1.5">Sincronizar</span>
            </button>

            {/* New Month Button */}
            <button
              type="button"
              onClick={onOpenNewMonthModal}
              title="Criar próxima planilha mensal"
              className="inline-flex items-center justify-center px-2.5 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5 md:mr-1.5" />
              <span className="hidden md:inline">+ Novo Mês</span>
              <span className="md:hidden font-bold">+ Novo</span>
            </button>

            {/* Tablet Access Button */}
            <button
              type="button"
              onClick={onOpenTabletModal}
              title="Acessar no Tablet ou Celular via Wi-Fi (QR Code)"
              className="inline-flex items-center justify-center p-2 lg:px-2.5 lg:py-2 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors shadow-xs shrink-0"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span className="hidden lg:inline ml-1">Tablet</span>
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

        {/* MOBILE LAYOUT (< sm / 640px): 2 clean rows that never break */}
        <div className="sm:hidden py-2 space-y-2">
          
          {/* Mobile Row 1: Brand & Device/Theme Shortcuts */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xs shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
                Gestão Numbers
              </span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                <Cloud className="w-2.5 h-2.5 mr-0.5" />
                Drive
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={onOpenTabletModal}
                title="Acessar no Tablet"
                className="p-1.5 rounded-lg text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800"
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onToggleDark}
                title={isDark ? "Modo Claro" : "Modo Escuro"}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Mobile Row 2: Tabs, Month Select, and Quick Actions */}
          <div className="flex items-center justify-between gap-1.5">
            {/* View Tabs */}
            <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
              <button
                type="button"
                onClick={() => onTabChange('month')}
                className={`p-1.5 rounded-md text-xs font-semibold ${
                  activeTab === 'month'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onTabChange('history')}
                className={`p-1.5 rounded-md text-xs font-semibold ${
                  activeTab === 'history'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Month Select */}
            <div className="relative flex-1 min-w-0">
              <select
                value={currentMonthId}
                onChange={(e) => onSelectMonth(e.target.value)}
                className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold text-xs rounded-lg pl-6 pr-6 py-1.5 truncate"
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

            {/* Sync */}
            <button
              type="button"
              onClick={onSyncDrive}
              disabled={isSyncing}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-500' : 'text-slate-700 dark:text-slate-300'}`} />
            </button>

            {/* Export */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsExportOpen(!isExportOpen)}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 text-slate-700 dark:text-slate-300"
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

            {/* New Month */}
            <button
              type="button"
              onClick={onOpenNewMonthModal}
              className="p-1.5 px-2 rounded-lg bg-emerald-600 font-bold text-white text-xs shrink-0 flex items-center"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1" />
              <span>Mês</span>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
