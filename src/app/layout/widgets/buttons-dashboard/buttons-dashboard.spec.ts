import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ButtonsDashboard } from './buttons-dashboard';

describe('ButtonsDashboard', () => {
  let component: ButtonsDashboard;
  let fixture: ComponentFixture<ButtonsDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonsDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ButtonsDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
