import {
  Component,
  OnInit,
  HostListener,
  ViewChild,
  Renderer2,
  AfterViewInit,
} from '@angular/core';
import { PetService } from '../core/services/petfinder.service';
import { Pet } from '../core/models/pet';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faFilter, faSearch } from '@fortawesome/free-solid-svg-icons';
import { PetCardComponent } from '../pet-card/pet-card.component';
import { Breed } from '../core/models/pet';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { NgModule } from '@angular/core';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-pet-lisiting',
  imports: [
    CommonModule,
    FontAwesomeModule,
    PetCardComponent,
    FormsModule,
    MatSidenavModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatDrawer,
  ],
  templateUrl: './pet-lisiting.component.html',
  styleUrl: './pet-lisiting.component.css',
})
export class PetLisitingComponent {
  pets: Pet[] = [];
  selectedPet: Pet | null = null;
  noPetsFound: boolean = false;

  faFilter = faFilter;
  faSearch = faSearch;

  loading: boolean = true;
  currentPage: number = 1;
  totalPages: number = 1;

  searchedPets: any[] = [];
  searchQuery: string = '';
  searchQuerySubject = new Subject<string>();

  animalTypes: string[] = ['Dog', 'Cat'];
  selectedAnimalTypes: string[] = [];
  breeds: string[] = [];
  selectedBreed: string = '';

  // Predefined values for the filters
  sizes: string[] = ['Small', 'Medium', 'Large', 'X-Large'];
  ages: string[] = ['Baby', 'Young', 'Adult', 'Senior'];
  genders: string[] = ['Male', 'Female'];

  // Selected filter values
  selectedSize: string = '';
  selectedAge: string = '';
  selectedGender: string[] = [];

  // Selected animals
  selectedAnimals: string[] = [];

  filteredPets: Pet[] = [];

  hasClickedBreed: boolean = false;

  @ViewChild('drawer') drawer!: MatDrawer;

  constructor(private petService: PetService, private renderer: Renderer2) {}

  ngOnInit(): void {
    // Load pets when the component initializes
    this.loadPets();

    // Set up dynamic margin for pet list (header adjustment)
    const header = document.querySelector('header');
    const headerHeight = header ? (header as HTMLElement).offsetHeight : 0;
    const petList = document.querySelector('.pet-list');

    if (petList) {
      (petList as HTMLElement).style.marginTop = `${headerHeight}px`;
    }

    // Subscribe to search query changes and fetch pets dynamically
    this.searchQuerySubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          if (query.trim()) {
            return this.petService.searchPets(query, 1); // Fetch searched pets
          } else {
            return this.petService.getPets(1); // Fetch all pets if query is empty
          }
        })
      )
      .subscribe(
        (response) => {
          if (this.searchQuery.trim()) {
            this.searchedPets = response.animals || [];
          } else {
            this.pets = response.animals || [];
          }
          this.currentPage = response.pagination.current_page || 1;
          this.totalPages = response.pagination.total_pages || 1;
        },
        (error) => {
          console.error('Error fetching pets:', error);
        }
      );
  }

  ngAfterViewInit() {
    // Watch for when the drawer is opened or closed
    this.drawer.openedChange.subscribe((isOpened) => {
      if (isOpened) {
        // Disable scrolling on both html and body when the sidenav is open
        this.renderer.setStyle(document.documentElement, 'overflow', 'hidden');
        this.renderer.setStyle(document.body, 'overflow', 'hidden');
        this.renderer.setStyle(document.body, 'position', 'fixed');
        this.renderer.setStyle(document.body, 'width', '100%');
      } else {
        // Re-enable scrolling when the sidenav is closed
        this.renderer.removeStyle(document.documentElement, 'overflow');
        this.renderer.removeStyle(document.body, 'overflow');
        this.renderer.removeStyle(document.body, 'position');
        this.renderer.removeStyle(document.body, 'width');
      }
    });
  }

  loadPets(page: number = 1): void {
    this.loading = true;
    this.noPetsFound = false;

    if (this.searchQuery.trim()) {
      // If search is active, fetch searched pets with pagination
      this.petService.searchPets(this.searchQuery, page).subscribe(
        (response: any) => {
          this.searchedPets = response.animals || [];
          this.currentPage = response.pagination.current_page || 1;
          this.totalPages = response.pagination.total_pages || 1;
          this.loading = false;
          this.noPetsFound = this.searchedPets.length === 0;
        },
        (error) => {
          console.error('Error searching pets:', error);
          this.loading = false;
          this.noPetsFound = true;
        }
      );
    } else {
      // Otherwise, fetch all pets with pagination
      this.petService.getPets(page).subscribe(
        (response: any) => {
          this.pets = response.animals || [];
          this.currentPage = response.pagination.current_page || 1;
          this.totalPages = response.pagination.total_pages || 1;
          this.loading = false;
          this.noPetsFound = this.pets.length === 0;
        },
        (error) => {
          console.error('Error fetching pets:', error);
          this.loading = false;
          this.noPetsFound = true;
        }
      );
    }
  }

  //Shorten Name if needed
  getPetName(pet: any): string {
    const nameParts = pet.name.split(' ');
    if (nameParts.length > 1) {
      return `${nameParts[0]} ${nameParts[1]}`;
    }
    return pet.name;
  }

  //Get a valid pet image
  getImageUrl(pet: any): string {
    // Check if primary_photo_cropped has the small, medium, large, or full image sizes
    const primaryPhoto = pet.primary_photo_cropped;

    // First, try to get the primary photo in the preferred order: small, medium, large, full
    if (primaryPhoto) {
      if (primaryPhoto.small) return primaryPhoto.small;
      if (primaryPhoto.medium) return primaryPhoto.medium;
      if (primaryPhoto.large) return primaryPhoto.large;
      if (primaryPhoto.full) return primaryPhoto.full;
    }

    // If no valid primary photo, check the photos array
    if (pet.photos && pet.photos.length > 0) {
      // Iterate through the photos array to find the first valid image
      for (const photo of pet.photos) {
        if (photo.small) return photo.small;
        if (photo.medium) return photo.medium;
        if (photo.large) return photo.large;
        if (photo.full) return photo.full;
      }
    }

    // Return a default image URL if no valid photo is found
    return '/assets/img/Website Icon.png';
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.loadPets(this.currentPage + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.loadPets(this.currentPage - 1);
    }
  }

  lastScrollTop: number = 0;

  @HostListener('window:scroll', ['$event'])
  onScroll(event: any): void {
    const currentScroll =
      window.pageYOffset || document.documentElement.scrollTop;

    if (currentScroll > this.lastScrollTop) {
      // Scrolling down - hide header
      document.querySelector('header')?.classList.add('hide');
    } else {
      // Scrolling up - show header
      document.querySelector('header')?.classList.remove('hide');
    }

    this.lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
  }

  onSearch(): void {
    this.searchQuerySubject.next(this.searchQuery);
  }

  // Fetch breeds based on animal type from the PetService
  fetchBreeds(animal: string) {
    this.petService.getBreedsByType(animal).subscribe(
      (response) => {
        // Update the breeds array with the fetched breed names
        this.breeds = response.breeds.map(
          (breed: { name: string }) => breed.name
        );
      },
      (error) => {
        console.error('Error fetching breeds:', error);
      }
    );
  }

  // Handle changes to selected animal types
  onAnimalTypeChange(event: any) {
    const animal = event.target.value;
    if (event.target.checked) {
      this.selectedAnimalTypes.push(animal);
      this.fetchBreeds(animal);
    } else {
      this.selectedAnimalTypes = this.selectedAnimalTypes.filter(
        (a) => a !== animal
      );

      if (this.selectedAnimalTypes.length === 0) {
        this.breeds = [];
      }
    }
  }

  onGenderChange(event: any) {
    const gender = event.target.value;
    if (event.target.checked) {
      this.selectedGender.push(gender);
    } else {
      this.selectedGender = this.selectedGender.filter((g) => g !== gender);
    }
  }

  filterPets() {
    this.filteredPets = this.pets.filter((pet) => {
      // Filter by Animal Type
      const animalTypeMatch =
        this.selectedAnimalTypes.length === 0 ||
        this.selectedAnimalTypes.includes(pet.type);

      // Filter by Breed
      const breedMatch =
        !this.selectedBreed || pet.breeds.primary === this.selectedBreed;

      // Filter by Size
      const sizeMatch = !this.selectedSize || pet.size === this.selectedSize;

      // Filter by Age
      const ageMatch = !this.selectedAge || pet.age === this.selectedAge;

      // Filter by Gender
      const genderMatch =
        this.selectedGender.length === 0 ||
        this.selectedGender.includes(pet.gender);

      // Return true if all selected filters match the pet
      return (
        animalTypeMatch && breedMatch && sizeMatch && ageMatch && genderMatch
      );
    });
  }

  // Call this method whenever a filter is changed
  onFilterChange() {
    this.filterPets();
  }

  resetFilters() {
    // Reset selected filters
    this.selectedAnimalTypes = [];
    this.selectedBreed = '';
    this.selectedSize = '';
    this.selectedAge = '';
    this.selectedGender = [];

    this.searchQuery = '';

    this.filterPets();
  }

  onBreedDropdownClick() {
    this.hasClickedBreed = true;
  }

  openModal(pet: Pet): void {
    this.selectedPet = pet;
  }

  closeModal(): void {
    this.selectedPet = null;
  }
}
