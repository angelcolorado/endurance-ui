import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

const dummyRoute = {} as ActivatedRouteSnapshot;
const dummyState = { url: '/dashboard' } as RouterStateSnapshot;

function buildTestBed(platformId: 'browser' | 'server') {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
      { provide: PLATFORM_ID, useValue: platformId },
    ],
  });
}

function runGuard() {
  return TestBed.runInInjectionContext(() => authGuard(dummyRoute, dummyState));
}

describe('authGuard — browser platform', () => {
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    buildTestBed('browser');
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => localStorage.clear());

  it('should allow activation when user is authenticated', () => {
    vi.spyOn(authService, 'isAuthenticated', 'get').mockReturnValue(true);
    expect(runGuard()).toBe(true);
  });

  it('should redirect to /login when user is not authenticated', () => {
    vi.spyOn(authService, 'isAuthenticated', 'get').mockReturnValue(false);
    expect(runGuard()).toEqual(router.createUrlTree(['/login']));
  });
});

describe('authGuard — server platform (SSR)', () => {
  beforeEach(() => buildTestBed('server'));

  it('should allow activation unconditionally to avoid premature SSR redirect', () => {
    expect(runGuard()).toBe(true);
  });
});
