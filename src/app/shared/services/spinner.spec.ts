import { TestBed } from '@angular/core/testing';
import { Spinner } from '../components/spinner/spinner';



describe('Spinner', () => {
  let service: Spinner;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Spinner);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
