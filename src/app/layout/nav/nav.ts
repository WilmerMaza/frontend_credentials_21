import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { ProfileMenu } from '../widgets/profile-menu/profile-menu';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [MatToolbarModule, MatIconModule, MatButtonModule, ProfileMenu, CommonModule],
  templateUrl: './nav.html',
  styleUrls: ['./nav.scss'],
})
export class Nav {
  public readonly mostrarToggleMenu = input<boolean>(true); // true por defecto
  readonly collapsed = input<boolean>(false);
  readonly menuToggle = output<void>();

  toggleMenu(): void {
    this.menuToggle.emit();
  }
}
