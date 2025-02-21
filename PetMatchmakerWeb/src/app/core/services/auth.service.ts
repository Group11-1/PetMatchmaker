import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/login';

  constructor(private http: HttpClient) {}

  // Send login request to the API
  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, { username, password });
  }

  // Check if the user is logged in
  isLoggedIn(): boolean {
    const token = localStorage.getItem('jwt_token');
    return !!token;
  }

  // Save the token after login
  saveToken(token: string): void {
    localStorage.setItem('jwt_token', token);
  }

  // Clear token on logout
  logout(): void {
    localStorage.removeItem('jwt_token');
  }
}
