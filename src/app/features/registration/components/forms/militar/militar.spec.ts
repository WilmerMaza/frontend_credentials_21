import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Militar } from './militar';

describe('Militar', () => {
  let component: Militar;
  let fixture: ComponentFixture<Militar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Militar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Militar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
