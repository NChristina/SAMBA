import { Component, OnInit, ElementRef } from '@angular/core';
import { ChartService } from '../../services/chart.service';
import * as d3 from 'd3';
import * as dc from 'dc';

@Component({
  selector: 'app-time-engagement-comments',
  templateUrl: './time-engagement-comments.component.html',
  styleUrls: ['./time-engagement-comments.component.scss']
})
export class TimeEngagementCommentsComponent implements OnInit {
  data: any[];
  cfilter: CrossFilter.CrossFilter<{}>;
  dimension: CrossFilter.Dimension<{}, Date>;
  dimensionBar: CrossFilter.Dimension<{}, number>;
  likeGroups: { group: CrossFilter.Group<{}, Date, any>, likes: string}[];
  likeLineChart: dc.LineChart;
  renderedChart = false;
  notDataWarn = false;
  appliedFilter = false;
  chartHeight = 300;
  chartRange1;
  chartRange2;
  chartRangeFilter1;
  chartRangeFilter2;

  constructor(private chartService: ChartService, private _element: ElementRef) { }

  ngOnInit() {
    this.likeLineChart = dc.lineChart('#engChartLine');
    this.chartService.GetData().subscribe((data) => { this.data = data; });

    // Crossfilter
    this.chartService.getCrossfilter().subscribe((filter) => {
      this.cfilter = filter;
      this.setDimension();
      if (this.data && this.data.length > 0) {
        this.likeGroups = this.getLikeGroups();
        if (this.likeGroups[0]) {
          this.notDataWarn = false;
          this.appliedFilter = false;
          this.renderChart();
        } else {
          this.notDataWarn = true;
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

    // gets the range through the chart service from the mainVis Component
    this.chartService.getChartRange().subscribe((range) => {
      if (range.chart === null) {
        if (this.data && range.range) {
          (this.diff_months(range.range[0], range.range[1]) < 2) ? this.notDataWarn = true : this.notDataWarn = false;
          this.chartRangeFilter1 = range.range[0];
          this.chartRangeFilter2 = range.range[1];
          this.likeLineChart
            .x(d3.scaleTime().domain([this.chartRangeFilter1, this.chartRangeFilter2]))
            .y(d3.scaleLinear().domain([0, this.getMaxGroupValue(this.chartRangeFilter1, this.chartRangeFilter2)]))
            .round(d3.timeMonth);
          this.appliedFilter = true;
          this.likeLineChart.redraw();
        } else {
          if (!dc.chartRegistry.list().some((c) => c.hasFilter())) {
            this.notDataWarn = false;
            this.likeLineChart
              .x(d3.scaleTime().domain([this.chartRange1, this.chartRange2]))
              .y(d3.scaleLinear().domain([0, this.getMaxGroupValue(this.chartRange1, this.chartRange2)]));
            this.appliedFilter = false;
          }
        }
      }
    });

    this.renderedChart = false;
  }

  diff_months(dt2, dt1) {
    let diff = (dt2.getTime() - dt1.getTime()) / 1000;
    diff /= (60 * 60 * 24 * 7 * 4);
    return Math.abs(Math.round(diff));
  }

  // sets the crossfilter dimension
  setDimension() {
    this.dimension = this.cfilter.dimension((d: any) => {
      const splitted = d.publishedAt.split('-');
      return new Date(splitted[0] + '-' + splitted[1]);
    });
  }

  // sets the tooltip on mouseover
  setTooltip(event: MouseEvent, tooltip: HTMLSpanElement) {
    tooltip.style.position = 'fixed';
    tooltip.style.top = (event.clientY - tooltip.offsetHeight - 20) + 'px';
    tooltip.style.left = (event.clientX - tooltip.offsetWidth / 2) + 'px';
  }

  // sets the tooltip on mouseover
  setTooltipInfo(event: MouseEvent, tooltip: HTMLSpanElement) {
    tooltip.style.position = 'fixed';
    tooltip.style.top = event.clientY + 'px';
    tooltip.style.left = (event.clientX - tooltip.offsetWidth - 5) + 'px';
  }

  // Time-based Stacked Chart /////////////////////////////////////////////////////////////////////////////////////////

  // returns a crossfilter-group for each language x
  private getLikeGroups(): { group: CrossFilter.Group<{}, Date, any>, likes: string}[] {
    if (this.data && this.data.length < 0) { return; }
    const groups: { group: CrossFilter.Group<{}, Date, any>, likes: string}[] = [];

    // group by likes
    const nested = d3.nest().key((d: any) => {
      if (d.likeCount > 0) {
        return 'Liked';
      } else {
        return 'All';
      }
    })
    .entries(this.data);
    nested.forEach((like) => {
      const g = this.dimension.group().reduceSum((d: any) => {
        let catg = '';
        if (d.likeCount > 0) { catg = 'Liked'; } else { catg = 'All'; }
        return catg === like.key;
      });
      groups.push({group: g, likes: like.key });
    });

    return groups;
  }

  // Renders line chart (aggregation)
  renderChart () {
    this.chartRange1 = d3.min(this.data, (d: any) => new Date(d.publishedAt));
    this.chartRange2 = d3.max(this.data, (d: any) => new Date(d.publishedAt));
    const sentGroupsOrdered = this.reorderGroups();
    const chartColors = this.defineChartColors();
    const group1 = sentGroupsOrdered[0];
    this.likeLineChart
      .renderArea(true)
      .width(900)
      .height(this.chartHeight)
      .ordinalColors(chartColors)
      .useViewBoxResizing(true)
      .dimension(this.dimension)
      .x(d3.scaleTime().domain([this.chartRange1, this.chartRange2]))
      .y(d3.scaleLinear().domain([0, this.getMaxGroupValue(this.chartRange1, this.chartRange2)]))
      .yAxisLabel('Comments')
      .interpolate('monotone')
      .legend(dc.legend().x(850).y(0).itemHeight(9).gap(5))
      .brushOn(false)
      .group(group1.group, group1.likes)
      .valueAccessor(function (d) {
          return d.value;
      })
      .xAxis().ticks(7);
    let maxSent = 0;
    sentGroupsOrdered.forEach((group) => {
      if (group.group === group1.group || maxSent === 1) {
        return;
      }
      // stacks the groups
      this.likeLineChart
        .stack(group.group, group.likes, function (d) {
        return d.value;
      });
      maxSent++;
    });

    // When filter is applied before refreshing the chart
    if (this.appliedFilter) {
      this.likeLineChart.x(d3.scaleTime().domain([this.chartRangeFilter1, this.chartRangeFilter2]));
    }

    // Brush: get range and send it to the other charts on brush-filtering
    this.likeLineChart.on('filtered', (chart, filter) => {
      if (filter) {
        this.likeLineChart.y(d3.scaleLinear().domain([0, this.getMaxGroupValue(filter[0], filter[1])]));
      } else {
        this.likeLineChart.y(d3.scaleLinear().domain([0, this.getMaxGroupValue(this.chartRange1, this.chartRange2)]));
      }
      this.chartService.setChartRange({range: filter, chart: chart});
    });

    // Adapt chart for smaller view
    (this.chartHeight < 300) ? this.likeLineChart.yAxis().ticks(2) : this.likeLineChart.yAxis().ticks(10);
    (this.chartHeight < 300) ? this.likeLineChart.xAxisLabel('') : this.likeLineChart.xAxisLabel('Date');

    this.likeLineChart.xAxis().tickFormat(d3.timeFormat('%b %Y')); // month

    this.likeLineChart.render();
  }

  defineChartColors() {
    switch (Object.keys(this.likeGroups).length) {
      case 1:
        return ['#a8a8a8'];
      case 2:
        return ['#377eb8', '#a8a8a8'];
      case 3:
          return ['#377eb8', '#a8a8a8', '#ff0000'];
    }
  }

  // Reorder groups by category: liked comments and other comments
  reorderGroups() {
    let groups: { group: CrossFilter.Group<{}, Date, any>, likes: string}[] = [];

    if (Object.keys(this.likeGroups).length > 1) {
      this.likeGroups.forEach((g) => {
        if (g.likes === 'Liked') {
          groups[0] = g;
        } else if (g.likes === 'All') {
          groups[1] = g;
        }
      });
    } else {
      groups = this.likeGroups;
    }

    return groups;
  }

  // Returns the max value for the domain of the chart
  getMaxGroupValue(begin, end): number {
    let m = 0;
    const currentFilterValues = [];
    const allDimension = this.dimension.group().all();

    allDimension.forEach( d => {
      if (d['key'] <= end && d['key'] >= begin) {
        currentFilterValues.push(d);
      }
    });
    currentFilterValues.forEach((date: any) => {
      if (date.value > m) { m = date.value; }
    });
    return m / 100 * 110;
  }
}
