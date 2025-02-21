import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/login';
  private isAdmin: boolean = false;
  private loggedInSubject = new BehaviorSubject<boolean>(this.isLoggedIn());

  constructor(private http: HttpClient) {}

  getIsAdmin(): boolean {
    return this.isAdmin;
  }

  // Send login request to the API
  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, { username, password }).pipe(
      tap((response) => {
        if (response.token) {
          this.saveToken(response.token); // Save the JWT token to localStorage
          this.isAdmin = response.isAdmin; // Store the admin status
        }
        this.loggedInSubject.next(true); // Update login state
      })
    );
  }

  // Check if the user is logged in
  isLoggedIn(): boolean {
    const token = localStorage.getItem('jwt_token');
    console.log('Token from localStorage:', token); // Add this for debugging
    return !!token;
  }

  // Return the login state observable
  getLoginStatus(): Observable<boolean> {
    return this.loggedInSubject.asObservable();
  }

  // Save the token after login
  saveToken(token: string): void {
    localStorage.setItem('jwt_token', token);
    this.loggedInSubject.next(true);
  }

  // Sign Up & Auto Login
  signup(userData: any): Observable<any> {
    return this.http.post<any>('http://localhost:3000/api/signup', userData);
  }

  // Clear token on logout
  logout(): void {
    localStorage.removeItem('jwt_token');
    this.loggedInSubject.next(false);
    window.location.href = '/welcome';
  }
}
