import { Component, OnInit } from '@angular/core';
import { ChartService } from '../services/chart.service';
import * as d3 from 'd3';
import * as crossfilter from 'crossfilter';
import * as dc from 'dc';
import { Options, LabelType } from 'ng5-slider';
import { SliderComponent } from '../../../../../node_modules/ng5-slider/slider.component';
import { MdcFab } from '../../../../../node_modules/@angular-mdc/web';

@Component({
  selector: 'app-mainvis',
  templateUrl: './mainvis.component.html',
  styleUrls: ['./mainvis.component.scss']
})
export class MainvisComponent implements OnInit {
  // chart values
  cfilter: CrossFilter.CrossFilter<{}>;
  compositeChart: dc.CompositeChart;
  dimension: CrossFilter.Dimension<{}, Date>;
  data: any[];
  private lineCharts: dc.LineChart[];
  chartShowOption = 0;
  protected songs = [];

  // slider values
  private dateRange: Date[];
  protected value: number;
  protected value2: number;
  protected options: Options;
  private chartRange1;
  private chartRange2;

  constructor(private chartService: ChartService) {
  }

  ngOnInit() {
    this.compositeChart = dc.compositeChart('#compositeChart');
    this.chartService.getCrossfilter().subscribe((filter) => {
      this.cfilter = filter;
      this.setDimension();
      if (this.data !== undefined) {
        this.lineCharts = this.getLineCharts();
        this.renderChart();
        this.setSliderValues();
      }
    });
    this.chartService.GetData().subscribe((data) => {
      this.data = data;
      this.songs = d3.nest()
        .key((d: any) => d.song_key)
        .key((d: any) => d.song)
        .entries(this.data);
    });
  }

  setDimension() {
    this.dimension = this.cfilter.dimension((d: any) => {
      return new Date(this.getDateStringByShowOption(d.publishedAt));
    });
  }

  // nests the data by song and returns an array of line charts
  // each line chart belongs to one song
  getLineCharts(): dc.LineChart[] {
    const charts: dc.LineChart[] = [];
    const nestedData = d3.nest()
      .key((comment: any) => comment.song)
      .entries(this.data);
    nestedData.forEach((song) => {
      const lineChart = dc.lineChart(this.compositeChart);
      const group = this.dimension.group().reduceSum((d: any) => {
        return d.song === song.key;
      });
      lineChart.group(group)
        .renderDataPoints(true);
      charts.push(lineChart);
    });
    return charts;
  }

  renderChart() {
    const dateGroup = this.dimension.group();
    this.chartRange1 = d3.min(this.data, (d: any) => new Date(d.publishedAt));
    this.chartRange2 = d3.max(this.data, (d: any) => new Date(d.publishedAt));
    this.compositeChart
      .width(900)
      .height(300)
      .useViewBoxResizing(true)
      .dimension(this.dimension)
      .x(d3.scaleTime().domain([this.chartRange1, this.chartRange2]))
      .y(d3.scaleLinear().domain([0, d3.max(dateGroup.all(), (d: any) => d.value)]))
      .xAxisLabel('Date')
      .yAxisLabel('Comment Amount')
      .shareTitle(true)
      .compose(
        this.lineCharts
      );
    // sends data to the language chart component on brush-filtering
    this.compositeChart.on('filtered', (chart, filter) => {
      this.chartService.setChartRange({range: filter, chart: chart});
    });
    this.compositeChart.render();
  }

  // sets the display mode of the line chart (daily, monthly, yearly)
  setShowOption(index: number) {
    this.chartShowOption = index;
    if (this.lineCharts !== undefined) {
      this.dimension.dispose();
      this.setDimension();
      this.lineCharts = this.getLineCharts();
      this.renderChart();
      this.setSliderValues();
    }
  }

  // slider methods
  // sets the additional values for the slider
  setSliderValues() {
    if (this.data.length < 1) {
      return;
    }
    const dates = d3.nest()
      .key( (d: any) => {
        return this.getDateStringByShowOption(d.publishedAt);
      })
      .entries(this.data);
    dates.sort((a, b) => {
      return new Date(a.key) < new Date(b.key) ? -1 : 1;
    });
    if (dates.length < 1) {
      return;
    }
    this.value2 = new Date(dates[dates.length - 1].key).getTime();
    if (this.chartShowOption === 0) {
      let weeks = 604800000; // one week
      const diff = this.value2 - new Date(dates[dates.length - 2].key).getTime();
      while (weeks <= diff) {
        weeks += weeks;
      }
      this.value = new Date((this.value2 - weeks)).getTime();
      this.setMinRangeValue(this.value);
    } else {
      this.value = new Date(dates[0].key).getTime();
    }
    this.options = {
      floor: new Date(dates[0].key).getTime(),
      // stepsArray: dates.map((date: any) => {
      //   return { value: new Date(date.key).getTime() };
      // }),
      translate: (value: number, label: LabelType): string => {
        switch (this.chartShowOption) {
          default:
          case 0:
            return new Date(value).toDateString();
          case 1:
            const gapDate = new Date(value).toDateString().split(' ');
            return gapDate[1] + ' ' + gapDate[3];
          case 2:
            return new Date(value).getFullYear() + '';
        }
      }
    };
  }

  // sets the first displayed date of the x-axis
  setMinRangeValue(value) {
    const date = new Date(value);
    this.chartRange1 = date;
    this.compositeChart
      .x(d3.scaleTime().domain([this.chartRange1, this.chartRange2]));
    this.compositeChart.redraw();
  }
  // sets the last displayed date of the x-axis
  setMaxRangeValue(value) {
    const date = new Date(value);
    this.chartRange2 = date;
    this.compositeChart
      .x(d3.scaleTime().domain([this.chartRange1, this.chartRange2]));
    this.compositeChart.redraw();
  }

  // converts the date for each mode (yearly, monthly, daily)
  getDateStringByShowOption(date: string): string {
    switch (this.chartShowOption) {
      default:
      case 0:
        return (date.split('T')[0]);
      case 1:
        const splitted = date.split('-');
        return (splitted[0] + '-' + splitted[1]);
      case 2:
        return (date.split('-')[0]);
      case 3:
        return (date);
    }
  }
}
