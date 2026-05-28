import { Component, Input, booleanAttribute } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-institutional-header',
  standalone: true,
  imports: [MatToolbarModule],
  templateUrl: './institutional-header.component.html',
  styleUrl: './institutional-header.component.scss',
  host: {
    class: 'institutional-header',
    '[class.institutional-header--full]': 'fullWidth',
    '[class.institutional-header--compact]': 'compactLogo',
  },
})
export class InstitutionalHeaderComponent {
  @Input() logoUrl = '/images/ENAP.png';
  @Input({ transform: booleanAttribute }) fullWidth = false;
  @Input({ transform: booleanAttribute }) compactLogo = false;
}
