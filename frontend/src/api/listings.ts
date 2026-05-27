import { api, ApiError } from './client';

export type OfferType = 'TRADE_ONLY' | 'GIFT_ONLY' | 'EITHER';
export type ListingStatus = 'ACTIVE' | 'PAUSED' | 'DELETED';

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface UserSummary {
  handle: string;
  averageStars: number | null;
  ratingCount: number;
}

export interface ListingPhoto {
  id: string;
  url: string;
  position: number;
}

export interface Listing {
  id: string;
  owner: UserSummary;
  category: Category;
  title: string;
  description: string;
  offerType: OfferType;
  status: ListingStatus;
  photos: ListingPhoto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateListingRequest {
  categoryId: string;
  title: string;
  description: string;
  offerType: OfferType;
}

export interface UpdateListingRequest {
  categoryId?: string;
  title?: string;
  description?: string;
  offerType?: OfferType;
  status?: 'ACTIVE' | 'PAUSED';
}

export interface ListingPage {
  items: Listing[];
  total: number;
}

export function getCategories(): Promise<Category[]> {
  return api<Category[]>('/categories');
}

export function getMyListings(limit = 20, offset = 0): Promise<ListingPage> {
  return api<ListingPage>(`/me/listings?limit=${limit}&offset=${offset}`);
}

export interface BrowseFilters {
  categoryId?: string;
  q?: string;
  offerType?: OfferType;
  limit?: number;
  offset?: number;
}

export function browseListings(filters: BrowseFilters = {}): Promise<ListingPage> {
  const params = new URLSearchParams();
  if (filters.categoryId) params.set('categoryId', filters.categoryId);
  if (filters.q && filters.q.trim()) params.set('q', filters.q.trim());
  if (filters.offerType) params.set('offerType', filters.offerType);
  params.set('limit', String(filters.limit ?? 20));
  params.set('offset', String(filters.offset ?? 0));
  return api<ListingPage>(`/listings?${params.toString()}`);
}

export function getListing(id: string): Promise<Listing> {
  return api<Listing>(`/listings/${id}`);
}

export function createListing(body: CreateListingRequest): Promise<Listing> {
  return api<Listing>('/listings', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateListing(id: string, body: UpdateListingRequest): Promise<Listing> {
  return api<Listing>(`/listings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function deleteListing(id: string): Promise<void> {
  return api<void>(`/listings/${id}`, { method: 'DELETE' });
}

/**
 * Uploads a photo. Uses fetch directly because the shared `api()` always sets
 * Content-Type: application/json — for multipart we let the browser set it.
 */
export async function uploadPhoto(
  listingId: string,
  file: File,
  position: 0 | 1
): Promise<ListingPhoto> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('position', String(position));

  const TOKEN_KEY = 'wendyapp.jwt';
  const raw = sessionStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {};
  if (raw) {
    try {
      const t = JSON.parse(raw) as { token: string };
      headers['Authorization'] = `Bearer ${t.token}`;
    } catch {
      /* ignore */
    }
  }
  const res = await fetch(`/api/v1/listings/${listingId}/photos`, {
    method: 'POST',
    body: fd,
    headers,
  });
  if (res.status === 201) return (await res.json()) as ListingPhoto;
  const body = await res.json().catch(() => ({}));
  const err = (body as { error?: { code?: string; message?: string } }).error;
  throw new ApiError(res.status, err?.code ?? 'UNKNOWN', err?.message ?? 'Photo upload failed');
}

export function deletePhoto(listingId: string, photoId: string): Promise<void> {
  return api<void>(`/listings/${listingId}/photos/${photoId}`, { method: 'DELETE' });
}
