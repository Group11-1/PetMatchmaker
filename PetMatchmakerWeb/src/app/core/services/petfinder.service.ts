import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pet } from '../models/pet';
@Injectable({
  providedIn: 'root',
})
export class PetService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getPets(page: number = 1): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/pets?page=${page}`);
  }

  // Method to search pets by name
  searchPets(name: string, page: number = 1): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/searchPets?name=${name}&page=${page}`
    );
  }

  getBreedsByType(animalType: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/breeds/${animalType}`);
  }
}
