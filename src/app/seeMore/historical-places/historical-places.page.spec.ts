import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistoricalPlacesPage } from './historical-places.page';

describe('HistoricalPlacesPage', () => {
  let component: HistoricalPlacesPage;
  let fixture: ComponentFixture<HistoricalPlacesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HistoricalPlacesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
