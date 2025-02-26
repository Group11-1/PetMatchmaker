export interface Question {
  id: number;
  question: string;
  format: string;
  choices: {
    choice: string;
    nextQuestionId: number;
  }[];
}
