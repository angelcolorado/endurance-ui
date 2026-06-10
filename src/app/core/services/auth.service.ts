import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/v1/auth/login';

  private readonly _isLoggedIn$ = new BehaviorSubject<boolean>(false);
  readonly isLoggedIn$ = this._isLoggedIn$.asObservable();

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.apiUrl, credentials).pipe(
      tap(() => this._isLoggedIn$.next(true))
    );
  }

  logout(): void {
    this._isLoggedIn$.next(false);
  }
}
