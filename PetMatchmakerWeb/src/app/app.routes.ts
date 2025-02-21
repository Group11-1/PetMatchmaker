import { Routes } from '@angular/router';
import { WelcomeComponent } from './login-components/welcome/welcome.component';
import { LoginComponent } from './login-components/login/login.component';
import { SignUpComponent } from './login-components/sign-up/sign-up.component';
import { AdminLoginComponent } from './login-components/admin-login/admin-login.component';
import { QuestionnaireComponent } from './questionnaire/questionnaire.component';

export const routes: Routes = [
  { path: 'welcome', component: WelcomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignUpComponent },
  { path: 'login/admin', component: AdminLoginComponent },
  { path: 'questionnaire', component: QuestionnaireComponent },
];
