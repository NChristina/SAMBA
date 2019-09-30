import {Component, OnInit} from '@angular/core';
import {ChartService} from '../../services/chart.service';
import {Options, LabelType} from 'ng5-slider';
import {SliderComponent} from '../../../../../../node_modules/ng5-slider/slider.component';
import {MdcFab} from '../../../../../../node_modules/@angular-mdc/web';
import * as crossfilter from 'crossfilter';
import * as d3 from 'd3';
import * as dc from 'dc';

@Component({
  selector: 'app-mainvis',
  templateUrl: './mainvis.component.html',
  styleUrls: ['./mainvis.component.scss'],
})

export class MainvisComponent implements OnInit {
  private lineCharts: dc.LineChart[];
  compositeChart: dc.CompositeChart;
  cfilter: CrossFilter.CrossFilter<{}>;
  dimension: CrossFilter.Dimension<{}, Date>;
  data: any[];
  protected songs = [];
  chartShowOption = 2;
  rowtip;
  chartRange1;
  chartRange2;
  currentFilterValues = [];
  protected value: number;
  protected value2: number;
  protected options: Options;
  private initialValues;
  chartHeight = 300;
  protected showTotalComments = false;

  constructor(private chartService: ChartService) {}

  ngOnInit() {
    this.rowtip = d3.select('body').append('div').attr('class', 'tooltip').attr('x', 10).attr('y', 10).style('opacity', 0);
    this.compositeChart = dc.compositeChart('#compositeChart');

    // Crossfilter
    this.initialValues = this.chartService.getCrossfilter().subscribe(filter => {
      this.cfilter = filter;
      this.setDimension();
      if (this.data !== undefined) {
        this.lineCharts = this.getLineCharts();
        this.renderChart();
        this.setSliderValues();
      }
    });

    // Get Data
    this.chartService.GetData().subscribe(data => {
      if (data) {
        this.data = data;
        this.songs = d3.nest().key((d: any) => d.song_key).key((d: any) => d.song).entries(this.data);
        if (this.showTotalComments) {
          this.songs.push({ key: '-------', values: [{ key: 'Total Comments', values: this.data }]});
        }
      }
    });

    // Collapsible view
    this.chartService.GetChartMode().subscribe(mode => {
      if (this.data && this.data.length > 0) {
        if (mode && mode === 'small') {
          this.chartHeight = 85;
          this.renderChart();
        } else if (mode && mode === 'big') {
          this.chartHeight = 300;
          this.renderChart();
        }
      }
    });
  }

  // Buttons and Front-End ////////////////////////////////////////////////////////////////////////////////////////////

  // Sets the tooltip on mouseover
  setTooltipInfo(event: MouseEvent, tooltip: HTMLSpanElement) {
    tooltip.style.position = 'fixed';
    tooltip.style.top = (event.clientY) + 'px';
    tooltip.style.left = (event.clientX - tooltip.offsetWidth - 5) + 'px';
  }

  // Sets the display mode of the line chart (daily, monthly, yearly)
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

  // Sets the dimension by date. The dimension is required for the dc and crossfilter library
  setDimension() {
    this.dimension = this.cfilter.dimension((d: any) => {
      return new Date(this.getDateStringByShowOption(d.publishedAt));
    });
  }

  // Converts the date for each mode (yearly, monthly, daily). This is important to stack the comments
  getDateStringByShowOption(date: string): string {
    switch (this.chartShowOption) {
      default:
      case 0:
        return date.split('T')[0];
      case 1:
        const splitted = date.split('-');
        return splitted[0] + '-' + splitted[1];
      case 2:
        return date.split('-')[0];
      case 3:
        // return date;
        case 3:
        return (date.split('T')[0]); // daily
    }
  }

  // Slider methods: sets the additional values for the slider
  setSliderValues() {
    if (this.data && this.data.length < 1) { return; }

    const dates = d3.nest().key((d: any) => {
        return this.getDateStringByShowOption(d.publishedAt);
      }).entries(this.data);
    dates.sort((a, b) => {
      return new Date(a.key) < new Date(b.key) ? -1 : 1;
    });
    if (dates.length < 1) { return; }

    // scales the slider to the last week or the last 2 datapoints on daily-view
    this.value2 = new Date(dates[dates.length - 1].key).getTime();
    if (this.chartShowOption === 0) {
      let weeks = 604800000; // one week
      const diff = this.value2 - new Date(dates[dates.length - 2].key).getTime();
      while (weeks <= diff) { weeks += weeks; }
      this.value = new Date(this.value2 - weeks).getTime();
      this.setMinRangeValue(this.value);
    } else {
      this.value = new Date(dates[0].key).getTime();
    }

    this.options = {
      floor: new Date(dates[0].key).getTime(),
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
      },
    };
  }

  // Slider methods: sets the first displayed date of the x-axis
  setMinRangeValue(value) {
    const date = new Date(value);
    this.chartRange1 = date;
    this.compositeChart.x(d3.scaleTime().domain([this.chartRange1, this.chartRange2]));
    this.compositeChart.y(d3.scaleLinear().domain([0, this.getMaxGroupValue(this.chartRange1, this.chartRange2)]));
    this.chartService.setChartRange({range: [this.chartRange1, this.chartRange2], chart: null});
    this.compositeChart.redraw();
  }

  // Slider methods: sets the last displayed date of the x-axis
  setMaxRangeValue(value) {
    const date = new Date(value);
    this.chartRange2 = date;
    this.compositeChart.x(d3.scaleTime().domain([this.chartRange1, this.chartRange2]));
    this.compositeChart.y(d3.scaleLinear().domain([0, this.getMaxGroupValue(this.chartRange1, this.chartRange2)]));
    this.compositeChart.redraw();
  }

  // Time-based Line Chart ////////////////////////////////////////////////////////////////////////////////////////////

  // Nests the data by song and returns an array of line charts. Each line chart belongs to one song
  getLineCharts(): dc.LineChart[] {
    const charts: dc.LineChart[] = [];
    const nestedData = d3.nest().key((comment: any) => comment.song).entries(this.data);

    for (let idx = 0; idx <= nestedData.length; idx++) {
      if (idx === 0) {
        const lineChart = dc.lineChart(this.compositeChart).dashStyle([5, 5]);
        const group = this.dimension.group().reduceSum((d: any) => true);
        lineChart.group(group);
        charts.push(lineChart);
      } else {
        const lineChart = dc.lineChart(this.compositeChart).colorAccessor(function(d, i) {
          if (i % 2 === 0) { return 0; } else { return 1; }
        });
        const group = this.dimension.group().reduceSum((d: any) => {
          return d.song === nestedData[idx - 1].key;
        });
        lineChart.group(group);
        charts.push(lineChart);
      }
    }

    if (this.showTotalComments) {
      charts.push(dc.lineChart(this.compositeChart).group(this.dimension.group()).renderDataPoints(true).colors('red'));
    }

    return charts;
  }

  // Renders the chart
  renderChart() {
    this.chartRange1 = d3.min(this.data, (d: any) => new Date(d.publishedAt));
    this.chartRange2 = d3.max(this.data, (d: any) => new Date(d.publishedAt));

    this.compositeChart
      .width(900)
      .height(this.chartHeight)
      .useViewBoxResizing(true)
      .dimension(this.dimension)
      .x(d3.scaleTime().domain([this.chartRange1, this.chartRange2]))
      .y(d3.scaleLinear().domain([0, this.getMaxGroupValue(this.chartRange1, this.chartRange2)]))
      .yAxisLabel('Comments')
      .shareTitle(true)
      .compose(this.lineCharts);

    // Filter: get range and send it to the other charts on brush-filtering
    this.compositeChart.on('filtered', (chart, filter) => {
      if (filter) {
        this.compositeChart.y(d3.scaleLinear().domain([0, this.getMaxGroupValue(filter[0], filter[1])]));
      } else {
        this.compositeChart.y(d3.scaleLinear().domain([0, this.getMaxGroupValue(this.chartRange1, this.chartRange2)]));
      }
      // DO IT ONLY IN CASE OF ZOOM: this.chartService.setChartRange({range: filter, chart: chart});
    });

    // d3.selectAll(".brush").call(brush.clear());

    // Adapt chart for smaller view
    (this.chartHeight < 300) ? this.compositeChart.yAxis().ticks(2) : this.compositeChart.yAxis().ticks(10);
    (this.chartHeight < 300) ? this.compositeChart.xAxisLabel('') : this.compositeChart.xAxisLabel('Date');
    this.compositeChart.render();
  }

  // Returns the max value for the domain of the chart
  getMaxGroupValue(begin, end): number {
    let m = 0;
    this.currentFilterValues = [];
    const allDimension = this.dimension.group().all();

    allDimension.forEach( d => {
      if (d['key'] <= end && d['key'] >= begin) {
        this.currentFilterValues.push(d);
      }
    });
    this.currentFilterValues.forEach((date: any) => {
      if (date.value > m) { m = date.value; }
    });
    return m / 100 * 110;
  }
}
