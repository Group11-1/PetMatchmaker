import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PetLisitingComponent } from './pet-lisiting.component';

describe('PetLisitingComponent', () => {
  let component: PetLisitingComponent;
  let fixture: ComponentFixture<PetLisitingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PetLisitingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PetLisitingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
