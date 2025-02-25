import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-questionnaire',
  imports: [CommonModule],
  templateUrl: './questionnaire.component.html',
  styleUrl: './questionnaire.component.css',
})
export class QuestionnaireComponent implements OnInit {
  ngOnInit(): void {
    console.log('QuestionnaireComponent initialized');
  }
}
