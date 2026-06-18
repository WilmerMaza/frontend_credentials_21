import { BreakpointObserver } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { LayoutLoadingService } from '../../core/services/layout-loading.service';
import { PersonalListService } from './data/personal-list.service';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import type { PersonalItem } from './models/personal-item.model';
import { getPhotoUrl } from '../../shared/utils/url.utils';

// Import subcomponents
import { PersonalMetricsComponent } from './components/personal-metrics/personal-metrics.component';
import { PersonalSearchComponent } from './components/personal-search/personal-search.component';
import { PersonalListMobileComponent } from './components/personal-list-mobile/personal-list-mobile.component';
import { PersonalTableDesktopComponent } from './components/personal-table-desktop/personal-table-desktop.component';

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
    BreadcrumbComponent,
    MatTooltipModule,
    PersonalMetricsComponent,
    PersonalSearchComponent,
    PersonalListMobileComponent,
    PersonalTableDesktopComponent,
  ],
})
export class PersonalRegistrado implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly layoutLoading = inject(LayoutLoadingService);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly personalListService = inject(PersonalListService);
  private breakpointSub?: { unsubscribe: () => void };
  private breakpointSubMedium?: { unsubscribe: () => void };
  private pageLoadSub?: { unsubscribe: () => void };
  public readonly getPhotoUrl = getPhotoUrl;

  /** Lista de personal desde el API. */
  private _allData = this.personalListService.listSignal;

  readonly loading = this.personalListService.loading;
  readonly syncing = this.personalListService.syncing;
  readonly apiError = this.personalListService.error;
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
    const total = this.personalListService.totalRecords();
    const summary = this.personalListService.summary();
    return [
      { label: 'Registrados', total, icon: 'group' },
      { label: 'Activos', total: summary.activas, icon: 'check' },
      { label: 'Inactivos', total: summary.inactivas, icon: 'close' },
      { label: 'Pend. credencial', total: summary.pendientes, icon: 'chat_bubble' },
      { label: 'Pendientes', total: summary.pendientes, icon: 'schedule' },
    ];
  });

  readonly PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
  readonly pageSize = this.personalListService.pageSize;
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

  readonly hasActiveFilters = computed(() => {
    const { nombre, correo, identificacion } = this._appliedFilters();
    return Boolean(nombre || correo || identificacion);
  });

  readonly totalRecords = computed(() =>
    this.hasActiveFilters() ? this.filteredData().length : this.personalListService.totalRecords(),
  );

  /** Registros por página: sin filtros se respeta el `limit` que devuelve el backend. */
  readonly effectivePageSize = computed(() => {
    if (!this.hasActiveFilters()) {
      return this.personalListService.pageSize();
    }

    return this.isMobile() ? 4 : this.isMedium() ? 8 : 9;
  });

  readonly totalPages = computed(() => {
    if (!this.hasActiveFilters()) {
      return Math.max(1, this.personalListService.totalPages());
    }

    return Math.max(1, Math.ceil(this.totalRecords() / this.effectivePageSize()));
  });

  readonly pagedData = computed(() => {
    return this.filteredData();
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
        this.clampCurrentPage();
      });
    this.breakpointSubMedium = this.breakpointObserver
      .observe('(min-width: 769px) and (max-width: 1024px)')
      .subscribe((state) => {
        const medium = state.matches;
        this.isMedium.set(medium);
        this.clampCurrentPage();
      });

    // La primera consulta usa la página inicial que devuelve el backend.
    this.loadInitialRecords();
  }

  ngOnDestroy(): void {
    this.breakpointSub?.unsubscribe();
    this.breakpointSubMedium?.unsubscribe();
    this.pageLoadSub?.unsubscribe();
  }

  constructor() {
    this.layoutLoading.setLoading(false);
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
    if (
      page >= 0 &&
      page < this.totalPages() &&
      page !== this.pageIndex() &&
      !this.loading() &&
      !this.syncing()
    ) {
      this.loadServerPage(page);
    }
  }

  onPageSizeChange(size: number): void {
    const limit = Number(size);
    if (!this.PAGE_SIZE_OPTIONS.includes(limit as 10 | 20 | 50)) return;
    if (this.loading() || this.syncing()) return;
    if (limit === this.pageSize()) return;

    this.pageIndex.set(0);
    this.pageLoadSub?.unsubscribe();
    this.pageLoadSub = this.personalListService.loadAll(1, limit).subscribe();
  }

  getPaginationHint(): string {
    const total = this.totalRecords();
    if (total === 0) return 'Mostrando 0 registros';
    const size = this.effectivePageSize();
    const idx = this.pageIndex();
    const start = idx * size + 1;
    const end = Math.min(start + this.pagedData().length - 1, total);
    return `Mostrando ${start}–${end} de ${total} registros`;
  }

  private loadInitialRecords(): void {
    this.pageIndex.set(0);
    this.pageLoadSub?.unsubscribe();
    this.pageLoadSub = this.personalListService
      .loadAll(1, this.personalListService.pageSize())
      .subscribe();
  }

  private loadServerPage(pageIndex: number): void {
    const pageSize = this.personalListService.pageSize();
    this.pageIndex.set(pageIndex);
    this.pageLoadSub?.unsubscribe();
    this.pageLoadSub = this.personalListService.loadAll(pageIndex + 1, pageSize).subscribe();
  }

  private clampCurrentPage(): void {
    this.pageIndex.set(Math.min(this.pageIndex(), Math.max(0, this.totalPages() - 1)));
  }

  onView(item: PersonalItem): void {
    this.router.navigate(['/personal-registrado', 'credential', item.id], {
      state: { credential: item },
    });
  }

  onEdit(item: PersonalItem): void {
    this.router.navigate(['/personal-registrado', 'editar', item.id]);
  }

  onDelete(item: PersonalItem): void {
    console.log('Eliminar', item);
  }
}
