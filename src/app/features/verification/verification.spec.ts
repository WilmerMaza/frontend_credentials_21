import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Verification } from './verification';

describe('Verification', () => {
  let component: Verification;
  let fixture: ComponentFixture<Verification>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Verification]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Verification);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
