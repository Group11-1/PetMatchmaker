import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { QuestionnaireService } from '../core/services/questionnaire.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { Question } from '../core/models/questionnaire.model';
import { Choice } from '../core/models/questionnaire.model';
import { Router } from '@angular/router';

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

  history: {
    questionId: number;
    answer: string | string[];
    nextQuestionId: number | null;
  }[] = [];
  selectedRadioAnswers: { [index: number]: string } = {};
  selectedDropdownAnswers: { [index: number]: string } = {};

  isModalVisible: boolean = false;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private questionnaireService: QuestionnaireService,
    private router: Router
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

  onDropdownChange(event: any, questionIndex: number): void {
    const selectedValue = event.target.value;

    // Initialize selectedChoicesMap for this question index if not already initialized
    if (!this.selectedChoicesMap[questionIndex]) {
      this.selectedChoicesMap[questionIndex] = []; // Initialize as an empty array
    }

    // Update selectedChoicesMap for this question
    this.selectedChoicesMap[questionIndex] = [selectedValue]; // Store selected value in array

    // Find the selected choice object from the choices array
    const selectedChoiceObject = this.questions[questionIndex].choices.find(
      (choice) => choice.choice === selectedValue
    );

    if (selectedChoiceObject) {
      console.log('Dropdown selected:', selectedChoiceObject);
    } else {
      console.error('Selected choice not found in choices array!');
    }
  }

  get selectedChoice(): string {
    // Ensure selectedChoicesMap[currentQuestionIndex] is initialized before accessing
    return this.selectedChoicesMap[this.currentQuestionIndex]?.[0] || ''; // Default to empty string if undefined
  }

  set selectedChoice(value: string) {
    // Set the selected value in the map
    this.selectedChoicesMap[this.currentQuestionIndex] = [value];
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
      // Store the radio button answer
      this.responses[this.currentQuestionIndex] = this.selectedRadioChoice;
    }

    // Check dropdown selection (only if radio hasn't already assigned selectedChoice)
    if (!selectedChoice && this.selectedDropdownChoice) {
      selectedChoice = this.questions[this.currentQuestionIndex].choices.find(
        (choice) => choice.choice === this.selectedDropdownChoice
      );
      // Store the dropdown answer
      this.responses[this.currentQuestionIndex] = this.selectedDropdownChoice;
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

      // Proceed logic for valid selections
      if (selectedChoiceObjects.length === 1 && !selectedChoice) {
        selectedChoice = selectedChoiceObjects[0];
      }
      // Store selected checkbox answers
      this.responses[this.currentQuestionIndex] = selectedCheckboxChoices;
    }

    // Free response handling
    if (!selectedChoice && this.freeResponseInput) {
      // Store free response
      this.responses[this.currentQuestionIndex] = this.freeResponseInput;
    }

    // Proceed to next question only if a valid selection exists
    if (selectedChoice || this.freeResponseInput) {
      const nextQuestionId = selectedChoice?.next_question_id ?? null;

      if (nextQuestionId !== null) {
        this.history.push({
          questionId: this.questions[this.currentQuestionIndex].id,
          answer: selectedChoice?.choice || this.freeResponseInput,
          nextQuestionId,
        });

        // Move to next question
        this.answerQuestion(
          selectedChoice?.choice || this.freeResponseInput,
          nextQuestionId
        );
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

  handleBack() {
    if (this.history.length > 0) {
      const lastEntry = this.history.pop(); // Remove the last entry from history

      // Set the current question to the last question in the history
      this.currentQuestionIndex = this.questions.findIndex(
        (q) => q.id === lastEntry?.questionId
      );

      // Optionally, reset the answer based on what was selected previously
      if (lastEntry) {
        const storedAnswer = lastEntry.answer;

        // Restore radio button selection
        if (this.responses[this.currentQuestionIndex]) {
          this.selectedRadioChoice = this.responses[this.currentQuestionIndex];
        }

        // Restore dropdown selection
        if (this.responses[this.currentQuestionIndex]) {
          this.selectedDropdownChoice =
            this.responses[this.currentQuestionIndex];
        }
      }
    }
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

  getProgressPercentage(): number {
    const percentage =
      (this.currentQuestionIndex / this.questions.length) * 100;
    return Math.round(percentage);
  }

  onSubmit() {
    const userId = this.authService.getUserId(); // Retrieve the logged-in user's ID

    if (userId === null) {
      console.error('User ID is missing. Cannot submit questionnaire.');
      return;
    }

    // Ensure question IDs match the actual DB IDs
    const answers = this.questions
      .map((question, index) => ({
        question_id: question.id, // Use actual DB ID, not array index
        answer: Array.isArray(this.responses[index])
          ? this.responses[index].join(', ')
          : this.responses[index], // Handle multiple selections
      }))
      .filter((answer) => answer.answer !== undefined); // Remove unanswered questions

    // Structure free responses separately
    const free_responses = this.freeResponseInput
      ? [
          {
            question_id: this.questions[this.questions.length - 1].id, // Ensure correct ID
            response: this.freeResponseInput,
          },
        ]
      : [];

    // Debugging
    console.log('Submitting questionnaire:', {
      user_id: userId,
      answers,
      free_responses,
    });

    this.questionnaireService
      .submitQuestionnaire(userId, answers, free_responses)
      .subscribe({
        next: (response) => {
          console.log('Questionnaire submitted successfully:', response);

          // Set progress to 100%
          this.currentQuestionIndex = this.questions.length;

          // Redirect to pet listing page
          this.router.navigate(['/pet-listing']);
        },
        error: (err) => {
          console.error('Error submitting questionnaire:', err);
        },
      });
  }

  openModal() {
    this.isModalVisible = true;
  }

  closeModal() {
    this.isModalVisible = false;
  }
}
