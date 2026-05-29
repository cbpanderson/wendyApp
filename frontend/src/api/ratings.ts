import { api } from './client';
import type { UserSummary } from './listings';

export interface Rating {
  id: string;
  dealId: string;
  rater: UserSummary;
  ratee: UserSummary;
  stars: number;
  review: string | null;
  createdAt: string;
}

export interface RatingPage {
  items: Rating[];
  total: number;
  averageStars: number | null;
}

export function submitRating(
  dealId: string,
  stars: number,
  review?: string
): Promise<Rating> {
  return api<Rating>(`/deals/${dealId}/ratings`, {
    method: 'POST',
    body: JSON.stringify({ stars, review: review ?? null }),
  });
}

export function getRatingsForUser(handle: string): Promise<RatingPage> {
  return api<RatingPage>(`/users/${encodeURIComponent(handle)}/ratings`);
}
