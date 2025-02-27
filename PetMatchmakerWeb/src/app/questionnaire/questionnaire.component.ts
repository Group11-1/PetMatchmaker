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

  selectedRadioChoice: string = '';
  selectedDropdownChoice: string = '';

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
    this.selectedDropdownChoice = event.target.value;
  }

  onCheckboxChange(choice: Choice, event: any): void {
    if (event.target.checked) {
      if (!this.selectedChoices.includes(choice.choice)) {
        this.selectedChoices.push(choice.choice);
      }
    } else {
      const index = this.selectedChoices.indexOf(choice.choice);
      if (index > -1) {
        this.selectedChoices.splice(index, 1);
      }
    }
  }

  handleCheckboxNext(): void {
    if (this.selectedChoices.length > 0) {
      const selectedChoiceObjects = this.questions[
        this.currentQuestionIndex
      ].choices.filter((choice) =>
        this.selectedChoices.includes(choice.choice)
      );

      // Determine the next question logic (use last selected choice's next_question_id)
      const nextQuestionId =
        selectedChoiceObjects[selectedChoiceObjects.length - 1]
          ?.next_question_id;

      this.answerQuestion(this.selectedChoices, nextQuestionId);
    }
  }

  handleNext(): void {
    let selectedChoice;

    // Handle radio button selection (multiple choice)
    if (this.selectedRadioChoice) {
      selectedChoice = this.questions[this.currentQuestionIndex].choices.find(
        (choice) => choice.choice === this.selectedRadioChoice
      );
    }

    // Handle dropdown selection
    if (this.selectedDropdownChoice) {
      selectedChoice = this.questions[this.currentQuestionIndex].choices.find(
        (choice) => choice.choice === this.selectedDropdownChoice
      );
    }

    // Handle checkbox selection
    if (this.selectedChoices.length > 0) {
      // Find the selected choice objects based on the checkbox selections
      const selectedChoiceObjects = this.questions[
        this.currentQuestionIndex
      ].choices.filter((choice) =>
        this.selectedChoices.includes(choice.choice)
      );
      // Use the last selected choice's next_question_id
      selectedChoice = selectedChoiceObjects[selectedChoiceObjects.length - 1];
    }

    // If a valid selected choice exists, answer the question and move to the next one
    if (selectedChoice) {
      this.answerQuestion(
        selectedChoice.choice,
        selectedChoice.next_question_id
      );
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
  }
}
