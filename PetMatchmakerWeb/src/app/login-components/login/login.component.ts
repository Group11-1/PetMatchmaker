import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FontAwesomeModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  faArrowLeft = faArrowLeft;

  username: string = '';
  password: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  onLogin() {
    this.authService.login(this.username, this.password).subscribe(
      (response: any) => {
        // Save the token using AuthService
        this.authService.saveToken(response.token);

        // Save role if needed
        localStorage.setItem('role', response.role);

        // Check if profile is completed
        if (response.profile_completed) {
          this.router.navigate(['/pet-listing']); // Redirect to pet-listing
        } else {
          this.router.navigate(['/questionnaire']); // Redirect to questionnaire
        }
      },
      (error) => {
        console.error('Login failed', error);
        alert('Invalid credentials!');
      }
    );
  }
}
