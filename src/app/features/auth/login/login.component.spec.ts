import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';

const mockAuthResponse = { accessToken: 'jwt.token', refreshToken: 0 };

function makeError(status: number): HttpErrorResponse {
  return new HttpErrorResponse({ status, url: '/api/v1/auth/login' });
}

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let mockAuthService: { login: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    mockAuthService = { login: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not submit when form is invalid', () => {
    component.onSubmit();
    expect(mockAuthService.login).not.toHaveBeenCalled();
  });

  it('should navigate to /dashboard on successful login', async () => {
    mockAuthService.login.mockReturnValue(of(mockAuthResponse));
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.loginForm.setValue({ email: 'a@b.com', password: 'secret123' });
    component.onSubmit();

    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
    expect(component.errorMessage()).toBeNull();
  });

  it('sets error message "Cannot reach the server" on status 0', () => {
    mockAuthService.login.mockReturnValue(throwError(() => makeError(0)));
    component.loginForm.setValue({ email: 'a@b.com', password: 'secret123' });
    component.onSubmit();
    expect(component.errorMessage()).toBe('Cannot reach the server. Please try again later.');
  });

  it('sets error message "Invalid credentials" on status 401', () => {
    mockAuthService.login.mockReturnValue(throwError(() => makeError(401)));
    component.loginForm.setValue({ email: 'a@b.com', password: 'secret123' });
    component.onSubmit();
    expect(component.errorMessage()).toBe('Invalid credentials. Please try again.');
  });

  it('sets error message "Invalid credentials" on status 403', () => {
    mockAuthService.login.mockReturnValue(throwError(() => makeError(403)));
    component.loginForm.setValue({ email: 'a@b.com', password: 'secret123' });
    component.onSubmit();
    expect(component.errorMessage()).toBe('Invalid credentials. Please try again.');
  });

  it('sets error message "under maintenance" on status 500', () => {
    mockAuthService.login.mockReturnValue(throwError(() => makeError(500)));
    component.loginForm.setValue({ email: 'a@b.com', password: 'secret123' });
    component.onSubmit();
    expect(component.errorMessage()).toBe('The system is under maintenance. Please try again later.');
  });

  it('sets generic error message for non-HttpErrorResponse errors', () => {
    mockAuthService.login.mockReturnValue(throwError(() => new Error('Network failure')));
    component.loginForm.setValue({ email: 'a@b.com', password: 'secret123' });
    component.onSubmit();
    expect(component.errorMessage()).toBe('An unexpected error occurred.');
  });

  it('renders the error banner in the DOM when errorMessage is set', () => {
    mockAuthService.login.mockReturnValue(throwError(() => makeError(0)));
    component.loginForm.setValue({ email: 'a@b.com', password: 'secret123' });
    component.onSubmit();
    fixture.detectChanges();

    const banner = fixture.debugElement.query(By.css('[role="alert"] p'));
    expect(banner.nativeElement.textContent).toContain('Cannot reach the server');
  });

  it('clears error message on a new submission attempt', () => {
    mockAuthService.login
      .mockReturnValueOnce(throwError(() => makeError(401)))
      .mockReturnValueOnce(of(mockAuthResponse));

    component.loginForm.setValue({ email: 'a@b.com', password: 'secret123' });

    component.onSubmit();
    expect(component.errorMessage()).not.toBeNull();

    component.onSubmit();
    expect(component.errorMessage()).toBeNull();
  });
});
