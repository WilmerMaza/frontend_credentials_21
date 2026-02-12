import { TestBed } from '@angular/core/testing';
import { EnapApi } from './enap.api';

describe('EnapApi', () => {
  let service: EnapApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnapApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
