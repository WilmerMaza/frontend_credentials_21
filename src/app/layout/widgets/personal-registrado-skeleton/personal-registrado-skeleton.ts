import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-personal-registrado-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-wrapper" role="status" aria-label="Cargando personal registrado">
    <!-- Móvil: visible solo <= 768px -->
    <div class="m-skeleton m-skeleton--only">
      <div class="m-skeleton__content">
        <div class="skeleton m-skeleton__title"></div>
        <div class="skeleton m-skeleton__subtitle"></div>
        <div class="m-skeleton__metrics">
          @for (i of [1, 2, 3, 4]; track i) {
            <div class="m-skeleton__metric">
              <div class="skeleton m-skeleton__ico"></div>
              <div>
                <div class="skeleton m-skeleton__val"></div>
                <div class="skeleton m-skeleton__lab"></div>
              </div>
            </div>
          }
        </div>
        <div class="m-skeleton__card">
          <div class="skeleton m-skeleton__accordion"></div>
          <div class="skeleton m-skeleton__cta"></div>
        </div>
        <div class="m-skeleton__list">
          <div class="m-skeleton__list-head">
            <div class="skeleton m-skeleton__list-title"></div>
            <div class="skeleton m-skeleton__hint"></div>
          </div>
          @for (i of [1, 2, 3]; track i) {
            <div class="m-skeleton__row">
              <div class="m-skeleton__row-top">
                <div class="skeleton m-skeleton__photo"></div>
                <div class="m-skeleton__row-info">
                  <div class="skeleton m-skeleton__name"></div>
                  <div class="skeleton m-skeleton__meta"></div>
                </div>
                <div class="skeleton m-skeleton__badge"></div>
              </div>
              <div class="m-skeleton__row-grid">
                <div class="skeleton m-skeleton__kv"></div>
                <div class="skeleton m-skeleton__kv"></div>
                <div class="skeleton m-skeleton__kv-full"></div>
              </div>
              <div class="m-skeleton__actions">
                <div class="skeleton m-skeleton__a-btn"></div>
                <div class="skeleton m-skeleton__a-btn"></div>
                <div class="skeleton m-skeleton__a-btn"></div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
    <!-- Desktop: visible solo > 768px -->
    <div class="pr-skeleton pr-skeleton--only">
      <!-- Encabezado -->
      <div class="pr-skeleton__header">
        <div class="pr-skeleton__header-text">
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-subtitle"></div>
        </div>
        <div class="skeleton skeleton-btn"></div>
      </div>

      <!-- Tarjetas métricas (5 en una fila) -->
      <div class="pr-skeleton__metric-card">
        <div class="pr-skeleton__metrics">
          @for (i of [1, 2, 3, 4, 5]; track i) {
            <div class="pr-skeleton__metric">
              <div class="skeleton skeleton-metric-ico"></div>
              <div>
                <div class="skeleton skeleton-metric-val"></div>
                <div class="skeleton skeleton-metric-lab"></div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Table card (filtros + tabla) -->
      <div class="pr-skeleton__table-card">
        <div class="pr-skeleton__filters">
          <div class="skeleton skeleton-field"></div>
          <div class="skeleton skeleton-field"></div>
          <div class="skeleton skeleton-field"></div>
          <div class="skeleton skeleton-btn-sm"></div>
          <div class="skeleton skeleton-btn-sm"></div>
        </div>

        <div class="pr-skeleton__table">
        <div class="pr-skeleton__table-header">
          @for (i of [1, 2, 3, 4, 5, 6, 7]; track i) {
            <div class="skeleton skeleton-col"></div>
          }
        </div>
        @for (row of [1, 2, 3, 4, 5]; track row) {
          <div class="pr-skeleton__table-row">
            <div class="skeleton skeleton-avatar"></div>
            <div class="skeleton skeleton-cell"></div>
            <div class="skeleton skeleton-cell"></div>
            <div class="skeleton skeleton-cell"></div>
            <div class="skeleton skeleton-cell"></div>
            <div class="skeleton skeleton-cell"></div>
            <div class="skeleton skeleton-actions"></div>
          </div>
        }
        </div>
      </div>
    </div>
    </div>
  `,
  styles: `
    :host { display: block; }
    .skeleton-wrapper { position: relative; }
    .m-skeleton--only {
      display: none;
    }
    .pr-skeleton--only {
      display: block;
    }
    @media (max-width: 768px) {
      .m-skeleton--only { display: block; }
      .pr-skeleton--only { display: none; }
    }
    .skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .pr-skeleton {
      padding: 26px;
      background-color: #f9fafb;
      max-width: 1200px;
      margin: 0 auto;
    }
    .pr-skeleton__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .pr-skeleton__header-text {
      flex: 1;
    }
    .skeleton-title {
      height: 1.75rem;
      width: 280px;
      margin-bottom: 0.5rem;
    }
    .skeleton-subtitle {
      height: 1rem;
      width: 400px;
    }
    .skeleton-btn {
      height: 40px;
      width: 200px;
    }
    .pr-skeleton__metric-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      padding: 14px;
      margin-bottom: 14px;
    }
    .pr-skeleton__metrics {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 0;
    }
    .pr-skeleton__metric {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-right: 1px solid #e2e8f0;
    }
    .pr-skeleton__metric:last-child { border-right: 0; }
    .skeleton-metric-ico {
      width: 44px;
      height: 44px;
      border-radius: 14px;
    }
    .skeleton-metric-val {
      height: 1.5rem;
      width: 48px;
      margin-bottom: 6px;
    }
    .skeleton-metric-lab {
      height: 0.9rem;
      width: 72px;
    }
    .pr-skeleton__table-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      box-shadow: 0 10px 30px rgba(2, 6, 23, 0.08);
      overflow: hidden;
    }
    .pr-skeleton__filters {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr auto auto;
      gap: 12px;
      padding: 16px;
      background: linear-gradient(180deg, #fff 0%, #fbfcfe 100%);
      border-bottom: 1px solid #e2e8f0;
    }
    .skeleton-field {
      height: 56px;
      width: 200px;
    }
    .skeleton-btn-sm {
      height: 40px;
      width: 100px;
    }
    .pr-skeleton__table {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      padding: 1rem;
      box-shadow: 0 10px 30px rgba(2, 6, 23, 0.08);
      overflow: hidden;
    }
    .pr-skeleton__table-header {
      display: grid;
      grid-template-columns: 50px 1fr 120px 1fr 1fr 100px 120px;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .skeleton-col {
      height: 1rem;
    }
    .pr-skeleton__table-row {
      display: grid;
      grid-template-columns: 50px 1fr 120px 1fr 1fr 100px 120px;
      gap: 0.75rem;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .pr-skeleton__table-row:last-child {
      border-bottom: none;
    }
    .skeleton-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }
    .skeleton-cell {
      height: 1rem;
      min-width: 80px;
    }
    .skeleton-actions {
      height: 36px;
      width: 100px;
    }
    @media (max-width: 1120px) {
      .pr-skeleton__metrics {
        grid-template-columns: repeat(2, 1fr);
      }
      .pr-skeleton__metric {
        border-right: 0;
        border-bottom: 1px solid #e2e8f0;
      }
      .pr-skeleton__metric:nth-child(odd) { border-right: 1px solid #e2e8f0; }
      .pr-skeleton__filters {
        grid-template-columns: 1fr 1fr;
      }
    }
    @media (max-width: 768px) {
      .pr-skeleton__table-header,
      .pr-skeleton__table-row {
        grid-template-columns: 40px 1fr 1fr 80px;
      }
    }

    /* Mobile skeleton */
    .m-skeleton {
      max-width: 460px;
      margin: 0 auto;
      background: linear-gradient(180deg, #f7f9fc 0%, #f9fafb 80%);
      min-height: 100vh;
    }
    .m-skeleton__content {
      padding: 14px;
    }
    .m-skeleton__title {
      margin: 14px 0 6px;
      height: 28px;
      width: 220px;
    }
    .m-skeleton__subtitle {
      margin: 0 0 12px;
      height: 16px;
      width: 100%;
      max-width: 340px;
    }
    .m-skeleton__metrics {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding-bottom: 6px;
    }
    .m-skeleton__metric {
      min-width: 170px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
    }
    .m-skeleton__ico {
      width: 44px;
      height: 44px;
      border-radius: 16px;
    }
    .m-skeleton__val {
      height: 20px;
      width: 36px;
      margin-bottom: 6px;
    }
    .m-skeleton__lab {
      height: 14px;
      width: 72px;
    }
    .m-skeleton__card {
      margin-top: 12px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .m-skeleton__accordion {
      height: 52px;
      width: 100%;
    }
    .m-skeleton__cta {
      height: 52px;
      width: 100%;
      border-radius: 16px;
    }
    .m-skeleton__list {
      margin-top: 12px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      overflow: hidden;
    }
    .m-skeleton__list-head {
      padding: 14px 14px 10px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 10px;
    }
    .m-skeleton__list-title {
      height: 18px;
      width: 100px;
    }
    .m-skeleton__hint {
      height: 14px;
      width: 80px;
    }
    .m-skeleton__row {
      padding: 14px;
      border-bottom: 1px solid #e2e8f0;
    }
    .m-skeleton__row:last-child {
      border-bottom: 0;
    }
    .m-skeleton__row-top {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .m-skeleton__photo {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .m-skeleton__row-info {
      flex: 1;
      min-width: 0;
    }
    .m-skeleton__name {
      height: 16px;
      width: 70%;
      margin-bottom: 6px;
    }
    .m-skeleton__meta {
      height: 12px;
      width: 100px;
    }
    .m-skeleton__badge {
      height: 28px;
      width: 70px;
      border-radius: 999px;
    }
    .m-skeleton__row-grid {
      margin-top: 10px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 12px;
    }
    .m-skeleton__kv {
      height: 36px;
    }
    .m-skeleton__kv-full {
      grid-column: 1 / -1;
      height: 36px;
    }
    .m-skeleton__actions {
      margin-top: 12px;
      display: flex;
      gap: 10px;
    }
    .m-skeleton__a-btn {
      flex: 1;
      height: 44px;
      border-radius: 14px;
    }
  `,
})
export class PersonalRegistradoSkeleton {}
