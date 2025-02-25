import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { HeaderComponent } from './core/shared/header/header.component';
import { FooterComponent } from './core/shared/footer/footer.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'PetMatchmakerWeb';

  isLoggedIn: boolean = false;

  hideLayout = false;

  constructor(private authService: AuthService, private router: Router) {
    this.router.events.subscribe(() => {
      this.hideLayout = this.router.url.includes('/questionnaire');
    });
  }

  ngOnInit(): void {
    this.authService.getLoginStatus().subscribe((isLoggedIn) => {
      this.isLoggedIn = isLoggedIn; // Update local login status
    });
  }
}
