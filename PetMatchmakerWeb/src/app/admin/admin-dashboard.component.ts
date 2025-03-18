import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
@Component({
  selector: 'app-admin-dashboard',
  imports: [
    CommonModule,
    FontAwesomeModule,
    MatBadgeModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    FormsModule,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent {
  constructor(private authService: AuthService) {}
  opened = false; //sets the side navigation bar to be initially closed
}
