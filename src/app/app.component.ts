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
              // console.log('rrrrrr: ', this.chartS.getSpinner());
              if (this.chartS.getSpinner()) {
                // console.log('block');
                this.spinner = true;
              } else {
                // console.log('none');
                this.spinner = false;
              }
            }, 1000);
  }

}
