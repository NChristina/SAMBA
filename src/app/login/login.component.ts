import { Component, OnInit } from '@angular/core';
import { AppConstants } from '../shared/app.constants';
import { Router } from '@angular/router';
import { ChartService } from '../nav/dashboard/services/chart.service';



@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  wrongCreds = false;
  hide = true;
  username = '';
  password = '';
  u = AppConstants.auth_un;
  p = AppConstants.auth_pw;

  constructor(private router: Router, private chartS: ChartService) { }

  ngOnInit() {
  }

  auth() {
    if(this.u === this.username && this.p === this.password) {
      console.log('login should work');
      this.wrongCreds = false;
      this.chartS.loginProtection();
      this.router.navigate(['/dashboard']);

    } else {
      this.wrongCreds = true;
    }
  }

}
