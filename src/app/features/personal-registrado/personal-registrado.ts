import { BreakpointObserver } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { LayoutLoadingService } from '../../core/services/layout-loading.service';
import { PersonalRegistradoSkeleton } from '../../layout/widgets/personal-registrado-skeleton/personal-registrado-skeleton';

export interface PersonalItem {
  id: string;
  photoUrl?: string;
  nombreCompleto: string;
  sub?: string;
  identificacion: string;
  rango: string;
  estado: 'activo' | 'inactivo' | 'pendiente';
  correo: string;
  fechaIngreso: string;
}

interface StatCard {
  label: string;
  total: number;
  icon: string;
}

@Component({
  selector: 'app-personal-registrado',
  standalone: true,
  templateUrl: './personal-registrado.html',
  styleUrls: ['./personal-registrado.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    PersonalRegistradoSkeleton,
  ],
})
export class PersonalRegistrado implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly layoutLoading = inject(LayoutLoadingService);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private breakpointSub?: { unsubscribe: () => void };

  loading = signal(true);
  filtersExpanded = signal(false);
  isMobile = signal(false);

  readonly searchForm = new FormGroup({
    nombre: new FormControl('', { nonNullable: true }),
    correo: new FormControl('', { nonNullable: true }),
    identificacion: new FormControl('', { nonNullable: true }),
  });

  readonly statCards: StatCard[] = [
    { label: 'Registrados', total: 214, icon: 'group' },
    { label: 'Activos', total: 177, icon: 'check' },
    { label: 'Inactivos', total: 29, icon: 'close' },
    { label: 'Pend. credencial', total: 8, icon: 'chat_bubble' },
    { label: 'Pendientes', total: 8, icon: 'schedule' },
  ];

  pageSize = 10;
  pageIndex = 0;
  private readonly _pageSizeOptions = [4, 5, 10, 25, 50, 100];
  readonly pageSizeOptions = computed(() =>
    this.isMobile() ? [4] : this._pageSizeOptions,
  );

  private _allData = signal<PersonalItem[]>([]);
  private _appliedFilters = signal<{ nombre: string; correo: string; identificacion: string }>({
    nombre: '',
    correo: '',
    identificacion: '',
  });

  readonly filteredData = computed(() => {
    const data = this._allData();
    const filters = this._appliedFilters();
    const { nombre, correo, identificacion } = filters;

    return data.filter((r) => {
      if (nombre && !r.nombreCompleto.toLowerCase().includes(nombre.toLowerCase())) return false;
      if (correo && !r.correo.toLowerCase().includes(correo.toLowerCase())) return false;
      if (identificacion && !r.identificacion.toLowerCase().includes(identificacion.toLowerCase()))
        return false;
      return true;
    });
  });

  readonly totalRecords = computed(() => this.filteredData().length);

  readonly effectivePageSize = computed(() =>
    this.isMobile() ? Math.min(this.pageSize, 4) : this.pageSize,
  );

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalRecords() / this.effectivePageSize())),
  );

  readonly pagedData = computed(() => {
    const data = this.filteredData();
    const size = this.effectivePageSize();
    const start = this.pageIndex * size;
    return data.slice(start, start + size);
  });

  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const curr = this.pageIndex + 1;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | string)[] = [];
    if (curr <= 4) {
      pages.push(1, 2, 3, '...', total);
    } else if (curr >= total - 2) {
      pages.push(1, '...', total - 2, total - 1, total);
    } else {
      pages.push(1, '...', curr, '...', total);
    }
    return pages;
  });

  private mockData: PersonalItem[] = [
    {
      id: '1',
      nombreCompleto: 'Juan Pérez',
      sub: 'Reentreno: Juan pereza',
      identificacion: 'MIL-2025-001234',
      rango: 'Teniente',
      estado: 'activo',
      correo: 'juan.perez@fuerzasarmadas.mil',
      fechaIngreso: '15/04/2024',
    },
    {
      id: '2',
      nombreCompleto: 'María González',
      sub: 'Reentreno: Juan gontínez',
      identificacion: 'MIL-2024-006789',
      rango: 'Subteniente',
      estado: 'activo',
      correo: 'maria.gonzalez@fuerzasarmadas.mil',
      fechaIngreso: '12/04/2024',
    },
    {
      id: '3',
      nombreCompleto: 'Luis Martínez',
      sub: 'Reentreno: Luis martínez',
      identificacion: 'MIL-2023-012345',
      rango: 'Teniente',
      estado: 'activo',
      correo: 'luis.martinez@fuerzasarmadas.mil',
      fechaIngreso: '10/04/2024',
    },
    {
      id: '4',
      nombreCompleto: 'Ana Rodríguez',
      sub: 'Reentreno: Ana rodríguez andálz',
      identificacion: 'MIL-2023-001678',
      rango: 'Subteniente',
      estado: 'activo',
      correo: 'ana.rodriguez@fuerzasarmadas.mil',
      fechaIngreso: '05/04/2024',
    },
    {
      id: '5',
      nombreCompleto: 'Laura Moreno',
      sub: 'Reentreno: lencum.teregogas.ermadas',
      identificacion: 'MIL-2026-017890',
      rango: 'Subteniente',
      estado: 'pendiente',
      correo: 'laura.moreno@fuerzasarmadas.mil',
      fechaIngreso: '28/03/2024',
    },
    {
      id: '6',
      nombreCompleto: 'Carlos Sánchez',
      sub: 'Reentreno: Carlos sánchez',
      identificacion: 'MIL-2025-001237',
      rango: 'Capitán',
      estado: 'activo',
      correo: 'carlos.sanchez@fuerzasarmadas.mil',
      fechaIngreso: '01/03/2024',
    },
  ];

  ngOnInit(): void {
    this.breakpointSub = this.breakpointObserver
      .observe('(max-width: 768px)')
      .subscribe((state) => {
        const mobile = state.matches;
        this.isMobile.set(mobile);
        if (mobile && this.pageSize > 4) {
          this.pageSize = 4;
          this.pageIndex = Math.min(this.pageIndex, Math.max(0, this.totalPages() - 1));
        }
      });
  }

  ngOnDestroy(): void {
    this.breakpointSub?.unsubscribe();
  }

  constructor() {
    this.layoutLoading.setLoading(true);
    this._allData.set(this.mockData);

    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.loading.set(false);
        this.layoutLoading.setLoading(false);
      }, 600);
    } else {
      this.loading.set(false);
      this.layoutLoading.setLoading(false);
    }
  }

  navigateToRegistration(): void {
    this.router.navigate(['/registration']);
  }

  toggleFilters(): void {
    this.filtersExpanded.update((v) => !v);
  }

  onSearch(): void {
    this._appliedFilters.set(this.searchForm.getRawValue());
    this.pageIndex = 0;
  }

  onClearSearch(): void {
    this.searchForm.reset({ nombre: '', correo: '', identificacion: '' });
    this._appliedFilters.set({ nombre: '', correo: '', identificacion: '' });
    this.pageIndex = 0;
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.pageIndex = page;
    }
  }

  onPageSizeChange(size: number | string): void {
    const val = typeof size === 'string' ? parseInt(size, 10) : size;
    this.pageSize = this.isMobile() ? Math.min(val, 4) : val;
    this.pageIndex = 0;
  }

  getPaginationHint(): string {
    const total = this.totalRecords();
    if (total === 0) return 'Mostrando 0 registros';
    const size = this.effectivePageSize();
    const start = this.pageIndex * size + 1;
    const end = Math.min((this.pageIndex + 1) * size, total);
    return `Mostrando ${start}–${end} de ${total} registros`;
  }

  getEstadoLabel(estado: string): string {
    return estado === 'activo' ? 'Activo' : estado === 'pendiente' ? 'Pendiente' : 'Inactivo';
  }

  onView(item: PersonalItem): void {
    this.router.navigate(['/credential', item.id], {
      state: { credential: item },
    });
  }

  onEdit(item: PersonalItem): void {
    console.log('Editar', item);
  }

  onDelete(item: PersonalItem): void {
    console.log('Eliminar', item);
  }
}
