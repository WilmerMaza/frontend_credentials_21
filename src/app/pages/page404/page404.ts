import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-page404',
  standalone: true,
  imports: [],
  templateUrl: './page404.html',
  styleUrls: ['./page404.scss'],
})

export class Page404 implements OnInit {
   constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.error('404 Error: User attempted to access non-existent route:', this.route.snapshot.url);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
