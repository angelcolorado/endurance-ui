import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { AuthService } from './auth.service';
import { AuthResponse, LoginRequest } from '../models/auth.model';

const API_URL = 'http://localhost:8080/api/v1/auth/login';

const mockCredentials: LoginRequest = { email: 'athlete@enduranceops.com', password: 'secret123' };
const mockResponse: AuthResponse = { accessToken: 'jwt.token.here', refreshToken: 3600 };

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should initialize as logged out when localStorage is empty', () => {
    let state: boolean | undefined;
    service.isLoggedIn$.subscribe((v) => (state = v));
    expect(state).toBe(false);
  });

  it('should initialize as logged in when token exists in localStorage', () => {
    localStorage.setItem('auth_token', 'existing.token');

    // Re-instantiate so the BehaviorSubject reads the pre-seeded token
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    const freshService = TestBed.inject(AuthService);

    let state: boolean | undefined;
    freshService.isLoggedIn$.subscribe((v) => (state = v));
    expect(state).toBe(true);
  });

  it('should POST credentials, persist token, and emit true on successful login', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    let emittedState: boolean | undefined;

    service.isLoggedIn$.subscribe((v) => (emittedState = v));
    service.login(mockCredentials).subscribe();

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockCredentials);
    req.flush(mockResponse);

    expect(setItemSpy).toHaveBeenCalledWith('auth_token', mockResponse.accessToken);
    expect(emittedState).toBe(true);
  });

  it('should clear token, emit false, and redirect to /login on logout', async () => {
    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
    const navigateSpy = vi.spyOn(router, 'navigate');

    // Seed a logged-in state
    service.login(mockCredentials).subscribe();
    httpMock.expectOne(API_URL).flush(mockResponse);

    service.logout();

    expect(removeItemSpy).toHaveBeenCalledWith('auth_token');
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);

    let state: boolean | undefined;
    service.isLoggedIn$.subscribe((v) => (state = v));
    expect(state).toBe(false);
  });
});
