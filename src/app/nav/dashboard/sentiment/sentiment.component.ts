import { Component, OnInit, ElementRef } from '@angular/core';
import { ChartService } from '../services/chart.service';
import * as d3 from 'd3';
import * as crossfilter from 'crossfilter';
import * as dc from 'dc';

@Component({
  selector: 'app-sentiment',
  templateUrl: './sentiment.component.html',
  styleUrls: ['./sentiment.component.scss']
})
export class SentimentComponent implements OnInit {
  aggrView = false;
  compView = true;
  sentimentLineChart: dc.LineChart;
  sentimentBarChart: dc.BarChart;
  data: any[];
  cfilter: CrossFilter.CrossFilter<{}>;
  dimension: CrossFilter.Dimension<{}, Date>;
  dimensionBar: CrossFilter.Dimension<{}, number>;
  private maxGroupValue;
  sentSumm = [];
  dataChange = 0;
  sentGroups: { group: CrossFilter.Group<{}, Date, any>, sent: string}[];

  constructor(private chartService: ChartService, private _element: ElementRef) { }

  ngOnInit() {
    // initialization of the chart
    this.sentimentLineChart = dc.lineChart('#sentimentChartLine');
    this.sentimentBarChart = dc.barChart('#sentimentChart');
    this.chartService.GetData().subscribe((data) => {
      this.data = data;
    });

    this.chartService.getCrossfilter().subscribe((filter) => {
      this.cfilter = filter;
      this.setDimension();
      this.setBarDimension();
      if (this.data.length !== this.dataChange) {
        this.dataChange = this.data.length;
        this.sentGroups = this.getSentGroups();
        this.countSentiment();
        this.renderChart();
        this.renderBarChart();
      }
    });

    // gets the range through the chart service from the mainVis Component
    this.chartService.getChartRange().subscribe((range) => {
      if (this.data !== undefined && range.range !== null && range.range !== undefined) {
        this.sentimentLineChart
          .x(d3.scaleTime().domain([range.range[0], range.range[1]]))
          .y(d3.scaleLinear().domain([0, this.getMaxGroupValue()]))
          .round(d3.timeMonth);
        this.sentimentLineChart.redraw();
      } else {
        if (!dc.chartRegistry.list().some((c) => c.hasFilter())) {
          this.sentimentLineChart
            .x(d3.scaleTime().domain([d3.min(this.data, (d: any) => new Date(d.publishedAt)),
              d3.max(this.data, (d: any) => new Date(d.publishedAt))]))
            .y(d3.scaleLinear().domain([0, this.maxGroupValue]));
        }
      }
    });

    this.setVisibilityofViews();
  }

  // summarizes the sentiment for positive, neutral, and negative scores
  countSentiment() {
    const sentSummAux = [];
    this.data.forEach((d) => {
      if (d.analysis && d.analysis.sentiment) {
        let inList = false;
        let countedSongidx = 0;

        // Is the song already in the list?
        sentSummAux.forEach((sent) => {
          if (inList === false) {
            if (sent.song === d.song) { inList = true; } else { countedSongidx++; }
          }
        });

        // Get values for sentiment
        const thisnltk = d.analysis.sentiment.nltk.compound;
        const thisblob = d.analysis.sentiment.textBlob.polarity;
        const thisafinn = d.analysis.sentiment.afinn.normalized;

        if (this.isIconsistent([thisnltk, thisblob, thisafinn])) {
          // If it is mixed...
          if (inList) {
            sentSummAux[countedSongidx].countMixed++;
          } else {
            sentSummAux.push({ song: d.song, countPositive: 0, countNeutral: 0, countNegative: 0, countMixed: 1 });
          }
        } else {
          // If it is not mixed...
          const sentPolarity = ((thisnltk + thisafinn + thisblob) / 3);

          if (inList) {
            if (sentPolarity > 0) {
              sentSummAux[countedSongidx].countPositive++;
            } else if (sentPolarity === 0) {
              sentSummAux[countedSongidx].countNeutral++;
            } else if (sentPolarity < 0) {
              sentSummAux[countedSongidx].countNegative++;
            }
          } else {
            if (sentPolarity > 0) {
              sentSummAux.push({ song: d.song, countPositive: 1, countNeutral: 0, countNegative: 0, countMixed: 0 });
            } else if (sentPolarity === 0) {
              sentSummAux.push({ song: d.song, countPositive: 0, countNeutral: 1, countNegative: 0, countMixed: 0 });
            } else if (sentPolarity < 0) {
              sentSummAux.push({ song: d.song, countPositive: 0, countNeutral: 0, countNegative: 1, countMixed: 0 });
            }
          }
        }
      } else {
        // console.log("No sentiment");
      }
    });

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

  // sets the dimension based on the songs
  setBarDimension() {
    this.dimensionBar = this.cfilter.dimension(function (d: any) {
      return d.song;
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
      sumAll = sentSummPos + sentSummNeu + sentSummNeg + sentSummMix;

      if (sentiment === 'Positive') {
        groupedValue = (sentSummPos * 100) / sumAll;
      } else if (sentiment === 'Neutral') {
        groupedValue = (sentSummNeu * 100) / sumAll;
      } else if (sentiment === 'Negative') {
        groupedValue = (sentSummNeg * 100) / sumAll;
      } else if (sentiment === 'Mixed') {
        groupedValue = (sentSummMix * 100) / sumAll;
      } else if (sentiment !== 'NA') { console.log('Sentiment' + sentiment + ' does not exist'); }
    } else {
      if (sentiment === 'NA') { return 100; }
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
    if (this.data.length < 0) { return; }
    const groups: { group: CrossFilter.Group<{}, Date, any>, sent: string}[] = [];

    // group by sentiment
    const nested = d3.nest()
      .key((d: any) => {
        if (d.analysis && d.analysis.sentiment) {
          const thisnltk = d.analysis.sentiment.nltk.compound;
          const thisblob = d.analysis.sentiment.textBlob.polarity;
          const thisafinn = d.analysis.sentiment.afinn.normalized;
          if (this.isIconsistent([thisnltk, thisblob, thisafinn])) {
            return 'Mix';
          } else {
            const sentPolarity = ((thisnltk + thisafinn + thisblob) / 3);
            if (sentPolarity > 0) {
              return 'Pos';
            } else if (sentPolarity === 0) {
              return 'Neu';
            } else if (sentPolarity < 0) {
              return 'Neg';
            }
          }
        } else {
          return 'N/A';
        }
      })
      .entries(this.data);

    nested.forEach((sentiment) => {
      const g = this.dimension.group().reduceSum((d: any) => {
        if (d.analysis && d.analysis.sentiment) {
          let mainsentiment = '';
          const thisnltk = d.analysis.sentiment.nltk.compound;
          const thisblob = d.analysis.sentiment.textBlob.polarity;
          const thisafinn = d.analysis.sentiment.afinn.normalized;
          if (this.isIconsistent([thisnltk, thisblob, thisafinn])) {
            mainsentiment = 'Mix';
          } else {
            const sentPolarity = ((thisnltk + thisafinn + thisblob) / 3);
            if (sentPolarity > 0) {
              mainsentiment = 'Pos';
            } else if (sentPolarity === 0) {
              mainsentiment = 'Neu';
            } else if (sentPolarity < 0) {
              mainsentiment = 'Neg';
            }
          }
          return mainsentiment === sentiment.key;
        } else {
          return 'N/A' === sentiment.key;
          // return false;
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

  // renders the chart
  renderChart () {
    this.maxGroupValue = this.getMaxGroupValue();
    const sentGroupsOrdered = this.reorderGroups();
    const group1 = sentGroupsOrdered[0];
    this.sentimentLineChart
        .renderArea(true)
        .width(300)
        .height(200)
        .ordinalColors(['#4daf4a', '#cccccc', '#ff7f00', '#984ea3', '#eeeeee'])
        .useViewBoxResizing(true)
        .dimension(this.dimension)
        .x(d3.scaleTime().domain([d3.min(this.data, (d: any) => new Date(d.publishedAt)),
          d3.max(this.data, (d: any) => new Date(d. publishedAt))]))
        .xAxisLabel('Date')
        .y(d3.scaleLinear().domain([0, this.maxGroupValue]))
        .yAxisLabel('Comment Amount')
        .interpolate('monotone')
        .legend(dc.legend().x(250).y(10).itemHeight(13).gap(5))
        .brushOn(true)
        .group(group1.group, group1.sent)
        .valueAccessor(function (d) {
            return d.value;
        })
        .xAxis().ticks(4);
      let maxSent = 0;
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
    this.sentimentLineChart.render();
  }

  // renders the chart
  renderBarChart() {
    const checklist = [];

    const group = this.dimensionBar.group().reduceSum((d: any) => {
      let returning = false;
      const value = this.getGroupedSentiment(d.song, 'Positive');
      checklist.forEach((e) => { if (e.song === d.song && e.value === value) { returning = true; } });
      if (returning) { return 0; }
      checklist.push({ song: d.song, value: value });
      return value;
    });

    this.sentimentBarChart
      .width(300)
      .height(200)
      .ordinalColors(['#4daf4a', '#cccccc', '#ff7f00', '#984ea3', '#eeeeee'])
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
      .group(group, 'Positive');

    // stacks the neutrals
    this.sentimentBarChart
      .stack(this.dimensionBar.group().reduceSum((d: any) => {
        let returning = false;
        const value = this.getGroupedSentiment(d.song, 'Neutral');

        checklist.forEach((e) => { if (e.song === d.song && e.value === value) { returning = true; } });
        if (returning) { return 0; }
        checklist.push({ song: d.song, value: value });
        return value;
      }), 'Neutral');

      // stacks the negatives
    this.sentimentBarChart
    .stack(this.dimensionBar.group().reduceSum((d: any) => {
      let returning = false;
      const value = this.getGroupedSentiment(d.song, 'Negative');

      checklist.forEach((e) => { if (e.song === d.song && e.value === value) { returning = true; } });
      if (returning) { return 0; }
      checklist.push({ song: d.song, value: value });
      return value;
    }), 'Negative');

    // stacks the mixed sentiment
    this.sentimentBarChart
    .stack(this.dimensionBar.group().reduceSum((d: any) => {
      let returning = false;
      const value = this.getGroupedSentiment(d.song, 'Mixed');

      checklist.forEach((e) => { if (e.song === d.song && e.value === value) { returning = true; } });
      if (returning) { return 0; }
      checklist.push({ song: d.song, value: value });
      return value;
    }), 'Mixed');

    // stacks the non assessed sentiment collumn
    this.sentimentBarChart
    .stack(this.dimensionBar.group().reduceSum((d: any) => {
      let returning = false;
      const value = this.getGroupedSentiment(d.song, 'NA');

      checklist.forEach((e) => { if (e.song === d.song && e.value === value) { returning = true; } });
      if (returning) { return 0; }
      checklist.push({ song: d.song, value: value });
      return value;
    }), 'N/A');

    this.sentimentBarChart.margins().right = 80;
    this.sentimentBarChart.margins().left = 50;
    this.sentimentBarChart.margins().bottom = 30;
    this.sentimentBarChart.legend(dc.legend().gap(5).x(220).y(10));
    this.sentimentBarChart.render();
  }

  // sets the tooltip on mouseover
  setTooltipInfo(event: MouseEvent, tooltip: HTMLSpanElement) {
    tooltip.style.position = 'fixed';
    tooltip.style.top = (event.clientY - tooltip.offsetHeight) + 'px';
    tooltip.style.left = (event.clientX + 5) + 'px';
  }

  switchView(button: string) {
    if (button === 'aggrButton' && !this.aggrView) {
      this.aggrView = true;
      this.compView = false;
      document.getElementsByClassName('sentAggr')[0].classList.toggle('active');
      document.getElementsByClassName('sentComp')[0].classList.toggle('active');
    } else if (button === 'compButton' && !this.compView) {
      this.aggrView = false;
      this.compView = true;
      document.getElementsByClassName('sentAggr')[0].classList.toggle('active');
      document.getElementsByClassName('sentComp')[0].classList.toggle('active');
    }
    this.setVisibilityofViews();
  }

  setVisibilityofViews() {
    if (this.aggrView) {
      document.getElementById('sentimentChartLine').classList.remove('hide');
      document.getElementById('sentimentChart').classList.add('hide');
    } else if (this.compView) {
      document.getElementById('sentimentChartLine').classList.add('hide');
      document.getElementById('sentimentChart').classList.remove('hide');
    }
  }

}
