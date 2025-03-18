import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Pet } from '../core/models/pet'; // Adjust path as needed
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-pet-card',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './pet-card.component.html',
  styleUrls: ['./pet-card.component.css']
})
export class PetCardComponent implements OnInit {
  @Input() pet!: Pet;
  @Output() closeCard = new EventEmitter<void>();

  constructor() {}

  ngOnInit(): void {}

  onClose(): void {
    this.closeCard.emit();
  }

  get petImage(): string {
    if (this.pet && this.pet.photos && this.pet.photos.length > 0 && this.pet.photos[0].medium) {
      return this.pet.photos[0].medium;
    }
    return 'https://via.placeholder.com/150';
  }
}
