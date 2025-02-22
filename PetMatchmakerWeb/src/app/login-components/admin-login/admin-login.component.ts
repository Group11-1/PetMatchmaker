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

  isLoggedIn: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  onLogin() {
    this.authService.loginAdmin(this.username, this.password).subscribe(
      (response: any) => {
        if (response.role_id === 1) {
          // Save the token
          this.authService.saveToken(response.token);

          // Store role
          localStorage.setItem('role', response.role_id.toString());

          // Redirect to the admin dashboard
          this.router.navigate(['/questionnaire']);
        } else {
          alert('Access denied! You must be an admin to log in.');
        }
      },
      (error) => {
        console.error('Admin login failed', error);
        alert('Invalid credentials!');
      }
    );
  }
}
