import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReligiousContentPage } from './religious-content.page';

describe('ReligiousContentPage', () => {
  let component: ReligiousContentPage;
  let fixture: ComponentFixture<ReligiousContentPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ReligiousContentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
