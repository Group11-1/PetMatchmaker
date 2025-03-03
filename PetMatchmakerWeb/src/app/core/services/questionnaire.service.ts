import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Question } from '../models/questionnaire.model';

@Injectable({
  providedIn: 'root',
})
export class QuestionnaireService {
  private apiUrl = 'http://localhost:3000/api/questions';

  constructor(private http: HttpClient) {}

  loadQuestions(): Observable<Question[]> {
    return this.http.get<Question[]>(this.apiUrl);
  }

  submitQuestionnaire(
    user_id: number,
    answers: any[],
    free_responses: any[]
  ): Observable<any> {
    const submissionData = {
      user_id,
      answers,
      free_responses,
    };

    return this.http.post(
      'http://localhost:3000/api/submit-questionnaire',
      submissionData
    );
  }

  saveProgress(
    userId: number,
    questionId: number,
    answer: string
  ): Observable<any> {
    const body = { user_id: userId, question_id: questionId, answer };
    return this.http.post<any>('http://localhost:3000/api/save-progress', body);
  }
}
