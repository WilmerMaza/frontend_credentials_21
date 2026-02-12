import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-logout-modal',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './logout-modal.html',
  styleUrl: './logout-modal.scss'
})
export class LogoutModal {
  // Outputs para comunicar con el componente padre
  readonly confirmLogout = output<void>();
  readonly cancelLogout = output<void>();

  // Métodos para manejar las acciones
  onConfirm(): void {
    this.confirmLogout.emit();
  }

  onCancel(): void {
    this.cancelLogout.emit();
  }
}