
import { Component, OnInit, Input } from '@angular/core';
import { ChartService } from './services/chart.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  @Input() idsForChild: any;
  @Input() startDateForChild: any;
  @Input() endDateForChild: any;

  aaa: any;
  bbb: any;
  ccc: any;

  constructor(private chartService: ChartService) {
    this.idsForChild = this.aaa;
  }

  ngOnInit() {
    console.log(this.idsForChild);
  }

}
