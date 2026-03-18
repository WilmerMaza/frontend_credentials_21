import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-page500',
  templateUrl: './page500.component.html',
  styleUrls: ['./page500.component.scss']
})
export class Page500Component implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }
  ngOnInit(): void {
    console.error('500 Error: Internal Server Error:', this.route.snapshot.url);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
