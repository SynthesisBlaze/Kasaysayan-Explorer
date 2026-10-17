import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FiguresPage } from './figures.page';


describe('FiguresPage', () => {
  let component: FiguresPage;
  let fixture: ComponentFixture<FiguresPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FiguresPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
