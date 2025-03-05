import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

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
          const userId = this.getUserId(); // Get the userId from the token
          console.log('User ID:', userId); // Log the userId in the console
          if (userId !== null) {
            this.saveUserId(userId); // Save the userId to localStorage
          }
        }
        this.loggedInSubject.next(true); // Update login state
      })
    );
  }

  // Admin login
  loginAdmin(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin`, {
      username,
      password,
    });
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
    return this.http
      .post<any>('http://localhost:3000/api/signup', userData)
      .pipe(
        tap((response) => {
          if (response.token) {
            this.saveToken(response.token); // Save the JWT token to localStorage
            const userId = this.getUserId(); // Get the user ID from the token
            console.log('User ID after signup:', userId); // Debugging
            if (userId) {
              this.saveUserId(userId); // Save the user ID to localStorage if available
            }
          }
        })
      );
  }

  //Clears token only
  clearToken() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('jwt_token');
  }

  // Clear token on logout
  logout(): void {
    localStorage.removeItem('jwt_token');
    this.loggedInSubject.next(false);
    window.location.href = '/welcome';
  }

  saveUserId(userId: number): void {
    localStorage.setItem('userId', userId.toString());
  }

  // Get user ID from token
  getUserId(): number | null {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token); // Decode the token
        return decodedToken?.userId ?? null; // Access userId instead of user_id
      } catch (error) {
        console.error('Failed to decode token:', error);
        return null; // Return null if there's an error decoding the token
      }
    }
    return null; // Return null if no token is found
  }

  // Method to get profile status
  getProfileStatus(userId: number): Observable<any> {
    return this.http.get<any>(
      'http://localhost:3000/api/user/profile-status/' + userId
    );
  }
}
