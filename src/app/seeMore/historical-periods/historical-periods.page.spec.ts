import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistoricalPeriodsPage } from './historical-periods.page';

describe('HistoricalPeriodsPage', () => {
  let component: HistoricalPeriodsPage;
  let fixture: ComponentFixture<HistoricalPeriodsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HistoricalPeriodsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
