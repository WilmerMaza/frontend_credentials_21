import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  Categorias,
  CategorieOptionM,
  ForceOptionM,
  GradesOptionOF,
  GradesOptionSUB,
  GradesOptionOFEjer,
  GradesOptionSUBEjer,
  GradesOptionOFAir,
  GradesOptionSUBAir,
} from '../../interface/options_interfaces';

@Component({
  selector: 'app-militar',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
  ],
  templateUrl: './militar.html',
  styleUrl: './militar.scss',
})
export class Militar implements OnInit {
  @Input({ required: true }) group!: FormGroup;

  readonly forces: ForceOptionM[] = [
    { value: 'armada', label: 'Armada' },
    { value: 'ejercito', label: 'Ejército' },
    { value: 'fuerza_aerea', label: 'Fuerza Aérea' },
  ];

  readonly gradesOFEJ = [
    { value: 'ST', label: 'Subteniente' },
    { value: 'TE', label: 'Teniente Efectivo' },
    { value: 'CT', label: 'Capitan de Infanteria de Marina' },
    { value: 'MY', label: 'Mayor de Infanteria de Marina' },
    { value: 'TC', label: 'Teniente Coronel' },
    { value: 'CR', label: 'Coronel de Infanteria de Marina' },
    { value: 'BG', label: 'Brigadier General' },
    { value: 'MG', label: 'Mayor General' },
    { value: 'GR', label: 'General' },
  ];

  readonly gradesSUBEJ = [
    { value: 'C3', label: 'Cabo Tercero' },
    { value: 'CS', label: 'Cabo Segundo' },
    { value: 'CP', label: 'Cabo Primero' },
    { value: 'SS', label: 'Sargento Segundo' },
    { value: 'SV', label: 'Sargento Viceprimero' },
    { value: 'SP', label: 'Sargento Primero' },
    { value: 'SM', label: 'Sargento Mayor' },
    { value: 'SMC', label: 'Sargento Mayor de Comando' },
  ];

  readonly gradesOFNavy = [
    { value: 'TK/ST', label: 'Teniente de Corbeta' },
    { value: 'TF/TE', label: 'Teniente de Fragata' },
    { value: 'TN/CT', label: 'Teniente de Navio' },
    { value: 'CC/MY', label: 'Capitan de Corbeta' },
    { value: 'CF/TC', label: 'Capitan de Fragata' },
    { value: 'CN/CR', label: 'Capitan de Navio' },
    { value: 'CA/BG', label: 'Contralmirante' },
    { value: 'VC/MG', label: 'Vicealmirante' },
    { value: 'AL/GR', label: 'Almirante' },
  ];

  readonly gradesOFIM = [
    { value: 'TK/ST', label: 'Subteniente' },
    { value: 'TF/TE', label: 'Teniente Efectivo' },
    { value: 'TN/CT', label: 'Capitan de Infanteria de Marina' },
    { value: 'CC/MY', label: 'Mayor de Infanteria de Marina' },
    { value: 'CF/TC', label: 'Teniente Coronel' },
    { value: 'CN/CR', label: 'Coronel de Infanteria de Marina' },
    { value: 'CA/BG', label: 'Brigadier General' },
    { value: 'VC/MG', label: 'Mayor General' },
    { value: 'AL/GR', label: 'General' },
  ];

  readonly gradesSUBNavy = [
    { value: 'MA2/C3', label: 'Marinero Segundo' },
    { value: 'MA1/CS', label: 'Marinero Primero' },
    { value: 'S3/CP', label: 'Suboficial Tercero' },
    { value: 'S2/SS', label: 'Suboficial Segundo' },
    { value: 'S1/SV', label: 'Suboficial Primero' },
    { value: 'SJ/SP', label: 'Suboficial Jefe' },
    { value: 'JT/SM', label: 'Suboficial Jefe Tecnico' },
    { value: 'JTC/SMC', label: 'Suboficial Jefe Tecnico de Comando' },
  ];

  readonly gradesSUBIM = [
    { value: 'MA2/C3', label: 'Cabo Tercero' },
    { value: 'MA1/CS', label: 'Cabo Segundo' },
    { value: 'S3/CP', label: 'Cabo Primero' },
    { value: 'S2/SS', label: 'Sargento Segundo' },
    { value: 'S1/SV', label: 'Sargento Viceprimer' },
    { value: 'SJ/SP', label: 'Sargento Primero' },
    { value: 'JT/SM', label: 'Sargento Mayor' },
    { value: 'JTC/SMC', label: 'Sargento Mayor de Comando' },
  ];

  readonly gradesOFAIR = [
    { value: 'ST', label: 'Subteniente' },
    { value: 'TE', label: 'Teniente Efectivo' },
    { value: 'CT', label: 'Capitan de Infanteria de Marina' },
    { value: 'MY', label: 'Mayor de Infanteria de Marina' },
    { value: 'TC', label: 'Teniente Coronel' },
    { value: 'CR', label: 'Coronel de Infanteria de Marina' },
    { value: 'BG', label: 'Brigadier General' },
    { value: 'MG', label: 'Mayor General' },
    { value: 'GR', label: 'General' },
  ];

  readonly gradesSUBAIR = [
    { value: 'AT', label: 'Aerotecnico' },
    { value: 'T4', label: 'Tecnico cuarto' },
    { value: 'T3', label: 'Tecnico tercero' },
    { value: 'T2', label: 'Tecnico segundo' },
    { value: 'T1', label: 'Tecnico primero' },
    { value: 'TS', label: 'Tecnico subjefe' },
    { value: 'TJ', label: 'Tecnico jefe' },
    { value: 'TJC', label: 'Tecnico jefe de Comando' },
  ];

  //categorias sencillas antes del listado iterado
  readonly CategorieAir: CategorieOptionM[] = [
    { value: 'OfficerAir', label: 'Oficial' },
    { value: 'SubofficerAir', label: 'Suboficialss' },
    { value: 'IMP', label: 'Infante de marina profesional' },
  ];

  readonly CategorieEjercito: CategorieOptionM[] = [
    { value: 'ArmyOfficer', label: 'Oficial' },
    { value: 'ArmySubofficer', label: 'Suboficial' },
    { value: 'IMP', label: 'Infante de marina profesional' },
  ];

  //iteracion listado categorias

  categorieGroups: Categorias[] = [
    {
      name: 'Oficiales',
      categoria: [
        { value: 'OfficerNavy', label: 'Oficial Naval' },
        { value: 'OfficerIM', label: 'Oficial de Infanteria' },
      ],
    },
    {
      name: 'Suboficiales',
      categoria: [
        { value: 'SubofficerNavy', label: 'Suboficial Naval' },
        { value: 'SubofficerIM', label: 'Suboficial de Infanteria' },
      ],
    },
    {
      name: 'IMP',
      categoria: [{ value: 'IMP', label: 'Infante de marina profesional' }],
    },
  ];

  //formularios de control

  forceMCtrl = new FormControl<ForceOptionM['value'] | ''>('', {
    validators: [Validators.required],
  });
  gradesCtrl = new FormControl<string>('', {
    validators: [Validators.required],
  });
  categorieCtrl = new FormControl<CategorieOptionM['value'] | ''>('', {
    validators: [Validators.required],
  });

  //inicializador principal y limpia los campos
  ngOnInit(): void {
    this.group.addControl('force', this.forceMCtrl);
    this.group.addControl('category', this.categorieCtrl);
    this.group.addControl('grades', this.gradesCtrl);

    this.forceMCtrl.valueChanges.subscribe(() => {
      this.categorieCtrl.setValue('');
      this.gradesCtrl.setValue('');
    });

    this.categorieCtrl.valueChanges.subscribe(() => {
      this.gradesCtrl.setValue('');
    });
  }

  //trae los grados segun la categoria
  public getgrades(category: string) {
    switch (category) {
      // ARMADA
      case 'OfficerNavy':
        return this.gradesOFNavy;

      case 'OfficerIM':
        return this.gradesOFIM;

      case 'SubofficerNavy':
        return this.gradesSUBNavy;

      case 'SubofficerIM':
        return this.gradesSUBIM;

      // EJÉRCITO
      case 'ArmyOfficer':
        return this.gradesOFEJ;

      case 'ArmySubofficer':
        return this.gradesSUBEJ;

      // FUERZA AÉREA
      case 'OfficerAir':
        return this.gradesOFAIR;

      case 'SubofficerAir':
        return this.gradesSUBAIR;

      default:
        return [];
    }
  }
 
  public getCategories(force: string): CategorieOptionM[] {

  if (force === 'ejercito') {
    return this.CategorieEjercito;
  }

  if (force === 'fuerza_aerea') {
    return this.CategorieAir;
  }

  return [];
}
}
