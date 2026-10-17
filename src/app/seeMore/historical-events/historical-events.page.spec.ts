import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistoricalEventsPage } from './historical-events.page';

describe('HistoricalEventsPage', () => {
  let component: HistoricalEventsPage;
  let fixture: ComponentFixture<HistoricalEventsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HistoricalEventsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
