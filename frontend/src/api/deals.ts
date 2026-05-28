import { api } from './client';
import type { Deal } from './offers';

export type { Deal } from './offers';

export interface DealPage {
  items: Deal[];
  total: number;
}

export function getMyDeals(): Promise<DealPage> {
  return api<DealPage>('/me/deals');
}

export function getDeal(id: string): Promise<Deal> {
  return api<Deal>(`/deals/${id}`);
}

export function markComplete(id: string): Promise<Deal> {
  return api<Deal>(`/deals/${id}/mark-complete`, { method: 'POST' });
}

export function cancelDeal(id: string): Promise<Deal> {
  return api<Deal>(`/deals/${id}/cancel`, { method: 'POST' });
}
