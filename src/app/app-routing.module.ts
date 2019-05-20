import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './nav/dashboard/dashboard.component';
import { NavComponent } from './nav/nav.component';

const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'dashboard', component: NavComponent }

];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ],

})
export class AppRoutingModule {}
