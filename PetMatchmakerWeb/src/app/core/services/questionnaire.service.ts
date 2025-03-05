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
    lastQuestionId: number,
    answers: any[],
    free_responses: any[]
  ) {
    const finalLastQuestionId =
      lastQuestionId ??
      (answers.length > 0 ? answers[answers.length - 1].question_id : null);

    return this.http.post('http://localhost:3000/api/save-progress', {
      user_id: userId,
      lastQuestionId: finalLastQuestionId,
      answers,
      free_responses,
    });
  }

  getProgress(userId: number): Observable<any> {
    return this.http.get<any>(
      'http://localhost:3000/api/questionnaire/progress/' + userId
    );
  }
}
