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
    this.selectedDropdownChoice = event.target.value; // Store selected choice

    const selectedChoiceObject = this.questions[
      this.currentQuestionIndex
    ].choices.find((choice) => choice.choice === this.selectedDropdownChoice);

    if (selectedChoiceObject) {
      console.log('Dropdown selected:', selectedChoiceObject);
    } else {
      console.error('Selected choice not found in choices array!');
    }
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

  handleNext(): void {
    let selectedChoice: Choice | undefined = undefined;

    // Check radio button selection
    if (this.selectedRadioChoice) {
      selectedChoice = this.questions[this.currentQuestionIndex].choices.find(
        (choice) => choice.choice === this.selectedRadioChoice
      );
    }

    // Check dropdown selection (only if radio hasn't already assigned selectedChoice)
    if (!selectedChoice && this.selectedDropdownChoice) {
      selectedChoice = this.questions[this.currentQuestionIndex].choices.find(
        (choice) => choice.choice === this.selectedDropdownChoice
      );
    }

    // Check checkbox selections (multiple choices)
    if (!selectedChoice && this.selectedChoices.length > 0) {
      const selectedChoiceObjects = this.questions[
        this.currentQuestionIndex
      ].choices.filter((choice) =>
        this.selectedChoices.includes(choice.choice)
      );

      if (selectedChoiceObjects.length > 0) {
        selectedChoice =
          selectedChoiceObjects[selectedChoiceObjects.length - 1]; // Pick the last selected checkbox
      }
    }

    if (selectedChoice) {
      const nextQuestionId = selectedChoice.next_question_id ?? null; // Handle undefined case

      if (nextQuestionId !== null) {
        console.log('Proceeding to next question:', selectedChoice);
        this.answerQuestion(selectedChoice.choice, nextQuestionId);
      } else {
        console.error('No next question ID provided, cannot proceed!');
      }
    } else {
      console.error('No valid selection found, unable to proceed!');
    }
  }

  answerQuestion(
    answer: string | string[],
    nextQuestionId: number | null
  ): void {
    if (nextQuestionId === null) {
      console.error('Next question ID is null. Stopping progression.');
      return;
    }

    console.log(
      'Answer submitted:',
      answer,
      'Next question ID:',
      nextQuestionId
    );

    const nextQuestionIndex = this.questions.findIndex(
      (q) => q.id === nextQuestionId
    );

    if (nextQuestionIndex === -1) {
      console.error(
        'Next question not found in the questions array:',
        nextQuestionId
      );
      return;
    }

    console.log('Moving to next question at index:', nextQuestionIndex);
    this.currentQuestionIndex = nextQuestionIndex;
  }
}
