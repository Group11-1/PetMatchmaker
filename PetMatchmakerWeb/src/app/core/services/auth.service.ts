import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/login';
  private loggedInSubject = new BehaviorSubject<boolean>(this.isLoggedIn());

  constructor(private http: HttpClient) {}

  // Send login request to the API
  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, { username, password }).pipe(
      // On login success, update the login state
      tap(() => this.loggedInSubject.next(true))
    );
  }

  // Check if the user is logged in
  isLoggedIn(): boolean {
    const token = localStorage.getItem('jwt_token');
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

  // Clear token on logout
  logout(): void {
    localStorage.removeItem('jwt_token');
    this.loggedInSubject.next(false);
    window.location.href = '/welcome';
  }
}
