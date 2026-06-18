import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';
import { EventLogisticsComponent } from './event-logistics.component';
import { CorralsResponse } from '../../../../core/models/logistics.model';

const API_URL = 'http://localhost:8080/api/v1/events/evt-42/corrals';

const MOCK_RESPONSE: CorralsResponse = {
  eventId: 'evt-42',
  eventName: 'Test Marathon',
  corralsByDistance: {
    MARATHON: [
      {
        corralId: 'c-1', corralName: 'Corral A', order: 1,
        minTime: null, maxTime: 'PT10800S',
        maxCapacity: 500, registeredCount: 320,
        isParaAthleteCorral: false, isRestricted: false,
      },
      {
        corralId: 'c-2', corralName: 'Corral B — Para', order: 2,
        minTime: 'PT10800S', maxTime: 'PT14400S',
        maxCapacity: 50, registeredCount: 12,
        isParaAthleteCorral: true, isRestricted: false,
      },
    ],
  },
};

function buildActivatedRoute(eventId: string) {
  return {
    paramMap: of(new Map([['eventId', eventId]])),
  };
}

describe('EventLogisticsComponent', () => {
  let fixture: ComponentFixture<EventLogisticsComponent>;
  let component: EventLogisticsComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventLogisticsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: buildActivatedRoute('evt-42') },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventLogisticsComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('should create', () => expect(component).toBeTruthy());

  it('should be in loading state initially', () => {
    expect(component.state().status).toBe('loading');
    httpMock.expectOne(API_URL).flush(MOCK_RESPONSE);
  });

  it('should transition to loaded state after HTTP response', () => {
    httpMock.expectOne(API_URL).flush(MOCK_RESPONSE);
    expect(component.state().status).toBe('loaded');
  });

  it('should set error state on HTTP failure', () => {
    httpMock.expectOne(API_URL).flush('error', { status: 500, statusText: 'Server Error' });
    expect(component.state().status).toBe('error');
  });

  it('hasAnyCorrals should return true when corrals exist', () => {
    httpMock.expectOne(API_URL).flush(MOCK_RESPONSE);
    expect(component.hasAnyCorrals()).toBe(true);
  });

  it('hasAnyCorrals should return false for empty corralsByDistance', () => {
    httpMock.expectOne(API_URL).flush({ ...MOCK_RESPONSE, corralsByDistance: {} });
    expect(component.hasAnyCorrals()).toBe(false);
  });

  it('corralsFor should return MARATHON corrals', () => {
    httpMock.expectOne(API_URL).flush(MOCK_RESPONSE);
    expect(component.corralsFor('MARATHON').length).toBe(2);
  });

  it('corralsFor should return empty array for distance with no corrals', () => {
    httpMock.expectOne(API_URL).flush(MOCK_RESPONSE);
    expect(component.corralsFor('TEN_K')).toEqual([]);
  });

  it('should render one app-corral-card per corral', () => {
    httpMock.expectOne(API_URL).flush(MOCK_RESPONSE);
    fixture.detectChanges();
    const cards = fixture.debugElement.queryAll(By.css('app-corral-card'));
    expect(cards.length).toBe(2);
  });

  it('should render empty state when no corrals', () => {
    httpMock.expectOne(API_URL).flush({ ...MOCK_RESPONSE, corralsByDistance: {} });
    fixture.detectChanges();
    const empty = fixture.debugElement.query(By.css('h2'));
    expect(empty?.nativeElement.textContent).toContain('No corrals configured yet');
  });
});
