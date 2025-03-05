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

        if (this.lastQuestionId !== null) {
          const lastAnsweredQuestionIndex = this.questions.findIndex(
            (question) => question.id === this.lastQuestionId
          );

          if (lastAnsweredQuestionIndex !== -1) {
            this.currentQuestionIndex = lastAnsweredQuestionIndex;
          }
        }

        this.preFillResponses();
      },
      error: (err) => {},
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

    this.selectedRadioChoicesMap = {};
    this.selectedChoicesMap = {};
    this.freeResponseInput = '';
    this.history = [];

    const responseEntries = Object.entries(this.responses);

    for (let i = 0; i < responseEntries.length; i++) {
      const [questionId, response] = responseEntries[i];

      const numericQuestionId = Number(response.question_id);
      const questionIndex = this.questions.findIndex(
        (q) => q.id === numericQuestionId
      );

      if (questionIndex === -1) {
        continue;
      }

      const question = this.questions[questionIndex];

      switch (question.format) {
        case 'multiple_choice':
          this.selectedRadioChoicesMap[questionIndex] =
            response.answer as string;
          break;

        case 'dropdown':
          this.selectedChoicesMap[questionIndex] = [response.answer as string];
          break;

        case 'checkbox':
          this.selectedChoicesMap[questionIndex] = Array.isArray(
            response.answer
          )
            ? response.answer
            : [response.answer];
          break;

        case 'free_response':
          this.freeResponseInput = response.response as string;
          break;

        default:
          break;
      }

      if (i < responseEntries.length - 1) {
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

    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
  }

  getNextQuestionId(selectedAnswers: string[], question: any): number | null {
    const choice = question.choices.find((choice: any) =>
      selectedAnswers.includes(choice.choice)
    );

    return choice ? choice.next_question_id : null;
  }

  onDropdownChange(event: any, questionIndex: number): void {
    const selectedValue = event.target.value;

    if (!this.selectedChoicesMap[questionIndex]) {
      this.selectedChoicesMap[questionIndex] = [];
    }

    this.selectedChoicesMap[questionIndex] = [selectedValue];

    const selectedChoiceObject = this.questions[questionIndex].choices.find(
      (choice) => choice.choice === selectedValue
    );
  }

  get selectedChoice(): string {
    return this.selectedChoicesMap[this.currentQuestionIndex]?.[0] || '';
  }

  set selectedChoice(value: string) {
    this.selectedChoicesMap[this.currentQuestionIndex] = [value];
  }

  onCheckboxChange(
    choice: Choice,
    event: any,
    answerType: string,
    questionIndex: number
  ): void {
    if (!this.selectedChoicesMap[questionIndex]) {
      this.selectedChoicesMap[questionIndex] = [];
    }

    if (answerType === 'single') {
      this.selectedChoicesMap[questionIndex] = [choice.choice];
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
    let newAnswer: string | string[] | null = null;
    let nextQuestionId: number | null = null; // Declare at the beginning

    // Reset selected choice before processing
    if (this.responses[this.currentQuestionIndex]) {
      const preFilledAnswer = this.responses[this.currentQuestionIndex];

      if (typeof preFilledAnswer === 'string') {
        selectedChoice = this.questions[this.currentQuestionIndex].choices.find(
          (choice) => choice.choice === preFilledAnswer
        );
        newAnswer = preFilledAnswer;
      } else if (Array.isArray(preFilledAnswer)) {
        selectedChoice = this.questions[this.currentQuestionIndex].choices.find(
          (choice) => preFilledAnswer.includes(choice.choice)
        );
        newAnswer = preFilledAnswer;
      }
    }

    // Override with the most recent selection
    if (this.selectedRadioChoicesMap[this.currentQuestionIndex]) {
      selectedChoice = this.questions[this.currentQuestionIndex].choices.find(
        (choice) =>
          choice.choice ===
          this.selectedRadioChoicesMap[this.currentQuestionIndex]
      );
      newAnswer = this.selectedRadioChoicesMap[this.currentQuestionIndex];
    }

    if (this.selectedDropdownChoice) {
      selectedChoice = this.questions[this.currentQuestionIndex].choices.find(
        (choice) => choice.choice === this.selectedDropdownChoice
      );
      newAnswer = this.selectedDropdownChoice;
    }

    const selectedCheckboxChoices =
      this.selectedChoicesMap[this.currentQuestionIndex] || [];
    if (selectedCheckboxChoices.length > 0) {
      const selectedChoiceObjects = this.questions[
        this.currentQuestionIndex
      ].choices.filter((choice) =>
        selectedCheckboxChoices.includes(choice.choice)
      );

      if (selectedChoiceObjects.length === 1) {
        selectedChoice = selectedChoiceObjects[0];
      }
      newAnswer = selectedCheckboxChoices;
    }

    if (this.freeResponseInput) {
      newAnswer = this.freeResponseInput;
    }

    if (newAnswer !== null) {
      // Remove any outdated history to avoid stale answers
      this.history = this.history.filter(
        (entry) =>
          entry.questionId !== this.questions[this.currentQuestionIndex].id
      );

      this.responses[this.currentQuestionIndex] = newAnswer;

      // Ensure `nextQuestionId` updates properly
      nextQuestionId = selectedChoice?.next_question_id ?? null;

      if (!nextQuestionId) {
        console.warn(
          'Warning: No explicit next question ID, falling back to sequence.'
        );
        nextQuestionId =
          this.questions[this.currentQuestionIndex + 1]?.id || null;
      }

      console.log('Updated Selected Choice:', selectedChoice);
      console.log(
        'Updated Selected Choice Next Question ID:',
        selectedChoice?.next_question_id
      );
      console.log('Updated Final Next Question ID:', nextQuestionId);

      if (nextQuestionId !== null) {
        this.history.push({
          questionId: this.questions[this.currentQuestionIndex].id,
          answer: newAnswer,
          nextQuestionId,
        });

        this.answerQuestion(newAnswer, nextQuestionId);
      } else {
        console.error('No valid next question found, cannot proceed!');
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
      return;
    }

    const nextQuestionIndex = this.questions.findIndex(
      (q) => q.id === nextQuestionId
    );

    if (nextQuestionIndex === -1) {
      return;
    }

    this.currentQuestionIndex = nextQuestionIndex;
  }

  handleBack() {
    if (this.history.length > 0) {
      const lastEntry = this.history.pop();
      this.currentQuestionIndex = this.questions.findIndex(
        (q) => q.id === lastEntry?.questionId
      );

      if (lastEntry) {
        const storedAnswer = lastEntry.answer;

        if (storedAnswer !== undefined && storedAnswer !== null) {
          this.responses[this.currentQuestionIndex] = storedAnswer;

          if (
            this.questions[this.currentQuestionIndex]?.format ===
            'multiple_choice'
          ) {
            this.selectedRadioChoicesMap[this.currentQuestionIndex] =
              storedAnswer as string;
          } else if (
            this.questions[this.currentQuestionIndex]?.format === 'dropdown'
          ) {
            this.selectedDropdownChoice = storedAnswer as string;
          } else if (
            this.questions[this.currentQuestionIndex]?.format === 'checkbox'
          ) {
            this.selectedChoicesMap[this.currentQuestionIndex] = Array.isArray(
              storedAnswer
            )
              ? storedAnswer
              : [storedAnswer];
          } else if (
            this.questions[this.currentQuestionIndex]?.format ===
            'free_response'
          ) {
            this.freeResponseInput = storedAnswer as string;
          }
        }
      }

      // Remove invalid history entries that no longer make sense
      this.history = this.history.filter((entry) =>
        Object.values(this.responses).includes(entry.answer)
      );
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
    let percentage = (this.currentQuestionIndex / this.questions.length) * 100;

    if (
      this.currentQuestionIndex === this.questions.length - 1 &&
      this.questions[this.currentQuestionIndex].format === 'free_response' &&
      this.freeResponseInput.trim() === ''
    ) {
      percentage = (this.currentQuestionIndex / this.questions.length) * 100;
    } else if (
      this.currentQuestionIndex === this.questions.length - 1 &&
      this.questions[this.currentQuestionIndex].format === 'free_response' &&
      this.freeResponseInput.trim() !== ''
    ) {
      percentage = 100;
    }

    return Math.round(percentage);
  }

  onSubmit() {
    const userId = this.authService.getUserId();

    if (userId === null) {
      return;
    }

    const answers = this.questions
      .map((question, index) => {
        let response = this.responses[index];

        if (Array.isArray(response)) {
          response = response.length > 0 ? response.join(', ') : '';
        } else if (response && typeof response === 'object') {
          if (response.hasOwnProperty('answer')) {
            response = response['answer'];
          } else {
            response = '';
          }
        } else if (response !== undefined && response !== null) {
          response = String(response).trim();
        } else {
          response = '';
        }

        return {
          question_id: question.id,
          answer: response,
        };
      })
      .filter((answer) => answer.answer !== '');

    const free_responses = this.freeResponseInput
      ? [
          {
            question_id: this.questions[this.questions.length - 1].id,
            response: this.freeResponseInput.trim() || '',
          },
        ]
      : [];

    // Debugging message
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
          this.currentQuestionIndex = this.questions.length;
          this.router.navigate(['/pet-listing']);
        },
        error: (err) => {
          console.error('Error submitting questionnaire:', err);
        },
      });
  }

  saveProgress(): void {
    const userId = this.authService.getUserId();

    if (userId === null) {
      console.error('User ID is missing. Cannot save progress.');
      return;
    }

    const answers = this.questions
      .map((question, index) => {
        let response = this.responses[index];

        if (Array.isArray(response)) {
          response = response.length > 0 ? response.join(', ') : '';
        } else if (response && typeof response === 'object') {
          if (response.hasOwnProperty('answer')) {
            response = response['answer'];
          } else {
            response = '';
          }
        } else if (response !== undefined && response !== null) {
          response = String(response).trim();
        } else {
          response = '';
        }

        return {
          question_id: question.id,
          answer: response,
        };
      })
      .filter((answer) => answer.answer !== '');

    const lastQuestionId =
      answers.length > 0 ? answers[answers.length - 1].question_id : null;

    if (lastQuestionId === null) {
      console.error('No last question ID found. Cannot save progress.');
      return;
    }

    const free_responses =
      this.freeResponseInput && this.freeResponseInput.trim()
        ? [
            {
              question_id: this.questions[this.questions.length - 1].id,
              response: this.freeResponseInput.trim(),
            },
          ]
        : [];

    // Debugging message
    console.log('Saving progress:', {
      user_id: userId,
      lastQuestionId,
      answers,
      free_responses,
    });

    this.questionnaireService
      .saveProgress(userId, lastQuestionId ?? -1, answers, free_responses)
      .subscribe({
        next: (response) => {
          console.log('Progress saved successfully:', response);
          this.router.navigate(['/pet-listing']);
        },
        error: (err) => {
          console.error('Error saving progress:', err);
        },
      });
  }

  openModal() {
    if (this.profileComplete) {
      this.router.navigate(['/pet-listing']);
    } else {
      this.isModalVisible = true;
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
