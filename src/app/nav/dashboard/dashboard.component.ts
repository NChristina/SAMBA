import { Component, OnInit, Input } from '@angular/core';
import { ChartService } from './services/chart.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  data;
  @Input()
  set chartData(value) {
    this.data = value;
  }
  get chartData() {
    return this.data;
  }

  constructor(private chartService: ChartService) {
  }

  ngOnInit() {
  }

}
