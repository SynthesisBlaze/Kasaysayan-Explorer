import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-splashscreen',
  templateUrl: './splashscreen.page.html',
  styleUrls: ['./splashscreen.page.scss'],
})
export class SplashscreenPage implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    setTimeout(() => {
      const content = document.querySelector('ion-content');
      content?.classList.add('page-slide-up');
      setTimeout(() => {
        this.router.navigateByUrl('/tabs');
      }, 800);
    }, 4000); 
  }
}
