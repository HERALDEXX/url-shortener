export interface URLStats {
  shortCode: string;
  originalUrl: string;
  clickCount: number;
}

export interface User {
  id: number;
  username: string;
  is_staff: boolean;
  is_superuser: boolean;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface ShortenResponse {
  shortCode: string;
  originalUrl: string;
  shortUrl?: string;
  message?: string;
}
