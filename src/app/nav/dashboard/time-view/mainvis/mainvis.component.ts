import {Component, OnInit} from '@angular/core';
import {ChartService} from '../../services/chart.service';
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
  chartShowOption = 1;
  rowtip;
  chartRange1;
  chartRange2;
  currentFilterValues = [];
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

    // Gets the current range
    this.chartService.getChartRange().subscribe((range) => {
      if (range.chart === null) {
        if (this.data && range.range) {
          this.compositeChart
            .x(d3.scaleTime().domain([range.range[0], range.range[1]]))
            .y(d3.scaleLinear().domain([0, this.getMaxGroupValue(range.range[0], range.range[1])]))
            .round(d3.timeMonth);
          this.compositeChart.redraw();
        } else {
          if (!dc.chartRegistry.list().some((c) => c.hasFilter())) {
            this.compositeChart
              .x(d3.scaleTime().domain([this.chartRange1, this.chartRange2]))
              .y(d3.scaleLinear().domain([0, this.getMaxGroupValue(this.chartRange1, this.chartRange2)]));
          }
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
