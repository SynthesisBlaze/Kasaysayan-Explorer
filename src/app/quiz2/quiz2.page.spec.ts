import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Quiz2Page } from './quiz2.page';

describe('Quiz2Page', () => {
  let component: Quiz2Page;
  let fixture: ComponentFixture<Quiz2Page>;

  beforeEach(() => {
    fixture = TestBed.createComponent(Quiz2Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
