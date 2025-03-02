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

  errorMessage: string | null = null;
  showError: boolean = false;

  selectedChoicesMap: { [key: number]: string[] } = {};

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
          section_id: q.section_id,
          question: q.question,
          format: q.format,
          answer_type: q.answer_type,
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

  onCheckboxChange(
    choice: Choice,
    event: any,
    answerType: string,
    questionIndex: number
  ): void {
    if (!this.selectedChoicesMap[questionIndex]) {
      this.selectedChoicesMap[questionIndex] = []; // Ensure it's always initialized
    }

    if (answerType === 'single') {
      this.selectedChoicesMap[questionIndex] = [choice.choice]; // Enforce single selection
    } else {
      if (event.target.checked) {
        if (!this.selectedChoicesMap[questionIndex].includes(choice.choice)) {
          this.selectedChoicesMap[questionIndex].push(choice.choice);
        }
      } else {
        const index = this.selectedChoicesMap[questionIndex].indexOf(
          choice.choice
        );
        if (index > -1) {
          this.selectedChoicesMap[questionIndex].splice(index, 1);
        }
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

    // Check checkbox selections (using selectedChoicesMap instead of selectedChoices)
    const selectedCheckboxChoices =
      this.selectedChoicesMap[this.currentQuestionIndex] || [];

    if (!selectedChoice && selectedCheckboxChoices.length > 0) {
      const selectedChoiceObjects = this.questions[
        this.currentQuestionIndex
      ].choices.filter((choice) =>
        selectedCheckboxChoices.includes(choice.choice)
      );

      // Error handling for multiple choices when single-answer question
      if (
        selectedChoiceObjects.length > 1 &&
        this.questions[this.currentQuestionIndex].answer_type === 'single'
      ) {
        this.errorMessage =
          'Cannot select more than one choice for a single-answer question';
        this.showError = true;
        setTimeout(() => {
          this.showError = false;
        }, 5000);
        return;
      } else if (
        selectedChoiceObjects.length > 0 &&
        this.questions[this.currentQuestionIndex].answer_type === 'multiple'
      ) {
        // For multiple-answer questions, we don't need to set selectedChoice individually
        selectedChoice = selectedChoiceObjects[0]; // Just set it to any valid choice from the multiple selections
        this.showError = false; // Reset any errors if multiple choices are allowed
      }

      // Proceed logic for valid selections
      if (selectedChoiceObjects.length === 1 && !selectedChoice) {
        selectedChoice = selectedChoiceObjects[0];
      }
    }

    this.errorMessage = null;

    // Proceed to next question only if a valid selection exists
    if (selectedChoice) {
      const nextQuestionId = selectedChoice.next_question_id ?? null;
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

  getSectionHeader(): { title: string; icon: string; bgColor: string } {
    const sectionId = this.questions[this.currentQuestionIndex]?.section_id;

    switch (sectionId) {
      case 4:
        return {
          title: 'Pet Preferences',
          icon: '🐾',
          bgColor: 'pet-preferences',
        };
      case 1:
        return {
          title: 'Your Place, Their Space',
          icon: '🏡',
          bgColor: 'place-space',
        };
      case 2:
        return {
          title: 'A Peek Into Your Lifestyle',
          icon: '👀',
          bgColor: 'lifestyle',
        };
      case 3:
        return {
          title: 'Your Commitment To Care',
          icon: '❤️',
          bgColor: 'commitment',
        };
      case 5:
        return {
          title: 'Additional Information',
          icon: '📝',
          bgColor: 'additional-info',
        };
      default:
        return { title: 'Questionnaire', icon: '❓', bgColor: 'default-bg' };
    }
  }

  handleBack() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  getProgressPercentage(): number {
    const percentage =
      (this.currentQuestionIndex / this.questions.length) * 100;
    return Math.round(percentage);
  }
}
