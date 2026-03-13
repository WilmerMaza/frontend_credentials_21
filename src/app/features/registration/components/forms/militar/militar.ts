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
  ];

  readonly gradesSUBEJ = [
    { value: 'C3', label: 'Cabo Tercero' },
    { value: 'CS', label: 'Cabo Segundo' },
    { value: 'CP', label: 'Cabo Primero' },
    { value: 'SS', label: 'Sargento Segundo' },
    { value: 'SV', label: 'Sargento Viceprimer' },
    { value: 'SP', label: 'Sargento Primero' },
    { value: 'SM', label: 'Sargento Mayor' },
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
  ];

  readonly gradesOFIM = [
    { value: 'TK/ST', label: 'Subteniente' },
    { value: 'TF/TE', label: 'Teniente Efectivo' },
    { value: 'TN/CT', label: 'Capitan de Infanteria de Marina' },
    { value: 'CC/MY', label: 'Mayor de Infanteria de Marina' },
    { value: 'CF/TC', label: 'Teniente Coronel' },
    { value: 'CN/CR', label: 'Coronel de Infanteria de Marina' },
    { value: 'CA/BG', label: 'Brigadier General' },
  ];

  readonly gradesSUBNavy = [
    { value: 'MA2/C3', label: 'Marinero Segundo' },
    { value: 'MA1/CS', label: 'Marinero Primero' },
    { value: 'S3/CP', label: 'Suboficial Tercero' },
    { value: 'S2/SS', label: 'Suboficial Segundo' },
    { value: 'S1/SV', label: 'Suboficial Primero' },
    { value: 'SJ/SP', label: 'Suboficial Jefe' },
    { value: 'JT/SM', label: 'Suboficial Jefe Tecnico' },
  ];

  readonly gradesSUBIM = [
    { value: 'MA2/C3', label: 'Cabo Tercero' },
    { value: 'MA1/CS', label: 'Cabo Segundo' },
    { value: 'S3/CP', label: 'Cabo Primero' },
    { value: 'S2/SS', label: 'Sargento Segundo' },
    { value: 'S1/SV', label: 'Sargento Viceprimer' },
    { value: 'SJ/SP', label: 'Sargento Primero' },
    { value: 'JT/SM', label: 'Sargento Mayor' },
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
  gradesCtrl = new FormControl<GradesOptionOF['value'] | ''>('', {
    validators: [Validators.required],
  });
  categorieCtrl = new FormControl<CategorieOptionM['value'] | ''>('', {
    validators: [Validators.required],
  });
  categorieCtrlEJ = new FormControl<CategorieOptionM['value'] | ''>('', {
    validators: [Validators.required],
  });

  //inicializador principal
  ngOnInit(): void {
    this.group.addControl('force', this.forceMCtrl);
    this.group.addControl('grades', this.gradesCtrl);
  }

  //trae los grados segun la categoria
  public getgrades(Categorie: string) {
    if (Categorie === 'OfficerNavy') {
      return this.gradesOFNavy;
    } else if (Categorie === 'OfficerIM') {
      return this.gradesOFIM;
    } else if (Categorie === 'SubofficerNavy') {
      return this.gradesSUBNavy;
    } else if (Categorie === 'SubofficerIM') {
      return this.gradesSUBIM;
    } else if (Categorie === 'ArmySubofficer') {
      return this.gradesSUBEJ;
    } else if (Categorie === 'ArmyOfficer') {
      return this.gradesOFEJ;
    } else {
      return [];
    }
  }

  public getCategories(force: string) {
    if (force === 'ejercito') {
      return this.CategorieEjercito;
    } else if (force === 'fuerza_aerea') {
      return this.CategorieAir;
    } else {
      return [];
    }
  }
}
