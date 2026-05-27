import { api } from './client';

export interface RegisterRequest {
  email: string;
  password: string;
  handle: string;
  zipCode: string;
  bio?: string;
  confirmedAdult: boolean;
}

export interface UserResponse {
  id: string;
  email: string;
  handle: string;
  bio: string | null;
  zipCode: string;
  averageStars: number | null;
  ratingCount: number;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: UserResponse;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateMeRequest {
  bio?: string;
}

export interface PublicProfileResponse {
  handle: string;
  bio: string | null;
  zipCode: string;
  averageStars: number | null;
  ratingCount: number;
  memberSince: string;
  activeListings: unknown[];
}

export function register(body: RegisterRequest): Promise<AuthResponse> {
  return api<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function login(body: LoginRequest): Promise<AuthResponse> {
  return api<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function getMe(): Promise<UserResponse> {
  return api<UserResponse>('/me');
}

export function updateMe(body: UpdateMeRequest): Promise<UserResponse> {
  return api<UserResponse>('/me', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function getPublicProfile(handle: string): Promise<PublicProfileResponse> {
  return api<PublicProfileResponse>(`/users/${encodeURIComponent(handle)}`);
}
