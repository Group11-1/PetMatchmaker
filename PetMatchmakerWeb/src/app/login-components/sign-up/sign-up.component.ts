import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  FormGroup,
  Validators,
} from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sign-up',
  imports: [CommonModule, FontAwesomeModule, FormsModule, ReactiveFormsModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css',
})
export class SignUpComponent implements OnInit {
  faArrowLeft = faArrowLeft;
  signupForm!: FormGroup;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.signupForm = this.fb.group(
      {
        first_name: ['', Validators.required],
        last_name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        username: ['', Validators.required],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirm_password: ['', Validators.required],
      },
      { validator: this.passwordMatchValidator }
    );
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(group: FormGroup) {
    const { password, confirm_password } = group.controls;
    if (password.value !== confirm_password.value) {
      confirm_password.setErrors({ mismatch: true });
    } else {
      confirm_password.setErrors(null);
    }
  }

  // Method to handle form submission
  onSubmit(): void {
    if (this.signupForm.valid) {
      this.authService.signup(this.signupForm.value).subscribe(
        (response: any) => {
          // Ensure the token is being returned by the backend
          console.log('Token received:', response.token);

          // Save the token using AuthService
          this.authService.saveToken(response.token);

          // Save role
          localStorage.setItem('role', response.role);

          // Redirect to the questionnaire page
          this.router.navigate(['/questionnaire']);
        },
        (error) => {
          this.errorMessage =
            error.error.message || 'An error occurred during signup.';
        }
      );
    }
  }
}
