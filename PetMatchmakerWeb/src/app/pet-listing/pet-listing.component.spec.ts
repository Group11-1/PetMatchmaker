import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PetListingComponent } from './pet-listing.component';

describe('PetListingComponent', () => {
  let component: PetListingComponent;
  let fixture: ComponentFixture<PetListingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PetListingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PetListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
