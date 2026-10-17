import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistoricalFiguresPage } from './historical-figures.page';

describe('HistoricalFiguresPage', () => {
  let component: HistoricalFiguresPage;
  let fixture: ComponentFixture<HistoricalFiguresPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HistoricalFiguresPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
