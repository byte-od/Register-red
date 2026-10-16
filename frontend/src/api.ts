import { MonthData, MonthListItem, CreateMonthPayload, OverviewStats, RecentAction, UnforeseenReportData } from './types';

const API_BASE = '/api';

export async function fetchMonths(): Promise<MonthListItem[]> {
  const res = await fetch(`${API_BASE}/months`);
  if (!res.ok) throw new Error('Falha ao listar meses');
  return res.json();
}

export async function fetchMonth(monthId: string): Promise<MonthData> {
  const res = await fetch(`${API_BASE}/months/${monthId}`);
  if (!res.ok) throw new Error('Falha ao buscar detalhes do mês');
  return res.json();
}

export async function updateMonth(monthId: string, data: MonthData): Promise<MonthData> {
  const res = await fetch(`${API_BASE}/months/${monthId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao atualizar dados');
  return res.json();
}

export async function toggleItemPaid(monthId: string, itemId: string, paid: boolean) {
  const res = await fetch(`${API_BASE}/months/${monthId}/toggle-paid?item_id=${encodeURIComponent(itemId)}&paid=${paid}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Falha ao alterar status');
  return res.json();
}

export async function toggleItemRecurring(
  monthId: string,
  itemId: string,
  isRecurring: boolean,
  installmentsCurrent?: number,
  installmentsTotal?: number
) {
  let url = `${API_BASE}/months/${monthId}/toggle-recurring?item_id=${encodeURIComponent(itemId)}&is_recurring=${isRecurring}`;
  if (installmentsCurrent !== undefined) {
    url += `&installments_current=${installmentsCurrent}`;
  }
  if (installmentsTotal !== undefined) {
    url += `&installments_total=${installmentsTotal}`;
  }
  const res = await fetch(url, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Falha ao alterar recorrência');
  return res.json();
}

export async function moveItemCategory(
  monthId: string,
  itemId: string,
  targetCategoryId: string,
  isRecurring: boolean = true,
  installmentsCurrent?: number,
  installmentsTotal?: number
) {
  let url = `${API_BASE}/months/${monthId}/move-item?item_id=${encodeURIComponent(itemId)}&target_cat_id=${encodeURIComponent(targetCategoryId)}&is_recurring=${isRecurring}`;
  if (installmentsCurrent !== undefined) {
    url += `&installments_current=${installmentsCurrent}`;
  }
  if (installmentsTotal !== undefined) {
    url += `&installments_total=${installmentsTotal}`;
  }
  const res = await fetch(url, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Falha ao mover item de categoria');
  return res.json();
}


export async function createMonth(payload: CreateMonthPayload): Promise<MonthData> {
  const res = await fetch(`${API_BASE}/months`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Falha ao criar novo mês');
  }
  return res.json();
}

export async function syncToDrive(monthId: string): Promise<{ success: boolean; message: string; file_path?: string }> {
  const res = await fetch(`${API_BASE}/months/${monthId}/sync-drive`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Falha ao sincronizar com Google Drive');
  return res.json();
}

export async function fetchOverviewStats(): Promise<OverviewStats> {
  const res = await fetch(`${API_BASE}/stats/overview`);
  if (!res.ok) throw new Error('Falha ao buscar estatísticas');
  return res.json();
}

export async function fetchRecentActions(limit: number = 8, monthId?: string): Promise<RecentAction[]> {
  const url = `${API_BASE}/recent-actions?limit=${limit}${monthId ? `&month_id=${encodeURIComponent(monthId)}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Falha ao carregar ações recentes');
  const data = await res.json();
  return data.actions || [];
}

export async function fetchUnforeseenReport(monthId?: string): Promise<UnforeseenReportData> {
  const url = `${API_BASE}/reports/unforeseen${monthId ? `?month_id=${encodeURIComponent(monthId)}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Falha ao carregar relatório de gastos imprevistos');
  return res.json();
}

export function getUnforeseenExcelExportUrl(monthId?: string): string {
  return `${API_BASE}/reports/unforeseen/export/excel${monthId ? `?month_id=${encodeURIComponent(monthId)}` : ''}`;
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

export function formatDateShort(dateStr?: string): string {
  if (!dateStr) return '-';
  if (dateStr.includes('-')) {
    const parts = dateStr.split(' ')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
  }
  return dateStr;
}

// --- PUSH NOTIFICATIONS API ---
export async function fetchVapidPublicKey(): Promise<string> {
  const res = await fetch(`${API_BASE}/push/vapid-public-key`);
  if (!res.ok) throw new Error('Falha ao obter chave VAPID');
  const data = await res.json();
  return data.public_key;
}

export async function subscribePush(subscription: any, userAgent?: string): Promise<{ success: boolean; subscriptions_count: number }> {
  const res = await fetch(`${API_BASE}/push/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription, user_agent: userAgent || navigator.userAgent }),
  });
  if (!res.ok) throw new Error('Falha ao cadastrar inscrição push');
  return res.json();
}

export async function unsubscribePush(endpoint: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/push/unsubscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint }),
  });
  if (!res.ok) throw new Error('Falha ao cancelar inscrição push');
  return res.json();
}

export async function testPushNotification(title?: string, body?: string): Promise<{ success: boolean; sent_to_count: number; message: string }> {
  const res = await fetch(`${API_BASE}/push/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body }),
  });
  if (!res.ok) throw new Error('Falha ao disparar notificação de teste');
  return res.json();
}

export async function fetchPushStatus(): Promise<{ subscriptions_count: number; subscriptions: any[] }> {
  const res = await fetch(`${API_BASE}/push/status`);
  if (!res.ok) throw new Error('Falha ao obter status de push');
  return res.json();
}

