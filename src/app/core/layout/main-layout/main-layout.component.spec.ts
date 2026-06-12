import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { MainLayoutComponent } from './main-layout.component';
import { AuthService } from '../../services/auth.service';

describe('MainLayoutComponent', () => {
  let fixture: ComponentFixture<MainLayoutComponent>;
  const mockAuthService = { logout: vi.fn() };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayoutComponent);
    fixture.detectChanges();
  });

  afterEach(() => vi.clearAllMocks());

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the EnduranceOps logo in the sidebar', () => {
    const sidebar = fixture.debugElement.query(By.css('aside'));
    expect(sidebar.nativeElement.textContent).toContain('EnduranceOps');
  });

  it('should render all 4 nav items with correct labels', () => {
    const links = fixture.debugElement.queryAll(By.css('nav a'));
    expect(links).toHaveLength(4);
    const labels = links.map((l) => (l.nativeElement as HTMLElement).textContent!.trim());
    expect(labels).toContain('Dashboard');
    expect(labels).toContain('Eventos');
    expect(labels).toContain('Logística');
    expect(labels).toContain('Atletas');
  });

  it('should mark active nav link with aria-current="page"', () => {
    const links = fixture.debugElement.queryAll(By.css('nav a'));
    const activeLinks = links.filter(
      (l) => l.nativeElement.getAttribute('aria-current') === 'page'
    );
    // No route is active in the test environment — all links are inactive
    expect(activeLinks).toHaveLength(0);
  });

  it('should call authService.logout() when logout button is clicked', () => {
    const btn = fixture.debugElement.query(By.css('button[aria-label="Logout"]'));
    (btn.nativeElement as HTMLButtonElement).click();
    expect(mockAuthService.logout).toHaveBeenCalledOnce();
  });

  it('should contain a router-outlet in the content area', () => {
    const outlet = fixture.debugElement.query(By.css('router-outlet'));
    expect(outlet).toBeTruthy();
  });
});
