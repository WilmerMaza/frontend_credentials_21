import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterEscuelas } from './inter-escuelas';

describe('InterEscuelas', () => {
  let component: InterEscuelas;
  let fixture: ComponentFixture<InterEscuelas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterEscuelas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InterEscuelas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
