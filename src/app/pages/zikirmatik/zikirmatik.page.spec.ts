import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ZikirmatikPage } from './zikirmatik.page';

describe('ZikirmatikPage', () => {
  let component: ZikirmatikPage;
  let fixture: ComponentFixture<ZikirmatikPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ZikirmatikPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
