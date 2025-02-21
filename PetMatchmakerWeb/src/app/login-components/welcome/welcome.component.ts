import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-welcome',
  imports: [],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css',
})
export class WelcomeComponent {
  constructor(private router: Router) {}

  onLoginClick() {
    this.router.navigate(['/login']);
  }

  onSignUpClick() {
    this.router.navigate(['/sign-up']);
  }
}
