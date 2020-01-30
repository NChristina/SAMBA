import { Component, OnInit, ElementRef } from '@angular/core';
import { ChartService } from '../../services/chart.service';
import * as d3 from 'd3';
import * as crossfilter from 'crossfilter';
import * as dc from 'dc';

@Component({
  selector: 'app-sentiment',
  templateUrl: './sentiment.component.html',
  styleUrls: ['./sentiment.component.scss']
})
export class SentimentComponent implements OnInit {
  aggrView = true;
  compView = false;
  data: any[];
  cfilter: CrossFilter.CrossFilter<{}>;
  dimension: CrossFilter.Dimension<{}, Date>;
  dimensionBar: CrossFilter.Dimension<{}, number>;
  sentGroups: { group: CrossFilter.Group<{}, Date, any>, sent: string}[];
  sentimentBarChart: dc.BarChart;
  sentSumm = [];
  renderedChart = false;
  notDataWarn = false;
  enableNA = true;
  nbSongs = 0;
  appliedFilter = false;

  constructor(private chartService: ChartService, private _element: ElementRef) { }

  ngOnInit() {
    // initialization of the chart
    this.sentimentBarChart = dc.barChart('#sentimentChart');
    this.chartService.GetData().subscribe((data) => {
      this.data = data;
    });

    this.chartService.getCrossfilter().subscribe((filter) => {
      this.cfilter = filter;
      this.setDimension();
      this.setBarDimension();

      if (this.data && this.data.length > 0) {
        this.sentGroups = this.getSentGroups();

        // If there is at least one sentiment group:
        if (this.sentGroups[0]) {
          this.notDataWarn = false;
          this.countSentiment('', '', false);
          this.renderBarChart();
        } else {
          this.notDataWarn = true;
        }
      }
    });

    // gets the range through the chart service from the mainVis Component
    this.chartService.getChartRange().subscribe((range) => {
      if (this.data && range.range) {
        (this.diff_months(range.range[0], range.range[1]) < 2) ? this.notDataWarn = true : this.notDataWarn = false;
        this.countSentiment(range.range[0].toString(), range.range[1].toString(), true);
        this.renderBarChart();
      } else {
        if (!dc.chartRegistry.list().some((c) => c.hasFilter())) {
          this.notDataWarn = false;
        }

        if (this.data && this.data.length > 0) {
          this.countSentiment('', '', false);
          this.renderBarChart();
        }
      }
    });

    this.renderedChart = false;
  }

  // sets the tooltip on mouseover
  setTooltipInfo(event: MouseEvent, tooltip: HTMLSpanElement) {
    tooltip.style.position = 'fixed';
    tooltip.style.top = (event.clientY - tooltip.offsetHeight) + 'px';
    tooltip.style.left = (event.clientX + 5) + 'px';
  }

  toggleNA() {
    const element = <HTMLInputElement> document.getElementById('slider');
    const isChecked = element.checked;

    if (this.enableNA !== isChecked) {
      (this.enableNA) ? this.enableNA = false : this.enableNA = true;
      this.renderBarChart();
      document.getElementsByClassName('sentEnableNA')[0].classList.toggle('active');
    }
  }

  isInDateRange(publishedAt: any, startDate: any, endDate: any) {
    if (new Date(publishedAt) > new Date(startDate) && new Date(publishedAt) < new Date(endDate)) {
      return true;
    } else {
      return false;
    }
  }

  // sets the crossfilter dimension
  setDimension() {
    this.dimension = this.cfilter.dimension((d: any) => {
      const splitted = d.publishedAt.split('-');
      return new Date(splitted[0] + '-' + splitted[1]);
    });
  }

  // sets the dimension based on the songs
  setBarDimension() {
    this.dimensionBar = this.cfilter.dimension(function (d: any) {
      return d.song;
    });
  }

  // Bar Chart ////////////////////////////////////////////////////////////////////////////////////////////////////////

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
      }
    });

    this.nbSongs = sentSummAux.length;
    this.sentSumm = sentSummAux;
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
      if (this.enableNA) {
        sumAll = sentSummPos + sentSummNeu + sentSummNeg + sentSummMix + sentSummNA;
      } else {
        sumAll = sentSummPos + sentSummNeu + sentSummNeg + sentSummMix;
      }

      if (sentiment === 'Positive') {
        groupedValue = (sentSummPos * 100) / sumAll;
      } else if (sentiment === 'Neutral') {
        groupedValue = (sentSummNeu * 100) / sumAll;
      } else if (sentiment === 'Negative') {
        groupedValue = (sentSummNeg * 100) / sumAll;
      } else if (sentiment === 'Mixed') {
        groupedValue = (sentSummMix * 100) / sumAll;
      } else if (sentiment === 'NA') {
        if (this.enableNA) {
          groupedValue = (sentSummNA * 100) / sumAll;
        } else {
          return 0;
        }
      } else { console.log('Sentiment' + sentiment + ' does not exist'); }
    }

    return groupedValue;
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

  // renders bar chart (comparison)
  renderBarChart() {
    const checklist = [];
    const barOrder = [];

    const group = this.dimensionBar.group().reduceSum((d: any) => {
      let returning = false;
      const value = 'Positive';
      checklist.forEach((e) => { if (e.song === d.song && e.value === value) { returning = true; } });
      if (returning) { return 0; }
      checklist.push({ song: d.song, value: value });
      return this.getGroupedSentiment(d.song, 'Positive');
    });

    this.sentimentBarChart
      .width(300)
      .height(200)
      .ordinalColors(['#4daf4a', '#666666', '#ff7f00', '#984ea3', '#eeeeee'])
      .useViewBoxResizing(true)
      .dimension(this.dimensionBar)
      .yAxisLabel('Sentiment (%)')
      .x(d3.scaleBand())
      .y(d3.scaleLinear().domain([0, 100]))
      .xUnits(dc.units.ordinal)
      .brushOn(false)
      .controlsUseVisibility(true)
      .barPadding(0.1)
      .outerPadding(0.05)
      .renderTitle(false)
      .group(group, 'Positive');

    // stacks the neutrals
    this.sentimentBarChart
      .stack(this.dimensionBar.group().reduceSum((d: any) => {
        let returning = false;
        const value = 'Neutral';

        checklist.forEach((e) => { if (e.song === d.song && e.value === value) { returning = true; } });
        if (returning) { return 0; }
        checklist.push({ song: d.song, value: value });
        return this.getGroupedSentiment(d.song, 'Neutral');
      }), 'Neutral');

      // stacks the negatives
    this.sentimentBarChart
    .stack(this.dimensionBar.group().reduceSum((d: any) => {
      let returning = false;
      const value = 'Negative';

      checklist.forEach((e) => { if (e.song === d.song && e.value === value) { returning = true; } });
      if (returning) { return 0; }
      checklist.push({ song: d.song, value: value });
      return this.getGroupedSentiment(d.song, 'Negative');
    }), 'Negative');

    // stacks the mixed sentiment
    this.sentimentBarChart
    .stack(this.dimensionBar.group().reduceSum((d: any) => {
      let returning = false;
      const value = 'Mixed';

      checklist.forEach((e) => { if (e.song === d.song && e.value === value) { returning = true; } });
      if (returning) { return 0; }
      checklist.push({ song: d.song, value: value });
      return this.getGroupedSentiment(d.song, 'Mixed');
    }), 'Mixed');

    // stacks the non assessed sentiment collumn
    this.sentimentBarChart
    .stack(this.dimensionBar.group().reduceSum((d: any) => {
      let returning = false;
      const value = 'NA';

      checklist.forEach((e) => { if (e.song === d.song && e.value === value) { returning = true; } });
      if (returning) { return 0; }
      checklist.push({ song: d.song, value: value });
      return this.getGroupedSentiment(d.song, 'NA');
    }), 'N/A');

    this.sentimentBarChart.margins().right = 80;
    this.sentimentBarChart.margins().left = 50;
    this.sentimentBarChart.margins().bottom = 30;
    this.sentimentBarChart.renderLabel(true).label(function (d) { barOrder.push({ label: d.data.key.toString() }); return d.data.key; });
    this.sentimentBarChart.legend(dc.legend().gap(5).x(220).y(10));
    this.sentimentBarChart.render();
    this.renderedChart = true;
    const tooltipBar = d3.selectAll('.tooltipBar');

    // Callback functions to display tooltips over each bar
    this.sentimentBarChart.renderlet((chart) => {
      chart.selectAll('.bar')
        .on('mouseover.samba', (d, e) => {
          e = e % barOrder.length;
          tooltipBar.transition().duration(150).style('opacity', .9);
          if (barOrder[e]) {
            // this.getGroupedSentiment(d.song, 'Mixed');
            const tlPs = 'Pos: ' + this.getGroupedSentiment(barOrder[e].label, 'Positive').toFixed(1);
            const tlNu = 'Neu: ' + this.getGroupedSentiment(barOrder[e].label, 'Neutral').toFixed(1);
            const tlNg = 'Neg: ' + this.getGroupedSentiment(barOrder[e].label, 'Negative').toFixed(1);
            const tlMx = 'Mix: ' + this.getGroupedSentiment(barOrder[e].label, 'Mixed').toFixed(1);
            const tNA = 'N/A: ' + this.getGroupedSentiment(barOrder[e].label, 'NA').toFixed(1);
            tooltipBar.html(barOrder[e].label + '<br/>' + tlPs + '%<br/>' + tlNu + '%<br/>' + tlNg + '%<br/>' + tlMx + '%<br/>' + tNA + '%')
              .style('left', ((<any>d3).event.pageX) - 10 + 'px')
              .style('top', ((<any>d3).event.pageY) + 20 + 'px');
            }
        })
        .on('mouseout.samba', (d) => { tooltipBar.transition().duration(350).style('opacity', 0); });

        const test = chart.selectAll('g.x text');
        if (this.nbSongs > 2) {
          test.attr('transform', 'translate(-10,-10) rotate(315)');
        }
    });
  }

  diff_months(dt2, dt1) {
    let diff = (dt2.getTime() - dt1.getTime()) / 1000;
    diff /= (60 * 60 * 24 * 7 * 4);
    return Math.abs(Math.round(diff));
  }
}
