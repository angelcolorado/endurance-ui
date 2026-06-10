import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { jwtInterceptor } from './jwt.interceptor';
import { AuthService } from '../services/auth.service';

const TEST_URL = '/api/v1/athletes';
const MOCK_TOKEN = 'mock.jwt.token';

describe('jwtInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should attach Authorization header when token exists in localStorage', () => {
    localStorage.setItem('auth_token', MOCK_TOKEN);

    http.get(TEST_URL).subscribe();

    const req = httpMock.expectOne(TEST_URL);
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${MOCK_TOKEN}`);
    req.flush({});
  });

  it('should not attach Authorization header when localStorage is empty', () => {
    http.get(TEST_URL).subscribe();

    const req = httpMock.expectOne(TEST_URL);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should call authService.logout() and propagate the error on 401', () => {
    localStorage.setItem('auth_token', MOCK_TOKEN);
    const logoutSpy = vi.spyOn(authService, 'logout').mockImplementation(() => {});
    let caughtError: unknown;

    http.get(TEST_URL).subscribe({ error: (e) => (caughtError = e) });

    httpMock.expectOne(TEST_URL).flush('Unauthorized', {
      status: 401,
      statusText: 'Unauthorized',
    });

    expect(logoutSpy).toHaveBeenCalledTimes(1);
    expect((caughtError as { status: number }).status).toBe(401);
  });

  it('should NOT call logout() on non-401 errors', () => {
    const logoutSpy = vi.spyOn(authService, 'logout').mockImplementation(() => {});

    http.get(TEST_URL).subscribe({ error: () => {} });

    httpMock.expectOne(TEST_URL).flush('Server Error', {
      status: 500,
      statusText: 'Internal Server Error',
    });

    expect(logoutSpy).not.toHaveBeenCalled();
  });
});
