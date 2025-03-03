export interface Question {
  id: number;
  section_id: number;
  question: string;
  format: string;
  answer_type: string;
  choices: Choice[];
}

export interface Choice {
  id: number;
  choice: string;
  next_question_id?: number;
}
