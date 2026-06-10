import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest } from '../models/auth.model';

const TOKEN_KEY = 'auth_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiUrl = 'http://localhost:8080/api/v1/auth/login';

  private readonly _isLoggedIn$ = new BehaviorSubject<boolean>(
    isPlatformBrowser(this.platformId)
      ? !!localStorage.getItem(TOKEN_KEY)
      : false
  );
  readonly isLoggedIn$ = this._isLoggedIn$.asObservable();

  get isAuthenticated(): boolean {
    return this._isLoggedIn$.getValue();
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.apiUrl, credentials).pipe(
      tap((response) => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem(TOKEN_KEY, response.accessToken);
        }
        this._isLoggedIn$.next(true);
      })
    );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(TOKEN_KEY);
    }
    this._isLoggedIn$.next(false);
    this.router.navigate(['/login']);
  }
}
