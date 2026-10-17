import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuizMenuPage } from './quizMenu.page';

describe('QuizMenuPage', () => {
  let component: QuizMenuPage;
  let fixture: ComponentFixture<QuizMenuPage>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(QuizMenuPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
