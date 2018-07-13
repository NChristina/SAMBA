import { Component, OnInit } from '@angular/core';
import { ChartService } from '../services/chart.service';
import * as d3 from 'd3';
import * as crossfilter from 'crossfilter';
import * as dc from 'dc';

@Component({
  selector: 'app-mainvis',
  templateUrl: './mainvis.component.html',
  styleUrls: ['./mainvis.component.scss']
})
export class MainvisComponent implements OnInit {
  cfilter: CrossFilter.CrossFilter<{}>;
  compositeChart: dc.CompositeChart;
  dimension: CrossFilter.Dimension<{}, Date>;
  data: any[];
  lineCharts: dc.LineChart[];

  constructor(private chartService: ChartService) {
  }

  ngOnInit() {
    this.compositeChart = dc.compositeChart('#compositeChart');
    this.chartService.getCrossfilter().subscribe((filter) => {
      this.cfilter = filter;
      console.log(filter);
      this.setDimension();
      if (this.data !== undefined) {
        this.lineCharts = this.getLineCharts();
        this.renderChart();
      }
    });
    this.chartService.GetData().subscribe((data) => {
      this.data = data;
      this.fixDate(this.data);
    });
    // this.dimension = this.cfilter.dimension(function (d) {
    //   return;
    // });
  }

  setDimension() {
    this.dimension = this.cfilter.dimension((d: any) => {
      return new Date(d.publishedAt);
    });
    this.dimension.top(100000).forEach((comment: any) => {
      comment.publishedAt = comment.publishedAt.split('T')[0];
    });
  }

  fixDate(data: any[]) {
    data.forEach(comment => {
      comment.publishedAt = comment.publishedAt.split('T')[0];
    });
  }

  getLineCharts(): dc.LineChart[] {
    const charts: dc.LineChart[] = [];
    let colorNumber = 456;
    const nestedData = d3.nest()
      .key((comment: any) => comment.song)
      .entries(this.data);
    nestedData.forEach((song) => {
      const lineChart = dc.lineChart(this.compositeChart);
      const group = this.dimension.group().reduceSum((d: any) => {
        return d.song === song.key;
      });
      lineChart.group(group)
        .renderDataPoints(true)
        .colors('#' + colorNumber);
      console.log('Group', group.all());
      charts.push(lineChart);
      colorNumber += 100;
    });
    return charts;
  }

  renderChart() {
    console.log('Dimension: ', this.dimension.top(100));
    const dateGroup = this.dimension.group();
    console.log(dateGroup.all());
    this.compositeChart
      .width(900)
      .height(300)
      .useViewBoxResizing(true)
      .dimension(this.dimension)
      .x(d3.scaleTime().domain([d3.min(this.data, (d: any) => new Date(d.publishedAt)),
        d3.max(this.data, (d: any) => new Date(d.publishedAt))]))
      .y(d3.scaleLinear().domain([0, d3.max(dateGroup.all(), (d: any) => d.value)]))
      .xAxisLabel('Date')
      .yAxisLabel('Comment Amount')
      .compose(
        // dc.lineChart(this.compositeChart).group(dateGroup)
        //   .renderDataPoints(true)
        this.lineCharts
      );
      this.compositeChart.render();
  }

}
