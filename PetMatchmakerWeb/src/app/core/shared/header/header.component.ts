import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faHome,
  faHeart,
  faUserCircle,
} from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'app-header',
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  faHome = faHome;
  faHeart = faHeart;
  faUserCircle = faUserCircle;
}
