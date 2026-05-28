import { api } from './client';
import type { UserSummary } from './listings';

export interface Message {
  id: string;
  offerId: string;
  sender: UserSummary;
  body: string;
  createdAt: string;
}

export interface MessagePage {
  items: Message[];
  total: number;
}

export function getMessages(offerId: string): Promise<MessagePage> {
  return api<MessagePage>(`/offers/${offerId}/messages`);
}

export function postMessage(offerId: string, body: string): Promise<Message> {
  return api<Message>(`/offers/${offerId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}
