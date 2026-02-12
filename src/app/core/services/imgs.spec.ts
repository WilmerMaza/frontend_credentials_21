import { TestBed } from '@angular/core/testing';

import { Imgs } from './imgs';

describe('Imgs', () => {
  let service: Imgs;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Imgs);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
