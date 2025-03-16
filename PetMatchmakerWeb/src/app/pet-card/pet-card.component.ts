import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { PetService, Pet } from '../services/pet.service';

@Component({
  selector: 'app-pet-card',
  templateUrl: './pet-card.component.html',
  styleUrls: ['./pet-card.component.css']
})
export class PetCardComponent implements OnInit {
  @Output() closeCard = new EventEmitter<void>();

  pet: Pet | null = null;

  constructor(private petService: PetService) { }

  ngOnInit(): void {
    // For demonstration, we fetch the list of pets and use the first one.
    this.petService.getPets().subscribe(
      data => {
        if (data && data.animals && data.animals.length > 0) {
          this.pet = data.animals[0];
        }
      },
      error => console.error('Error fetching pet data:', error)
    );
  }

  onClose(): void {
    this.closeCard.emit();
  }
}
