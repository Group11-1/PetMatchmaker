import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css',
})
export class AdminLoginComponent {
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

        // Check if the user is an admin using the getter method
        if (this.authService.getIsAdmin()) {
          // Redirecting to questionnaire for time being
          this.router.navigate(['/questionnaire']);
        } else {
          // Redirect to the default user dashboard or questionnaire if not an admin
          const returnUrl =
            this.route.snapshot.queryParams['returnUrl'] || '/questionnaire';
          this.router.navigate([returnUrl]);
        }
      },
      (error) => {
        console.error('Login failed', error);
        alert('Invalid credentials!');
      }
    );
  }
}
