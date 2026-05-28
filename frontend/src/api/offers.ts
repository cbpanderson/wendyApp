import { api } from './client';
import type { Listing, UserSummary } from './listings';

export type OfferKind = 'TRADE' | 'GIFT_REQUEST';
export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN';
export type DealStatus =
  | 'ACCEPTED'
  | 'COMPLETED_BY_A'
  | 'COMPLETED_BY_B'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Offer {
  id: string;
  listing: Listing;
  fromUser: UserSummary;
  toUser: UserSummary;
  offerType: OfferKind;
  offeredListing: Listing | null;
  message: string | null;
  status: OfferStatus;
  createdAt: string;
  respondedAt: string | null;
}

export interface Deal {
  id: string;
  offerId: string;
  dealType: 'TRADE' | 'GIFT';
  participantA: UserSummary;
  participantB: UserSummary;
  listingA: Listing;
  listingB: Listing | null;
  status: DealStatus;
  acceptedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelledByUserId: string | null;
}

export interface CreateOfferRequest {
  offerType: OfferKind;
  offeredListingId?: string | null;
  message?: string;
}

export interface OfferPage {
  items: Offer[];
  total: number;
}

export function createOffer(listingId: string, body: CreateOfferRequest): Promise<Offer> {
  return api<Offer>(`/listings/${listingId}/offers`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export type OfferDirection = 'sent' | 'received';

export function getMyOffers(
  direction: OfferDirection,
  opts: { status?: OfferStatus; limit?: number; offset?: number } = {}
): Promise<OfferPage> {
  const params = new URLSearchParams();
  params.set('direction', direction);
  if (opts.status) params.set('status', opts.status);
  params.set('limit', String(opts.limit ?? 20));
  params.set('offset', String(opts.offset ?? 0));
  return api<OfferPage>(`/me/offers?${params.toString()}`);
}

export function getOffer(id: string): Promise<Offer> {
  return api<Offer>(`/offers/${id}`);
}

export function acceptOffer(id: string): Promise<Deal> {
  return api<Deal>(`/offers/${id}/accept`, { method: 'POST' });
}

export function declineOffer(id: string): Promise<Offer> {
  return api<Offer>(`/offers/${id}/decline`, { method: 'POST' });
}

export function withdrawOffer(id: string): Promise<Offer> {
  return api<Offer>(`/offers/${id}/withdraw`, { method: 'POST' });
}
