import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TefeulPage } from './tefeul.page';

describe('TefeulPage', () => {
  let component: TefeulPage;
  let fixture: ComponentFixture<TefeulPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TefeulPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
