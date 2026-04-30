import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DreamInterpretationPage } from './dream-interpretation.page';

describe('DreamInterpretationPage', () => {
  let component: DreamInterpretationPage;
  let fixture: ComponentFixture<DreamInterpretationPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DreamInterpretationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
