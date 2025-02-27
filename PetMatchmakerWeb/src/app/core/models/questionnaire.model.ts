export interface Question {
  id: number;
  question: string;
  format: string;
  choices: Choice[];
}

export interface Choice {
  id: number;
  choice: string;
  next_question_id?: number;
}
