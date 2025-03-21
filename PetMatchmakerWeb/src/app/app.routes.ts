import { Routes } from '@angular/router';
import { AuthGuard } from './core/services/auth.guard';
import { WelcomeComponent } from './login-components/welcome/welcome.component';
import { LoginComponent } from './login-components/login/login.component';
import { SignUpComponent } from './login-components/sign-up/sign-up.component';
import { AdminLoginComponent } from './login-components/admin-login/admin-login.component';
import { QuestionnaireComponent } from './questionnaire/questionnaire.component';
import { PetLisitingComponent } from './pet-lisiting/pet-lisiting.component';
import { AdminDashboardComponent } from './admin/admin-dashboard.component';

export const routes: Routes = [
  { path: 'welcome', component: WelcomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignUpComponent },
  { path: 'login/admin', component: AdminLoginComponent },
  {
    path: 'questionnaire',
    component: QuestionnaireComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'pet-listing',
    component: PetLisitingComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'admin-dashboard',
    component: AdminDashboardComponent,
    canActivate: [AuthGuard],
  },
];
