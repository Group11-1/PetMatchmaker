import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { QuestionnaireService } from '../core/services/questionnaire.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { Question } from '../core/models/questionnaire.model';

@Component({
  selector: 'app-questionnaire',
  imports: [CommonModule, FormsModule],
  templateUrl: './questionnaire.component.html',
  styleUrl: './questionnaire.component.css',
})
export class QuestionnaireComponent implements OnInit {
  questions: Question[] = [];
  currentQuestionIndex = 0;
  responses: { [key: number]: any } = {};
  freeResponseInput: string = '';
  loading = true;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private questionnaireService: QuestionnaireService
  ) {}

  logout(): void {
    this.authService.logout();
    window.location.href = '/welcome';
  }

  ngOnInit() {
    this.loadQuestions();
  }

  loadQuestions(): void {
    this.questionnaireService.loadQuestions().subscribe({
      next: (data) => {
        this.questions = data.map((q) => ({
          id: q.id,
          question: q.question,
          format: q.format,
          choices: q.choices.map((c) => ({
            choice: c.choice,
            nextQuestionId: c.nextQuestionId,
          })),
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading questions:', err);
        this.loading = false;
      },
    });
  }

  answerQuestion(answer: any, nextQuestionId?: number): void {
    const currentQuestion = this.questions[this.currentQuestionIndex];
    this.responses[currentQuestion.id] = answer;

    // Navigate to the next question if nextQuestionId is provided
    if (nextQuestionId) {
      const nextIndex = this.questions.findIndex(
        (q) => q.id === nextQuestionId
      );
      if (nextIndex !== -1) {
        this.currentQuestionIndex = nextIndex;
      }
    } else {
      this.currentQuestionIndex++;
    }
  }
}
