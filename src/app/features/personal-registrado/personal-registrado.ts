import { BreakpointObserver } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { LayoutLoadingService } from '../../core/services/layout-loading.service';
import {
  CredentialListFilters,
  PersonalListService,
} from './data/personal-list.service';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import type { PersonalItem } from './models/personal-item.model';
import type { StatCard } from './components/personal-metrics/personal-metrics.component';
import {
  CREDENTIAL_STATUS_OPTIONS,
  type CredentialStatusCode,
} from '../../shared/utils/credential-status.utils';
import { PersonalMetricsComponent } from './components/personal-metrics/personal-metrics.component';
import { PersonalSearchComponent } from './components/personal-search/personal-search.component';
import { PersonalListMobileComponent } from './components/personal-list-mobile/personal-list-mobile.component';
import { PersonalTableDesktopComponent } from './components/personal-table-desktop/personal-table-desktop.component';

export type { PersonalItem };

@Component({
  selector: 'app-personal-registrado',
  standalone: true,
  templateUrl: './personal-registrado.html',
  styleUrls: ['./personal-registrado.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
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
  private pageLoadSub?: { unsubscribe: () => void };
  private readonly _allData = this.personalListService.listSignal;

  readonly loading = this.personalListService.loading;
  readonly syncing = this.personalListService.syncing;
  readonly apiError = this.personalListService.error;
  filtersExpanded = signal(false);
  isMobile = signal(false);

  readonly searchForm = new FormGroup({
    nombre: new FormControl('', { nonNullable: true }),
    correo: new FormControl('', { nonNullable: true }),
    identificacion: new FormControl('', { nonNullable: true }),
    estado: new FormControl<CredentialStatusCode | ''>('', { nonNullable: true }),
  });

  readonly statusFilterOptions = CREDENTIAL_STATUS_OPTIONS;

  readonly statCards = computed<StatCard[]>(() => {
    const total = this.personalListService.globalTotalRecords() || this.personalListService.totalRecords();
    const summary = this.personalListService.summary();
    const expiradas = summary.expiradas ?? 0;

    return [
      { label: 'Registrados', total, tone: 'primary' },
      { label: 'ACTIVOS', total: summary.activas, tone: 'success' },
      { label: 'INACTIVOS', total: summary.inactivas, tone: 'muted' },
      { label: 'EXPIRADAS', total: expiradas, tone: 'muted' },
      { label: 'PENDIENTES', total: summary.pendientes, tone: 'warning' },
    ];
  });

  readonly PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
  readonly pageSize = this.personalListService.pageSize;
  readonly pageIndex = computed(() => Math.max(0, this.personalListService.currentPage() - 1));

  private readonly _appliedFilters = signal<{
    nombre: string;
    correo: string;
    identificacion: string;
    estado: CredentialStatusCode | '';
  }>({
    nombre: '',
    correo: '',
    identificacion: '',
    estado: '',
  });

  readonly totalRecords = this.personalListService.totalRecords;
  readonly totalPages = computed(() => Math.max(1, this.personalListService.totalPages()));
  readonly pagedData = computed(() => this._allData());

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
        this.isMobile.set(state.matches);
      });

    this.loadInitialRecords();
  }

  ngOnDestroy(): void {
    this.breakpointSub?.unsubscribe();
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

  hasActiveFilters(): boolean {
    const { nombre, correo, identificacion, estado } = this.searchForm.getRawValue();
    return Boolean(nombre?.trim() || correo?.trim() || identificacion?.trim() || estado);
  }

  onSearch(): void {
    this._appliedFilters.set(this.searchForm.getRawValue());
    this.loadServerPage(0);
  }

  onClearSearch(): void {
    this.searchForm.reset({ nombre: '', correo: '', identificacion: '', estado: '' });
    this._appliedFilters.set({ nombre: '', correo: '', identificacion: '', estado: '' });
    this.loadServerPage(0);
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

    this.pageLoadSub?.unsubscribe();
    this.pageLoadSub = this.personalListService
      .loadAll(1, limit, this.buildApiFilters())
      .subscribe();
  }

  getPaginationHint(): string {
    const total = this.totalRecords();
    if (total === 0) return 'Mostrando 0 registros';
    const size = this.pageSize();
    const idx = this.pageIndex();
    const start = idx * size + 1;
    const end = Math.min(start + this.pagedData().length - 1, total);
    return `Mostrando ${start}–${end} de ${total} registros`;
  }

  private loadInitialRecords(): void {
    this.pageLoadSub?.unsubscribe();
    this.pageLoadSub = this.personalListService
      .loadAll(1, this.personalListService.pageSize(), this.buildApiFilters())
      .subscribe();
  }

  private loadServerPage(pageIndex: number): void {
    this.pageLoadSub?.unsubscribe();
    this.pageLoadSub = this.personalListService
      .loadAll(pageIndex + 1, this.personalListService.pageSize(), this.buildApiFilters())
      .subscribe();
  }

  private buildApiFilters(): CredentialListFilters {
    const filters = this._appliedFilters();
    return {
      status: filters.estado || null,
      name: filters.nombre.trim() || null,
      email: filters.correo.trim() || null,
      identity: filters.identificacion.trim() || null,
    };
  }

  onView(item: PersonalItem): void {
    this.router.navigate(['/personal-registrado', 'credential', item.id], {
      state: { credential: item },
    });
  }

  onEdit(item: PersonalItem): void {
    this.router.navigate(['/personal-registrado', 'editar', item.id]);
  }
}
