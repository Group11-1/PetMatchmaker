import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { QuestionnaireService } from '../core/services/questionnaire.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { Question } from '../core/models/questionnaire.model';
import { Choice } from '../core/models/questionnaire.model';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';

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
  selectedRadioChoicesMap: { [key: number]: string } = {};

  history: {
    questionId: number;
    answer: string | string[];
    nextQuestionId: number | null;
  }[] = [];
  selectedRadioAnswers: { [index: number]: string } = {};
  selectedDropdownAnswers: { [index: number]: string } = {};

  isModalVisible: boolean = false;

  lastQuestionId: number | null = null;

  profileComplete: boolean = false;

  responsesHistory: { [key: number]: string } = {};

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private questionnaireService: QuestionnaireService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  logout(): void {
    this.authService.logout();
    window.location.href = '/welcome';
  }

  ngOnInit() {
    this.loadQuestions();

    const userId = this.authService.getUserId();

    if (!userId) {
      console.error('User is not logged in.');
      return;
    }

    this.authService.getProfileStatus(userId).subscribe(
      (response) => {
        console.log('Profile Status:', response);
        this.profileComplete = response.profile_complete === 1; // Set profileComplete based on the API response
      },
      (error) => {
        console.error('Error fetching profile status:', error);
      }
    );

    // Fetch saved progress and responses if the user has previously started the questionnaire
    this.questionnaireService.getProgress(userId).subscribe({
      next: (data) => {
        this.lastQuestionId = data.lastQuestionId;
        this.responses = data.responses;

        // If there's progress, calculate where to resume
        if (this.lastQuestionId !== null) {
          // Find the index of the last answered question based on lastQuestionId
          const lastAnsweredQuestionIndex = this.questions.findIndex(
            (question) => question.id === this.lastQuestionId
          );

          if (lastAnsweredQuestionIndex !== -1) {
            // Log where we are resuming
            console.log('Resuming from question ID:', this.lastQuestionId);
            console.log('Resuming at index:', lastAnsweredQuestionIndex);

            // Set currentQuestionIndex to the question with the lastQuestionId
            this.currentQuestionIndex = lastAnsweredQuestionIndex;
            console.log(
              'Resuming at question ID:',
              this.questions[this.currentQuestionIndex].id
            );
          } else {
            console.log(
              'Could not find the last question, something went wrong.'
            );
          }
        }

        // Pre-fill responses if there is saved data
        this.preFillResponses();
      },
      error: (err) => {
        console.error('Error loading progress:', err);
      },
    });
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

  preFillResponses(): void {
    console.log('Loading Pre-Filled Responses:', this.responses);

    // Reset selections
    this.selectedRadioChoicesMap = {};
    this.selectedChoicesMap = {};
    this.freeResponseInput = ''; // Reset free response input
    this.history = []; // Reset history to avoid duplicate entries

    const responseEntries = Object.entries(this.responses);

    for (let i = 0; i < responseEntries.length; i++) {
      const [questionId, response] = responseEntries[i];

      // Find the corresponding question
      const numericQuestionId = Number(response.question_id);
      const questionIndex = this.questions.findIndex(
        (q) => q.id === numericQuestionId
      );

      if (questionIndex === -1) {
        console.warn(
          `Question ID ${numericQuestionId} not found in questions list.`
        );
        continue;
      }

      const question = this.questions[questionIndex];

      console.log(`Processing Question ID: ${numericQuestionId}`);
      console.log(`Stored Response:`, response.answer);
      console.log(`Question Type: ${question.format}`);

      // Restore answer directly in UI model
      switch (question.format) {
        case 'multiple_choice': // Radio button
          this.selectedRadioChoicesMap[questionIndex] =
            response.answer as string;
          console.log(
            'Restoring Radio Button Answer:',
            this.selectedRadioChoicesMap[questionIndex]
          );
          break;

        case 'dropdown': // Dropdown select
          this.selectedChoicesMap[questionIndex] = [response.answer as string];
          console.log(
            'Restoring Dropdown Answer:',
            this.selectedChoicesMap[questionIndex]
          );
          break;

        case 'checkbox': // Multiple choice checkboxes
          this.selectedChoicesMap[questionIndex] = Array.isArray(
            response.answer
          )
            ? response.answer
            : [response.answer]; // Convert to array if needed
          console.log(
            'Restoring Checkbox Answers:',
            this.selectedChoicesMap[questionIndex]
          );
          break;

        case 'free_response': // Text input
          this.freeResponseInput = response.response as string;
          console.log('Restoring Free Response:', this.freeResponseInput);
          break;

        default:
          console.warn(`Unhandled question format: ${question.format}`);
          break;
      }

      // Maintain history for navigation, but exclude the last question
      if (i < responseEntries.length - 1) {
        // Ensures it's not the last question
        this.history.push({
          questionId: numericQuestionId,
          answer: response.answer,
          nextQuestionId: this.getNextQuestionId(
            Array.isArray(response.answer)
              ? response.answer
              : [response.answer],
            question
          ),
        });
      }
    }

    console.log('Final Selected Answers:', {
      Radio: this.selectedRadioChoicesMap,
      Dropdown: this.selectedChoicesMap,
      FreeResponse: this.freeResponseInput,
    });

    // *** Ensure UI updates immediately ***
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
  }

  // Helper method to get next_question_id from choices array based on the selected answer(s)
  getNextQuestionId(selectedAnswers: string[], question: any): number | null {
    // Find the choice in the question's choices array that matches the selected answer(s)
    const choice = question.choices.find((choice: any) =>
      selectedAnswers.includes(choice.choice)
    );

    // Return the next_question_id of the matched choice, or null if not found
    return choice ? choice.next_question_id : null;
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

  //changed
  handleNext(): void {
    console.log('handleNext() triggered');

    let selectedChoice: Choice | undefined = undefined;

    // Check for pre-filled answer first
    if (this.responses[this.currentQuestionIndex]) {
      const preFilledAnswer = this.responses[this.currentQuestionIndex];

      console.log('Pre-filled answer found:', preFilledAnswer);

      // Identify if it's a radio button, dropdown, or checkbox, and set the selection
      if (typeof preFilledAnswer === 'string') {
        selectedChoice = this.questions[this.currentQuestionIndex].choices.find(
          (choice) => choice.choice === preFilledAnswer
        );
        this.responses[this.currentQuestionIndex] = preFilledAnswer;
        console.log('Pre-filled Radio Answer:', preFilledAnswer);
      } else if (Array.isArray(preFilledAnswer)) {
        selectedChoice = this.questions[
          this.currentQuestionIndex
        ].choices.filter((choice) =>
          preFilledAnswer.includes(choice.choice)
        )[0];
        this.responses[this.currentQuestionIndex] = preFilledAnswer;
        console.log('Pre-filled Checkbox Answers:', preFilledAnswer);
      }
    }

    // Check radio button selection (for new selections)
    if (
      !selectedChoice &&
      this.selectedRadioChoicesMap[this.currentQuestionIndex]
    ) {
      selectedChoice = this.questions[this.currentQuestionIndex].choices.find(
        (choice) =>
          choice.choice ===
          this.selectedRadioChoicesMap[this.currentQuestionIndex]
      );
      this.responses[this.currentQuestionIndex] =
        this.selectedRadioChoicesMap[this.currentQuestionIndex];
      console.log(
        'Radio Answer selected:',
        this.selectedRadioChoicesMap[this.currentQuestionIndex]
      );
    }

    // Check dropdown selection (for new selections)
    if (!selectedChoice && this.selectedDropdownChoice) {
      selectedChoice = this.questions[this.currentQuestionIndex].choices.find(
        (choice) => choice.choice === this.selectedDropdownChoice
      );
      this.responses[this.currentQuestionIndex] = this.selectedDropdownChoice;
      console.log('Dropdown Answer selected:', this.selectedDropdownChoice);
    }

    // Check checkbox selections (for new selections)
    const selectedCheckboxChoices =
      this.selectedChoicesMap[this.currentQuestionIndex] || [];
    if (!selectedChoice && selectedCheckboxChoices.length > 0) {
      const selectedChoiceObjects = this.questions[
        this.currentQuestionIndex
      ].choices.filter((choice) =>
        selectedCheckboxChoices.includes(choice.choice)
      );
      if (selectedChoiceObjects.length === 1 && !selectedChoice) {
        selectedChoice = selectedChoiceObjects[0];
      }
      this.responses[this.currentQuestionIndex] = selectedCheckboxChoices;
      console.log('Checkbox Answers selected:', selectedCheckboxChoices);
    }

    // Free response handling
    if (!selectedChoice && this.freeResponseInput) {
      this.responses[this.currentQuestionIndex] = this.freeResponseInput;
      console.log('Free Response Answer:', this.freeResponseInput);
    }

    // Proceed to next question only if a valid selection exists
    if (selectedChoice || this.freeResponseInput) {
      const nextQuestionId = selectedChoice?.next_question_id ?? null;
      console.log('Next Question ID:', nextQuestionId);

      if (nextQuestionId !== null) {
        this.history.push({
          questionId: this.questions[this.currentQuestionIndex].id,
          answer: selectedChoice?.choice || this.freeResponseInput,
          nextQuestionId,
        });

        console.log('Pushing to history:', {
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
    console.log('handleBack() triggered');

    if (this.history.length > 0) {
      const lastEntry = this.history.pop();
      console.log('Popped last entry from history:', lastEntry);

      // Set the current question to the last question in the history
      this.currentQuestionIndex = this.questions.findIndex(
        (q) => q.id === lastEntry?.questionId
      );

      console.log('Restored Question ID:', lastEntry?.questionId);
      console.log(
        'Current Question Index after going back:',
        this.currentQuestionIndex
      );

      if (lastEntry) {
        const storedAnswer = lastEntry.answer;
        console.log('Restoring stored answer:', storedAnswer);

        // Check if storedAnswer is defined
        if (storedAnswer !== undefined && storedAnswer !== null) {
          // Restore radio button selection (if the current question is a radio button question)
          if (
            this.questions[this.currentQuestionIndex]?.format ===
            'multiple_choice'
          ) {
            this.selectedRadioChoicesMap[this.currentQuestionIndex] =
              storedAnswer as string;
            console.log(
              'Restoring Radio Button Answer:',
              this.selectedRadioChoicesMap[this.currentQuestionIndex]
            );
          }

          // Restore dropdown selection (if the current question is a dropdown)
          if (
            this.questions[this.currentQuestionIndex]?.format === 'dropdown'
          ) {
            this.selectedChoicesMap[this.currentQuestionIndex] = [
              storedAnswer as string,
            ];
            console.log(
              'Restoring Dropdown Answer:',
              this.selectedChoicesMap[this.currentQuestionIndex]
            );
          }

          // Restore checkbox selections (if the current question is a checkbox question)
          if (
            this.questions[this.currentQuestionIndex]?.format === 'checkbox'
          ) {
            this.selectedChoicesMap[this.currentQuestionIndex] = Array.isArray(
              storedAnswer
            )
              ? storedAnswer
              : [storedAnswer];
            console.log(
              'Restoring Checkbox Answers:',
              this.selectedChoicesMap[this.currentQuestionIndex]
            );
          }

          // Restore free response (if the current question is a free response)
          if (
            this.questions[this.currentQuestionIndex]?.format ===
            'free_response'
          ) {
            this.freeResponseInput = storedAnswer as string;
            console.log('Restoring Free Response:', this.freeResponseInput);
          }
        } else {
          console.log(
            'Stored answer is undefined or null for question:',
            lastEntry?.questionId
          );
        }
      }
    } else {
      console.log('No history available, cannot go back!');
    }
  }

  getSectionHeader(): {
    title: string;
    icon: string;
    bgColor: string;
    image: string;
  } {
    const sectionId = this.questions[this.currentQuestionIndex]?.section_id;

    switch (sectionId) {
      case 4:
        return {
          title: 'Pet Preferences',
          icon: '🐾',
          bgColor: 'pet-preferences',
          image: '/assets/img/Commitment Facts.png',
        };
      case 1:
        return {
          title: 'Your Place, Their Space',
          icon: '🏡',
          bgColor: 'place-space',
          image: '/assets/img/Living Section Facts.png',
        };
      case 2:
        return {
          title: 'A Peek Into Your Lifestyle',
          icon: '👀',
          bgColor: 'lifestyle',
          image: '/assets/img/Lifestyle Facts.png',
        };
      case 3:
        return {
          title: 'Your Commitment To Care',
          icon: '❤️',
          bgColor: 'commitment',
          image: '/assets/img/Commitment Facts.png',
        };
      case 5:
        return {
          title: 'Additional Information',
          icon: '📝',
          bgColor: 'additional-info',
          image: '/assets/img/Living Section Facts.png',
        };
      default:
        return {
          title: 'Questionnaire',
          icon: '❓',
          bgColor: 'default-bg',
          image: '',
        };
    }
  }

  getProgressPercentage(): number {
    // Calculate base progress as a percentage based on current question index
    let percentage = (this.currentQuestionIndex / this.questions.length) * 100;

    // If it's the last question (free response), check if a response is filled
    if (
      this.currentQuestionIndex === this.questions.length - 1 &&
      this.questions[this.currentQuestionIndex].format === 'free_response' &&
      this.freeResponseInput.trim() === ''
    ) {
      // If the last question is a free response and it's empty, set progress below 100%
      percentage = (this.currentQuestionIndex / this.questions.length) * 100;
    } else if (
      this.currentQuestionIndex === this.questions.length - 1 &&
      this.questions[this.currentQuestionIndex].format === 'free_response' &&
      this.freeResponseInput.trim() !== ''
    ) {
      // If it's the last question and there is an answer, set the progress to 100%
      percentage = 100;
    }

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
      .map((question, question_id) => {
        // Only process questions that come after the last answered question
        if (
          this.lastQuestionId !== null &&
          question.id <= this.lastQuestionId
        ) {
          return null; // Skip already answered questions
        }

        let response = this.responses[question_id];

        if (Array.isArray(response)) {
          // Convert array to string, separating items with commas
          response = response.length > 0 ? response.join(', ') : '';
        } else if (response && typeof response === 'object') {
          // If the response is an object, extract the actual 'answer' value
          if (response.hasOwnProperty('answer')) {
            response = response['answer']; // Extract only the 'answer' field
          } else {
            // Handle case where response is an unexpected object format
            response = '';
          }
        } else if (response !== undefined && response !== null) {
          // Ensure non-array and non-object values are strings
          response = String(response).trim();
        } else {
          response = ''; // Default to empty string
        }

        return {
          question_id: question.id, // Use actual DB ID
          answer: response, // Ensure string format
        };
      })
      .filter((answer) => answer !== null && answer.answer !== ''); // Remove skipped/empty responses

    // Structure free responses separately
    const free_responses =
      this.freeResponseInput && this.freeResponseInput.trim()
        ? [
            {
              question_id: this.questions[this.questions.length - 1].id, // Ensure correct last question ID
              response: this.freeResponseInput.trim(),
            },
          ]
        : [];

    // Debugging
    console.log('Submitting questionnaire:', {
      user_id: userId,
      answers,
      free_responses,
    });

    // Submit to the backend
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

  saveProgress(): void {
    const userId = this.authService.getUserId(); // Retrieve the logged-in user's ID

    if (userId === null) {
      console.error('User ID is missing. Cannot save progress.');
      return;
    }

    // Ensure question IDs match the actual DB IDs
    const answers = this.questions
      .map((question, question_id) => {
        // Only process questions that come after the last answered question
        if (
          this.lastQuestionId !== null &&
          question.id <= this.lastQuestionId
        ) {
          return null; // Skip already answered questions
        }

        let response = this.responses[question_id];

        if (Array.isArray(response)) {
          // Convert array to string, separating items with commas
          response = response.length > 0 ? response.join(', ') : '';
        } else if (response && typeof response === 'object') {
          // If the response is an object, extract the actual 'answer' value
          if (response.hasOwnProperty('answer')) {
            response = response['answer']; // Extract only the 'answer' field
          } else {
            // Handle case where response is an unexpected object format
            response = '';
          }
        } else if (response !== undefined && response !== null) {
          // Ensure non-array and non-object values are strings
          response = String(response).trim();
        } else {
          response = ''; // Default to empty string
        }

        return {
          question_id: question.id, // Use actual DB ID
          answer: response, // Ensure string format
        };
      })
      .filter((answer) => answer !== null && answer.answer !== ''); // Remove skipped/empty responses

    // Ensure answers array isn't empty and fetch the last question ID
    const lastQuestionId =
      answers && Array.isArray(answers) && answers.length > 0
        ? answers[answers.length - 1]?.question_id
        : null;

    if (lastQuestionId === null) {
      console.error('No last question ID found. Cannot save progress.');
      return;
    }

    // Structure free responses separately
    const free_responses =
      this.freeResponseInput && this.freeResponseInput.trim()
        ? [
            {
              question_id: this.questions[this.questions.length - 1].id, // Ensure correct last question ID
              response: this.freeResponseInput.trim(),
            },
          ]
        : [];

    // Debugging
    console.log('Saving progress:', {
      user_id: userId,
      lastQuestionId,
      answers,
      free_responses,
    });

    // Pass the lastQuestionId to the service, ensure it's not null
    this.questionnaireService
      .saveProgress(userId, lastQuestionId ?? -1, answers, free_responses) // Fallback to -1 if lastQuestionId is null
      .subscribe({
        next: (response) => {
          console.log('Progress saved successfully:', response);
          // Redirect to pet-listing page after successful save
          this.router.navigate(['/pet-listing']);
        },
        error: (err) => {
          console.error('Error saving progress:', err);
        },
      });
  }

  openModal() {
    if (this.profileComplete) {
      this.router.navigate(['/pet-listing']); // Redirects user immediately if profile is complete
    } else {
      this.isModalVisible = true; // Shows the modal if the questionnaire isn't complete
    }
  }

  closeModal() {
    this.isModalVisible = false;
  }

  closeModalAndExit() {
    this.isModalVisible = false;
    this.router.navigate(['/pet-listing']);
  }
}
