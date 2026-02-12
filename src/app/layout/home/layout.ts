import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, signal, WritableSignal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Spinner } from '../../shared/components/spinner/spinner';
import { Nav } from '../nav/nav';
import { Sidenav } from '../sidenav/sidenav';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    RouterOutlet,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatSidenavModule,
    Sidenav,
    Nav,
    Spinner,
  ],
  templateUrl: './layout.html',
  styleUrls: ['./layout.scss'],
})
export class Layout implements OnDestroy {
  private readonly STORAGE_KEY = 'sidebar-collapsed';
  readonly collapsed: WritableSignal<boolean> = signal(this.getSavedState());
  readonly isMobile: WritableSignal<boolean> = signal(this.checkIsMobile());
  public readonly showMenuToggle: WritableSignal<boolean> = signal(true);

  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
  ) {
    this.router.events.pipe(filter((ev) => ev instanceof NavigationEnd)).subscribe(() => {
      const leaf = this.getLeaf(this.activeRoute);
      const data = leaf.snapshot.data;
      this.showMenuToggle.set(data['showMenuToggle'] ?? true);
    });
  }

  private getLeaf(r: ActivatedRoute): ActivatedRoute {
    let current = r;
    while (current.firstChild) {
      current = current.firstChild;
    }
    return current;
  }

  toggle = (): void => {
    this.collapsed.update((v) => {
      const newValue = !v;
      this.saveState(newValue);
      return newValue;
    });

    if (this.isMobile()) {
      this.toggleBodyScroll();
    }
  };

  onBackdropClick = (): void => {
    if (this.isMobile() && !this.collapsed()) {
      this.toggle();
    }
  };

  onCloseSidebar = (): void => {
    if (this.isMobile() && !this.collapsed()) {
      this.toggle();
    }
  };

  private getSavedState(): boolean {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      const isMobile = window.innerWidth < 768;

      if (isMobile) {
        return true;
      }

      return saved ? JSON.parse(saved) : false;
    }
    return false;
  }

  private saveState(state: boolean): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    }
  }

  private checkIsMobile(): boolean {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  }

  private toggleBodyScroll(): void {
    if (typeof document !== 'undefined') {
      if (this.collapsed()) {
        document.body.style.overflow = '';
        document.body.style.position = '';
      } else {
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
      }
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    const wasMobile = this.isMobile();
    const isNowMobile = this.checkIsMobile();

    this.isMobile.set(isNowMobile);

    if (wasMobile && !isNowMobile) {
      document.body.style.overflow = '';
      document.body.style.position = '';
    }
  }

  @HostListener('window:keydown.escape')
  onEscapeKey(): void {
    if (this.isMobile() && !this.collapsed()) {
      this.toggle();
    }
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
      document.body.style.position = '';
    }
  }
}
