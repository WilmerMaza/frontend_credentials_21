import { BreakpointObserver } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { LayoutLoadingService } from '../../core/services/layout-loading.service';
import { PersonalRegistradoSkeleton } from '../../layout/widgets/personal-registrado-skeleton/personal-registrado-skeleton';
import { PersonalListService } from './data/personal-list.service';
import type { PersonalItem } from './models/personal-item.model';

export type { PersonalItem };

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
  private readonly personalListService = inject(PersonalListService);
  private breakpointSub?: { unsubscribe: () => void };
  private breakpointSubMedium?: { unsubscribe: () => void };

  /** Lista de personal: origen único (demo + registros nuevos). */
  private _allData = this.personalListService.listSignal;

  loading = signal(true);
  filtersExpanded = signal(false);
  isMobile = signal(false);
  isMedium = signal(false);

  readonly searchForm = new FormGroup({
    nombre: new FormControl('', { nonNullable: true }),
    correo: new FormControl('', { nonNullable: true }),
    identificacion: new FormControl('', { nonNullable: true }),
  });

  /** Métricas calculadas desde el mismo JSON que la tabla (_allData). */
  readonly statCards = computed<StatCard[]>(() => {
    const data = this._allData();
    const total = data.length;
    const activos = data.filter((r) => r.estado === 'activo').length;
    const inactivos = data.filter((r) => r.estado === 'inactivo').length;
    const pendientes = data.filter((r) => r.estado === 'pendiente').length;
    return [
      { label: 'Registrados', total, icon: 'group' },
      { label: 'Activos', total: activos, icon: 'check' },
      { label: 'Inactivos', total: inactivos, icon: 'close' },
      { label: 'Pend. credencial', total: pendientes, icon: 'chat_bubble' },
      { label: 'Pendientes', total: pendientes, icon: 'schedule' },
    ];
  });

  readonly pageIndex = signal(0);

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

  /** Registros por página según breakpoint: pequeño 4, mediano 8, grande 9. */
  readonly effectivePageSize = computed(() =>
    this.isMobile() ? 4 : this.isMedium() ? 8 : 9,
  );

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalRecords() / this.effectivePageSize())),
  );

  readonly pagedData = computed(() => {
    const data = this.filteredData();
    const size = this.effectivePageSize();
    const start = this.pageIndex() * size;
    return data.slice(start, start + size);
  });

  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const curr = this.pageIndex() + 1;
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

  ngOnInit(): void {
    this.breakpointSub = this.breakpointObserver
      .observe('(max-width: 768px)')
      .subscribe((state) => {
        const mobile = state.matches;
        this.isMobile.set(mobile);
        if (mobile) {
          this.pageIndex.set(Math.min(this.pageIndex(), Math.max(0, this.totalPages() - 1)));
        }
      });
    this.breakpointSubMedium = this.breakpointObserver
      .observe('(min-width: 769px) and (max-width: 1024px)')
      .subscribe((state) => {
        const medium = state.matches;
        this.isMedium.set(medium);
        this.pageIndex.set(Math.min(this.pageIndex(), Math.max(0, this.totalPages() - 1)));
      });
  }

  ngOnDestroy(): void {
    this.breakpointSub?.unsubscribe();
    this.breakpointSubMedium?.unsubscribe();
  }

  constructor() {
    this.layoutLoading.setLoading(true);

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
    this.router.navigate(['/personal-registrado', 'registro']);
  }

  toggleFilters(): void {
    this.filtersExpanded.update((v) => !v);
  }

  onSearch(): void {
    this._appliedFilters.set(this.searchForm.getRawValue());
    this.pageIndex.set(0);
  }

  onClearSearch(): void {
    this.searchForm.reset({ nombre: '', correo: '', identificacion: '' });
    this._appliedFilters.set({ nombre: '', correo: '', identificacion: '' });
    this.pageIndex.set(0);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.pageIndex.set(page);
    }
  }

  getPaginationHint(): string {
    const total = this.totalRecords();
    if (total === 0) return 'Mostrando 0 registros';
    const size = this.effectivePageSize();
    const idx = this.pageIndex();
    const start = idx * size + 1;
    const end = Math.min((idx + 1) * size, total);
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
