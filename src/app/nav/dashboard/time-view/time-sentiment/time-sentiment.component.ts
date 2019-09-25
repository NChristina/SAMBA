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
  dimensionBar: CrossFilter.Dimension<{}, number>;
  sentGroups: { group: CrossFilter.Group<{}, Date, any>, sent: string}[];
  sentimentLineChart: dc.LineChart;
  private maxGroupValue;
  sentSumm = [];
  renderedChart = false;
  notDataWarn = false;
  nbSongs = 0;
  appliedFilter = false;
  chartHeight = 300;

  constructor(private chartService: ChartService, private _element: ElementRef) { }

  ngOnInit() {
    // initialization of the chart
    this.sentimentLineChart = dc.lineChart('#sentimentChartLine');
    this.chartService.GetData().subscribe((data) => {
      this.data = data;
    });

    this.chartService.getCrossfilter().subscribe((filter) => {
      this.cfilter = filter;
      this.setDimension();

      if (this.data && this.data.length > 0) {
        this.sentGroups = this.getSentGroups();

        // If there is at least one sentiment group:
        if (this.sentGroups[0]) {
          this.notDataWarn = false;
          this.countSentiment('', '', false);
          this.renderChart();
        } else {
          this.notDataWarn = true;
        }
      }
    });

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
      if (this.data && range.range) {
        (this.diff_months(range.range[0], range.range[1]) < 2) ? this.notDataWarn = true : this.notDataWarn = false;
        this.sentimentLineChart
          .x(d3.scaleTime().domain([range.range[0], range.range[1]]))
          .y(d3.scaleLinear().domain([0, this.getMaxGroupValue()]))
          .round(d3.timeMonth);

        this.countSentiment(range.range[0].toString(), range.range[1].toString(), true);
        this.sentimentLineChart.redraw();
      } else {
        if (!dc.chartRegistry.list().some((c) => c.hasFilter())) {
          this.notDataWarn = false;
          this.sentimentLineChart
            .x(d3.scaleTime().domain([d3.min(this.data, (d: any) => new Date(d.publishedAt)),
              d3.max(this.data, (d: any) => new Date(d.publishedAt))]))
            .y(d3.scaleLinear().domain([0, this.maxGroupValue]));
        }

        if (this.data && this.data.length > 0) {
          this.countSentiment('', '', false);
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

  isInDateRange(publishedAt: any, startDate: any, endDate: any) {
    if (new Date(publishedAt) > new Date(startDate) && new Date(publishedAt) < new Date(endDate)) {
      return true;
    } else {
      return false;
    }
  }

  // summarizes the sentiment for positive, neutral, and negative scores
  countSentiment(startDate: any, endDate: any, isFiltered: boolean) {
    let includeItem = true;
    const sentSummAux = [];

    this.data.forEach((d) => {
      if (isFiltered) {
        this.isInDateRange(d.publishedAt, startDate, endDate) ? includeItem = true : includeItem = false;
        this.appliedFilter = true;
      } else {
        this.appliedFilter = false;
      }

      if (d.analysis && includeItem) {
        let inList = false;
        let countedSongidx = 0;

        // Is the song already in the list?
        sentSummAux.forEach((sent) => {
          if (inList === false) {
            if (sent.song === d.song) { inList = true; } else { countedSongidx++; }
          }
        });

        if (inList) {
          if (d.analysis.mainSentiment === 'positive') {
            sentSummAux[countedSongidx].countPositive++;
          } else if (d.analysis.mainSentiment === 'neutral') {
            sentSummAux[countedSongidx].countNeutral++;
          } else if (d.analysis.mainSentiment === 'negative') {
            sentSummAux[countedSongidx].countNegative++;
          } else if (d.analysis.mainSentiment === 'mixed') {
            sentSummAux[countedSongidx].countMixed++;
          } else if (d.analysis.mainSentiment === 'na') {
            sentSummAux[countedSongidx].countNA++;
          }
        } else {
          if (d.analysis.mainSentiment === 'positive') {
            sentSummAux.push({ song: d.song, countPositive: 1, countNeutral: 0, countNegative: 0, countMixed: 0, countNA: 0 });
          } else if (d.analysis.mainSentiment === 'neutral') {
            sentSummAux.push({ song: d.song, countPositive: 0, countNeutral: 1, countNegative: 0, countMixed: 0, countNA: 0 });
          } else if (d.analysis.mainSentiment === 'negative') {
            sentSummAux.push({ song: d.song, countPositive: 0, countNeutral: 0, countNegative: 1, countMixed: 0, countNA: 0 });
          } else if (d.analysis.mainSentiment === 'mixed') {
            sentSummAux.push({ song: d.song, countPositive: 0, countNeutral: 0, countNegative: 0, countMixed: 1, countNA: 0 });
          } else if (d.analysis.mainSentiment === 'na') {
            sentSummAux.push({ song: d.song, countPositive: 0, countNeutral: 0, countNegative: 0, countMixed: 0, countNA: 1 });
          }
        }
      } else {
        // console.log("No analysis");
      }
    });

    this.nbSongs = sentSummAux.length;
    this.sentSumm = sentSummAux;
  }

  private isIconsistent (sentValues: any) {
    let countPos = 0;
    let countNeg = 0;

    sentValues.forEach((value) => {
      if (value > 0) { countPos++; } else if (value < 0) { countNeg++; }
    });

    if (countPos > 0 && countNeg > 0) { return true; } else { return false; }
  }

  // sets the crossfilter dimension
  setDimension() {
    this.dimension = this.cfilter.dimension((d: any) => {
      const splitted = d.publishedAt.split('-');
      return new Date(splitted[0] + '-' + splitted[1]);
    });
  }

  getGroupedSentiment (id: any, sentiment: string) {
    let groupedValue = 0;
    let countedSongidx = 0;
    let inList = false;
    let sumAll = 0;

    this.sentSumm.forEach((sent) => {
      if (inList === false) {
        if (sent.song === id) { inList = true; } else { countedSongidx++; }
      }
    });

    if (inList) {
      const sentSummPos = this.sentSumm[countedSongidx].countPositive;
      const sentSummNeu = this.sentSumm[countedSongidx].countNeutral;
      const sentSummNeg = this.sentSumm[countedSongidx].countNegative;
      const sentSummMix = this.sentSumm[countedSongidx].countMixed;
      const sentSummNA = this.sentSumm[countedSongidx].countNA;
      sumAll = sentSummPos + sentSummNeu + sentSummNeg + sentSummMix + sentSummNA;

      if (sentiment === 'Positive') {
        groupedValue = (sentSummPos * 100) / sumAll;
      } else if (sentiment === 'Neutral') {
        groupedValue = (sentSummNeu * 100) / sumAll;
      } else if (sentiment === 'Negative') {
        groupedValue = (sentSummNeg * 100) / sumAll;
      } else if (sentiment === 'Mixed') {
        groupedValue = (sentSummMix * 100) / sumAll;
      } else if (sentiment === 'NA') {
        groupedValue = (sentSummNA * 100) / sumAll;
      } else { console.log('Sentiment' + sentiment + ' does not exist'); }
    }

    return groupedValue;
  }

  // returns the max value for the domain of the chart
  getMaxGroupValue(): number {
    let m = 0;
    this.dimension.group().all().forEach((date: any) => {
      if (date.value > m) { m = date.value; }
    });
    return m;
  }

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

  // Renders line chart (aggregation)
  renderChart () {
    this.maxGroupValue = this.getMaxGroupValue();
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
      .x(d3.scaleTime().domain([d3.min(this.data, (d: any) => new Date(d.publishedAt)),
        d3.max(this.data, (d: any) => new Date(d. publishedAt))]))
      .y(d3.scaleLinear().domain([0, this.maxGroupValue]))
      .yAxisLabel('Comments')
      .interpolate('monotone')
      .legend(dc.legend().x(850).y(0).itemHeight(10).gap(5))
      .brushOn(true)
      .group(group1.group, group1.sent)
      .valueAccessor(function (d) {
          return d.value;
      })
      .xAxis().ticks(4);
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
    (this.chartHeight < 300) ? this.sentimentLineChart.yAxis().ticks(2) : this.sentimentLineChart.yAxis().ticks(10);
    (this.chartHeight < 300) ? this.sentimentLineChart.xAxisLabel('') : this.sentimentLineChart.xAxisLabel('Date');
    this.sentimentLineChart.render();
  }

  // sets the tooltip on mouseover
  setTooltipInfo(event: MouseEvent, tooltip: HTMLSpanElement) {
    tooltip.style.position = 'fixed';
    tooltip.style.top = (event.clientY) + 'px';
    tooltip.style.left = (event.clientX - tooltip.offsetWidth - 5) + 'px';
  }
}
