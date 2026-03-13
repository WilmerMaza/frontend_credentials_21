import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CourseOption, ForceOptionInter } from '../../interface/options_interfaces';

@Component({
  selector: 'app-inter-escuelas',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
  ],
  templateUrl: './inter-escuelas.html',
  styleUrl: './inter-escuelas.scss',
})
export class InterEscuelas implements OnInit {
  @Input({ required: true }) group!: FormGroup;

  readonly forces: ForceOptionInter[] = [
    { value: 'armada', label: 'Armada' },
    { value: 'ejercito', label: 'Ejército' },
    { value: 'fuerza_aerea', label: 'Fuerza Aérea' },
    { value: 'policia_nacional', label: 'Policía Nacional' },
  ];

  readonly courses: CourseOption[] = [
    { value: '1', label: '1 año' },
    { value: '2', label: '2 año' },
    { value: '3', label: '3 año' },
    { value: '4', label: '4 año' },
  ];

  forceCtrl = new FormControl<ForceOptionInter['value'] | ''>('', { validators: [Validators.required] });
  sportCtrl = new FormControl('', { nonNullable: true, validators: [Validators.required] });
  courseCtrl = new FormControl<CourseOption['value'] | ''>('', {
    validators: [Validators.required],
  });

  ngOnInit(): void {
    this.group.addControl('force', this.forceCtrl);
    this.group.addControl('sport', this.sportCtrl);
    this.group.addControl('course', this.courseCtrl);
  }
}
