import { Component, OnInit, HostListener } from '@angular/core';
import { PetfinderService } from '../core/services/petfinder.service';
import { Pet } from '../core/models/pet';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faFilter, faSearch } from '@fortawesome/free-solid-svg-icons';
import { PetCardComponent } from '../pet-card/pet-card.component'; // Import Pet Card modal

@Component({
  selector: 'app-pet-lisiting',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, PetCardComponent],
  templateUrl: './pet-lisiting.component.html',
  styleUrls: ['./pet-lisiting.component.css'],
})
export class PetLisitingComponent implements OnInit {
  pets: Pet[] = [];
  selectedPet: Pet | null = null;
  faFilter = faFilter;
  faSearch = faSearch;
  loading: boolean = true;
  currentPage: number = 1;
  totalPages: number = 1;

  constructor(private petService: PetfinderService) {}

  ngOnInit(): void {
    this.loadPets();
    const header = document.querySelector('header');
    const headerHeight = header ? (header as HTMLElement).offsetHeight : 0;
    const petList = document.querySelector('.pet-list');
    if (petList) {
      (petList as HTMLElement).style.marginTop = `${headerHeight}px`;
    }
  }

  loadPets(): void {
    this.loading = true;
    this.petService.getPets().subscribe(
      (response: any) => {
        console.log('API Response:', response);
        this.pets = response.animals || [];
        this.currentPage = response.pagination.current_page || 1;
        this.totalPages = response.pagination.total_pages || 1;
        this.loading = false;
      },
      (error: any) => {
        console.error('Error fetching pets:', error);
        this.loading = false;
      }
    );
  }

  // Optionally shorten the pet name if needed.
  getPetName(pet: any): string {
    const nameParts = pet.name.split(' ');
    if (nameParts.length > 1) {
      return `${nameParts[0]} ${nameParts[1]}`;
    }
    return pet.name;
  }

  // Determine a valid image URL for the pet.
  getImageUrl(pet: any): string {
    const primaryPhoto = pet.primary_photo_cropped;
    if (primaryPhoto) {
      if (primaryPhoto.small) return primaryPhoto.small;
      if (primaryPhoto.medium) return primaryPhoto.medium;
      if (primaryPhoto.large) return primaryPhoto.large;
      if (primaryPhoto.full) return primaryPhoto.full;
    }
    if (pet.photos && pet.photos.length > 0) {
      for (const photo of pet.photos) {
        if (photo.small) return photo.small;
        if (photo.medium) return photo.medium;
        if (photo.large) return photo.large;
        if (photo.full) return photo.full;
      }
    }
    return '/assets/img/Website Icon.png';
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadPets();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadPets();
    }
  }

  lastScrollTop: number = 0;
  @HostListener('window:scroll', ['$event'])
  onScroll(event: any): void {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    if (currentScroll > this.lastScrollTop) {
      document.querySelector('header')?.classList.add('hide');
    } else {
      document.querySelector('header')?.classList.remove('hide');
    }
    this.lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
  }

  // When a user clicks "More Info", set the selected pet.
  openModal(pet: Pet): void {
    this.selectedPet = pet;
  }

  // Close the modal by clearing the selected pet.
  closeModal(): void {
    this.selectedPet = null;
  }
}
