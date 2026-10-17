import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PeriodsPage } from './periods.page';


describe('PeriodsPage', () => {
  let component: PeriodsPage;
  let fixture: ComponentFixture<PeriodsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PeriodsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
