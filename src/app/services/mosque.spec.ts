import { TestBed } from '@angular/core/testing';

import { Mosque } from './mosque';

describe('Mosque', () => {
  let service: Mosque;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Mosque);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
