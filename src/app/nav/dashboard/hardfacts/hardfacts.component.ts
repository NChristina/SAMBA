import { Component, OnInit, ElementRef } from '@angular/core';
import { ChartService } from '../services/chart.service';
import * as d3 from 'd3';
import * as crossfilter from 'crossfilter';
import * as dc from 'dc';

@Component({
  selector: 'app-hardfacts',
  templateUrl: './hardfacts.component.html',
  styleUrls: ['./hardfacts.component.scss']
})
export class HardfactsComponent implements OnInit {
  data: any[];
  likeChart: dc.BarChart;
  dimension: CrossFilter.Dimension<{}, number>;
  cfilter: CrossFilter.CrossFilter<{}>;

  constructor(private chartService: ChartService, private _element: ElementRef) { }

  ngOnInit() {
    this.likeChart = dc.barChart('#likeChart');
    this.chartService.GetData().subscribe((data) => {
      this.data = data;
    });
    this.chartService.getCrossfilter().subscribe((filter) => {
      this.cfilter = filter;
      this.setDimension();
      if (this.data.length > 0) {
        this.renderChart();
      }
    });
  }

  setDimension() {
    this.dimension = this.cfilter.dimension(function (d: any) {
      return d.song;
    });
  }
  getMaxLikesAndDislikes () {
    let m = 0;
    this.data.forEach((d) => {
      const n = parseInt(d.videoLikes, 10) + parseInt(d.videoDislikes, 10);
      if (m < n) {
        m = n;
      }
    });
    return m;
  }

  // set the numbers for the chart
  renderChart() {
    const checklist = [];
    const group = this.dimension.group().reduceSum((d: any) => {
      let returning = false;
      const value = parseInt(d.videoLikes, 10);
      checklist.forEach((e) => {
        if (e.song === d.song && e.value === value) {
          returning = true;
        }
      });
      if (returning) {
        return 0;
      }
      checklist.push({ song: d.song, value: value });
      return value;
    });
    this.likeChart.renderlet(function(chart) {
      chart.selectAll('g.x text')
        .attr('transform', 'rotate(-50)');
    });
    this.likeChart
      .width(300)
      .height(200)
      .dimension(this.dimension)
      .yAxisLabel('Likes / Dislikes')
      .x(d3.scaleBand())
      .y(d3.scaleLog().clamp(true).domain([1, this.getMaxLikesAndDislikes()]))
      .xUnits(dc.units.ordinal)
      .brushOn(false)
      .controlsUseVisibility(true)
      .barPadding(0.1)
      .outerPadding(0.05)
      .group(group, 'Likes');
      this.likeChart
      .stack(this.dimension.group().reduceSum((d: any) => {
        let returning = false;
        const value = (parseInt(d.videoDislikes, 10));
        checklist.forEach((e) => {
          if (e.song === d.song && e.value === value) {
            returning = true;
          }
        });
        if (returning) {
          return 0;
        }
        checklist.push({ song: d.song, value: value });
        return value;
      }), 'Dislikes');
    this.likeChart.margins().right = 80;
    this.likeChart.margins().left = 50;
    this.likeChart.margins().bottom = 50;
    this.likeChart.legend(dc.legend().gap(5).x(220).y(10));
    this.likeChart.render();
  }

  getSongsAndViews(): any[] {
    const nest = d3.nest()
      .key((d: any) => d.song)
      .entries(this.data);
    const returner = [];
    nest.forEach((d) => {
      let sum = parseInt(d.values[0].videoDislikes, 10) + parseInt(d.values[0].videoLikes, 10);
      let value = (parseInt(d.values[0].videoLikes, 10) / sum) * 100;
      returner.push(
        { name: d.key, views: d.values[0].videoViews, likes: d.values[0].videoLikes, dislikes: d.values[0].videoDislikes, value: value }
      );
    });
    return returner;
  }

  getTotalViews () {
    let views = 0;
    const nest = d3.nest()
      .key((d: any) => d.song)
      .entries(this.data);
    nest.forEach((d) => {
      views += parseInt(d.values[0].videoViews, 10);
    });
    return views;
  }

  setTooltip(event: MouseEvent, tooltip: HTMLSpanElement) {
    tooltip.style.position = 'fixed';
    tooltip.style.top = (event.clientY - tooltip.offsetHeight - 20) + 'px';
    tooltip.style.left = (event.clientX - tooltip.offsetWidth / 2) + 'px';
  }
}
