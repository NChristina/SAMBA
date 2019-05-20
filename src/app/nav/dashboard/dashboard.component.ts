
import { Component, OnInit, Input } from '@angular/core';
import { ChartService } from './services/chart.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  constructor(private chartService: ChartService) {
  }

  ngOnInit() {
  }

}
