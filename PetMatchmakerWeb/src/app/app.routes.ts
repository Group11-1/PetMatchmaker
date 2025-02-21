import { Routes } from '@angular/router';
import { WelcomeComponent } from './login-components/welcome/welcome.component';
import { QuestionnaireComponent } from './questionnaire/questionnaire.component';

export const routes: Routes = [
  { path: 'welcome', component: WelcomeComponent },
  { path: 'questionnaire', component: QuestionnaireComponent },
];
