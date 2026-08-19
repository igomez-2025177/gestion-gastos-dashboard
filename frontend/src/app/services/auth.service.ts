import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { SessionExpiredService } from './session-expired.service';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3000/api/auth';
  private readonly TOKEN_KEY = 'gestion_token';
  private expiryTimer: ReturnType<typeof setTimeout> | null = null;

  currentUser = signal<User | null>(null);

  constructor(
    private http: HttpClient,
    private sessionExpiredService: SessionExpiredService
  ) {
    const savedUser = localStorage.getItem('gestion_user');
    if (savedUser) {
      this.currentUser.set(JSON.parse(savedUser));
    }

    const token = this.getToken();
    if (token) {
      this.scheduleExpiryCheck(token);
    }
  }

  register(name: string, email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/register`, { name, email, password })
      .pipe(tap((response) => this.saveSession(response)));
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/login`, { email, password })
      .pipe(tap((response) => this.saveSession(response)));
  }

  getMe(): Observable<{ user: User }> {
    return this.http.get<{ user: User }>(`${this.API_URL}/me`);
  }

  logout(): void {
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem('gestion_user');
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private saveSession(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    localStorage.setItem('gestion_user', JSON.stringify(response.user));
    this.currentUser.set(response.user);
    this.scheduleExpiryCheck(response.token);
  }

  private scheduleExpiryCheck(token: string): void {
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }

    const payload = this.decodeToken(token);
    if (!payload?.exp) return;

    const expiresAtMs = payload.exp * 1000;
    const msRemaining = expiresAtMs - Date.now();

    if (msRemaining <= 0) {
      this.handleExpiration();
      return;
    }

    this.expiryTimer = setTimeout(() => this.handleExpiration(), msRemaining);
  }

  private handleExpiration(): void {
    if (!this.isLoggedIn()) return;
    this.logout();
    this.sessionExpiredService.trigger();
  }

  private decodeToken(token: string): { exp?: number } | null {
    try {
      const payloadBase64 = token.split('.')[1];
      const normalized = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(normalized)
          .split('')
          .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
          .join('')
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  }
}