import { Component, OnInit } from '@angular/core';
import { PetService } from '../core/services/petfinder.service';
import { Pet } from '../core/models/pet';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pet-lisiting',
  imports: [CommonModule],
  templateUrl: './pet-lisiting.component.html',
  styleUrl: './pet-lisiting.component.css',
})
export class PetLisitingComponent implements OnInit {
  pets: Pet[] = [];

  constructor(private petService: PetService) {}

  ngOnInit(): void {
    this.loadPets();
  }

  loadPets(): void {
    this.petService.getPets().subscribe((response: Pet[]) => {
      this.pets = response;
      // console.log(this.pets);
    });
  }
}
