import { Injectable } from '@angular/core';

import { Router } from '@angular/router';
import { AuthService } from '../services/auth';

@Injectable({
  providedIn: 'root',
})
export class IgnoreLoginGuard {
  constructor(private authService$: AuthService, private router: Router) {}
  canActivate(): boolean {
    if (this.authService$.isAuthenticated()) {
      this.router.navigate(['/home']);
      return false;
    } else {
      return true;
    }
  }
}
