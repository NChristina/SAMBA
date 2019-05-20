import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { NavComponent } from './nav/nav.component';
import { AuthGuardService } from './shared/auth-guard.service';

const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'dashboard', component: NavComponent, canActivate: [AuthGuardService] }

];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ],

})
export class AppRoutingModule {}
