import { Component, OnInit, ElementRef } from '@angular/core';
import { ChartService } from '../../services/chart.service';
import * as d3 from 'd3';
import * as crossfilter from 'crossfilter';
import * as dc from 'dc';

@Component({
  selector: 'app-time-sentiment',
  templateUrl: './time-sentiment.component.html',
  styleUrls: ['./time-sentiment.component.scss']
})
export class TimeSentimentComponent implements OnInit {
  aggrView = true;
  compView = false;
  data: any[];
  cfilter: CrossFilter.CrossFilter<{}>;
  dimension: CrossFilter.Dimension<{}, Date>;
  sentGroups: { group: CrossFilter.Group<{}, Date, any>, sent: string}[];
  sentimentLineChart: dc.LineChart;
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
    this.sentimentLineChart = dc.lineChart('#sentimentChartLine');
    this.chartService.GetData().subscribe((data) => { this.data = data; });

    // Crossfilter
    this.chartService.getCrossfilter().subscribe((filter) => {
      this.cfilter = filter;
      this.setDimension();
      if (this.data && this.data.length > 0) {
        this.sentGroups = this.getSentGroups();
        if (this.sentGroups[0]) {
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

    // Gets the range through the chart service from the mainVis Component
    this.chartService.getChartRange().subscribe((range) => {
      if (range.chart === null) {
        if (this.data && range.range) {
          (this.diff_months(range.range[0], range.range[1]) < 2) ? this.notDataWarn = true : this.notDataWarn = false;
          this.chartRangeFilter1 = range.range[0];
          this.chartRangeFilter2 = range.range[1];
          this.sentimentLineChart
            .x(d3.scaleTime().domain([this.chartRangeFilter1, this.chartRangeFilter2]))
            .y(d3.scaleLinear().domain([0, this.getMaxGroupValue(this.chartRangeFilter1, this.chartRangeFilter2)]))
            .round(d3.timeMonth);
          this.appliedFilter = true;
          this.sentimentLineChart.redraw();
        } else {
          if (!dc.chartRegistry.list().some((c) => c.hasFilter())) {
            this.notDataWarn = false;
            this.sentimentLineChart
              .x(d3.scaleTime().domain([this.chartRange1, this.chartRange2]))
              .y(d3.scaleLinear().domain([0, this.getMaxGroupValue(this.chartRange1, this.chartRange2)]));
            this.appliedFilter = false;
          }
        }
      }
    });

    this.renderedChart = false;
  }

  // Buttons and Front-End ////////////////////////////////////////////////////////////////////////////////////////////

  // sets the tooltip on mouseover
  setTooltipInfo(event: MouseEvent, tooltip: HTMLSpanElement) {
    tooltip.style.position = 'fixed';
    tooltip.style.top = (event.clientY) + 'px';
    tooltip.style.left = (event.clientX - tooltip.offsetWidth - 5) + 'px';
  }

  // sets the crossfilter dimension
  setDimension() {
    this.dimension = this.cfilter.dimension((d: any) => {
      const splitted = d.publishedAt.split('-');
      return new Date(splitted[0] + '-' + splitted[1]);
    });
  }

  // Time-based Stacked Chart /////////////////////////////////////////////////////////////////////////////////////////

  // returns a crossfilter-group for each sentiment x
  private getSentGroups(): { group: CrossFilter.Group<{}, Date, any>, sent: string}[] {
    if (this.data && this.data.length < 0) { return; }
    const groups: { group: CrossFilter.Group<{}, Date, any>, sent: string}[] = [];

    // group by sentiment
    const nested = d3.nest()
      .key((d: any) => {
        if (d.analysis) {
          if (d.analysis.mainSentiment === 'mixed') {
            return 'Mix';
          } else if (d.analysis.mainSentiment === 'positive') {
            return 'Pos';
          } else if (d.analysis.mainSentiment === 'neutral') {
            return 'Neu';
          } else if (d.analysis.mainSentiment === 'negative') {
            return 'Neg';
          } else if (d.analysis.mainSentiment === 'na') {
            return 'N/A';
          }
        }
      })
      .entries(this.data);

    nested.forEach((sentiment) => {
      const g = this.dimension.group().reduceSum((d: any) => {
        if (d.analysis) {
          let mainsentiment = '';
          if (d.analysis.mainSentiment === 'mixed') {
            mainsentiment = 'Mix';
          } else if (d.analysis.mainSentiment === 'positive') {
            mainsentiment = 'Pos';
          } else if (d.analysis.mainSentiment === 'neutral') {
            mainsentiment = 'Neu';
          } else if (d.analysis.mainSentiment === 'negative') {
            mainsentiment = 'Neg';
          } else if (d.analysis.mainSentiment === 'na') {
            mainsentiment = 'N/A';
          }
          return mainsentiment === sentiment.key;
        }
      });

      groups.push({group: g, sent: sentiment.key });
    });

    return groups;
  }

  // Renders line chart (aggregation)
  renderChart () {
    this.chartRange1 = d3.min(this.data, (d: any) => new Date(d.publishedAt));
    this.chartRange2 = d3.max(this.data, (d: any) => new Date(d.publishedAt));
    const sentGroupsOrdered = this.reorderGroups();
    const chartColors = this.defineChartColors();
    let firstItem = 0;
    while (!sentGroupsOrdered[firstItem] && firstItem < 5) {firstItem++; }
    const group1 = sentGroupsOrdered[firstItem];
    this.sentimentLineChart
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
      .group(group1.group, group1.sent)
      .valueAccessor(function (d) {
          return d.value;
      })
      .xAxis().ticks(7);
    let maxSent = 0;
    if (sentGroupsOrdered.length > 1) {
      sentGroupsOrdered.forEach((group) => {
        if (group.group === group1.group || maxSent === 4) {
          return;
        }
        // stacks the groups
        this.sentimentLineChart
          .stack(group.group, group.sent, function (d) {
          return d.value;
        });
        maxSent++;
      });
    }

    // When filter is applied before refreshing the chart
    if (this.appliedFilter) {
      this.sentimentLineChart.x(d3.scaleTime().domain([this.chartRangeFilter1, this.chartRangeFilter2]));
    }

    // Brush: get range and send it to the other charts on brush-filtering
    this.sentimentLineChart.on('filtered', (chart, filter) => {
      if (filter) {
        this.sentimentLineChart.y(d3.scaleLinear().domain([0, this.getMaxGroupValue(filter[0], filter[1])]));
      } else {
        this.sentimentLineChart.y(d3.scaleLinear().domain([0, this.getMaxGroupValue(this.chartRange1, this.chartRange2)]));
      }
      this.chartService.setChartRange({range: filter, chart: chart});
    });

    // Adapt chart for smaller view
    (this.chartHeight < 300) ? this.sentimentLineChart.yAxis().ticks(2) : this.sentimentLineChart.yAxis().ticks(10);
    (this.chartHeight < 300) ? this.sentimentLineChart.xAxisLabel('') : this.sentimentLineChart.xAxisLabel('Date');
    this.sentimentLineChart.render();
  }

  // Adaptable color scale
  defineChartColors() {
    const colorArray = [];
    const sentGroupsOrdered = this.reorderGroups();

    sentGroupsOrdered.forEach((g) => {
      if (g.sent === 'Pos') {
        colorArray.push('#4daf4a');
      } else if (g.sent === 'Neu') {
        colorArray.push('#666666');
      } else if (g.sent === 'Neg') {
        colorArray.push('#ff7f00');
      } else if (g.sent === 'Mix') {
        colorArray.push('#984ea3');
      } else if (g.sent === 'N/A') {
        colorArray.push('#DDDDDD');
      }
    });

    return colorArray;
  }

  // Reorder groups
  reorderGroups() {
    const groups: { group: CrossFilter.Group<{}, Date, any>, sent: string}[] = [];

    this.sentGroups.forEach((g) => {
      if (g.sent === 'Pos') {
        groups[0] = g;
      } else if (g.sent === 'Neu') {
        groups[1] = g;
      } else if (g.sent === 'Neg') {
        groups[2] = g;
      } else if (g.sent === 'Mix') {
        groups[3] = g;
      } else if (g.sent === 'N/A') {
        groups[4] = g;
      }
    });

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

  diff_months(dt2, dt1) {
    let diff = (dt2.getTime() - dt1.getTime()) / 1000;
    diff /= (60 * 60 * 24 * 7 * 4);
    return Math.abs(Math.round(diff));
  }
}
