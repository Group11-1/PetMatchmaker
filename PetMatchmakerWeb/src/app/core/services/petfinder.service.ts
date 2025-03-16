import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pet } from '../models/pet';
@Injectable({
  providedIn: 'root',
})
export class PetService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getPets(): Observable<Pet[]> {
    return this.http.get<Pet[]>(`${this.apiUrl}/pets`);
  }
}
