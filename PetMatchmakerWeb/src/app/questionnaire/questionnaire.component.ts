import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { QuestionnaireService } from '../core/services/questionnaire.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { Question } from '../core/models/questionnaire.model';
import { Choice } from '../core/models/questionnaire.model';

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

  selectedChoices: string[] = [];

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
          choices: q.choices,
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading questions:', err);
        this.loading = false;
      },
    });
  }

  onDropdownChange(event: any): void {
    const selectedChoice = event.target.value;
    const selectedChoiceObject = this.questions[
      this.currentQuestionIndex
    ].choices.find((choice) => choice.choice === selectedChoice);

    if (selectedChoiceObject) {
      this.answerQuestion(
        selectedChoice,
        selectedChoiceObject.next_question_id
      );
    }
  }

  // Function to handle checkbox selection changes
  onCheckboxChange(choice: string, event: any): void {
    if (event.target.checked) {
      // If the checkbox is checked, add it to the array
      if (!this.selectedChoices.includes(choice)) {
        this.selectedChoices.push(choice);
      }
    } else {
      // If the checkbox is unchecked, remove it from the array
      const index = this.selectedChoices.indexOf(choice);
      if (index > -1) {
        this.selectedChoices.splice(index, 1);
      }
    }
  }

  // Function to proceed to the next question
  proceedToNextQuestion(): void {
    console.log(`Current Question Index: ${this.currentQuestionIndex}`);

    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      console.log(
        `Moved to Next Question ID: ${
          this.questions[this.currentQuestionIndex].id
        }`
      );
    } else {
      console.log('End of questionnaire reached.');
    }
  }

  answerQuestion(answer: any, nextQuestionId?: number): void {
    const currentQuestion = this.questions[this.currentQuestionIndex];
    console.log(
      `Answering Question ID: ${currentQuestion.id}, Answer: ${answer}`
    );
    console.log(`Next Question ID (if exists):`, nextQuestionId);

    this.responses[currentQuestion.id] = answer;

    if (nextQuestionId) {
      const nextIndex = this.questions.findIndex(
        (q) => q.id === nextQuestionId
      );
      console.log(`Next Question Index Found: ${nextIndex}`);

      if (nextIndex !== -1) {
        this.currentQuestionIndex = nextIndex;
        console.log(
          `Navigating to Question ID: ${
            this.questions[this.currentQuestionIndex].id
          }`
        );
        return;
      }
    }

    console.log(`Proceeding sequentially to next question.`);
    this.proceedToNextQuestion();
  }
}
