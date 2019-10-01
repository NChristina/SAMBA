import { Component, OnInit } from '@angular/core';
import { ChartService } from './nav/dashboard/services/chart.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'app';
  spinner = false;

  constructor(private chartS: ChartService) {}

  ngOnInit() {
    document.getElementById('appModal').style.display = 'none'; // Spinner OFF default
    this.uglyInterval();
  }
  uglyInterval() {
            setInterval(() => {
              if (this.chartS.getSpinner()) {
                this.spinner = true;
              } else {
                this.spinner = false;
              }
            }, 1000);
  }

}
