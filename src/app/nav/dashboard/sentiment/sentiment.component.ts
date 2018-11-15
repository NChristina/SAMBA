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
  sentimentChart: dc.BarChart;
  data: any[];
  cfilter: CrossFilter.CrossFilter<{}>;
  dimension: CrossFilter.Dimension<{}, number>;
  sentSumm = [];
  dataChange = 0;

  constructor(private chartService: ChartService, private _element: ElementRef) { }

  ngOnInit() {
    // initialization of the chart
    this.sentimentChart = dc.barChart('#sentimentChart');
    this.chartService.GetData().subscribe((data) => {
      this.data = data;
    });

    this.chartService.getCrossfilter().subscribe((filter) => {
      this.cfilter = filter;
      this.setDimension();
      if (this.data.length !== this.dataChange) {
        this.dataChange = this.data.length;
        this.countSentiment();
        this.renderChart();
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

  // sets the dimension based on the songs
  setDimension() {
    this.dimension = this.cfilter.dimension(function (d: any) {
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

  // renders the chart
  renderChart() {
    const checklist = [];

    const group = this.dimension.group().reduceSum((d: any) => {
      let returning = false;
      const value = this.getGroupedSentiment(d.song, 'Positive');
      checklist.forEach((e) => { if (e.song === d.song && e.value === value) { returning = true; } });
      if (returning) { return 0; }
      checklist.push({ song: d.song, value: value });
      return value;
    });

    this.sentimentChart
      .width(300)
      .height(200)
      .ordinalColors(['#4daf4a', '#cccccc', '#ff7f00', '#984ea3', '#eeeeee'])
      .useViewBoxResizing(true)
      .dimension(this.dimension)
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
    this.sentimentChart
      .stack(this.dimension.group().reduceSum((d: any) => {
        let returning = false;
        const value = this.getGroupedSentiment(d.song, 'Neutral');

        checklist.forEach((e) => { if (e.song === d.song && e.value === value) { returning = true; } });
        if (returning) { return 0; }
        checklist.push({ song: d.song, value: value });
        return value;
      }), 'Neutral');

      // stacks the negatives
    this.sentimentChart
    .stack(this.dimension.group().reduceSum((d: any) => {
      let returning = false;
      const value = this.getGroupedSentiment(d.song, 'Negative');

      checklist.forEach((e) => { if (e.song === d.song && e.value === value) { returning = true; } });
      if (returning) { return 0; }
      checklist.push({ song: d.song, value: value });
      return value;
    }), 'Negative');

    // stacks the mixed sentiment
    this.sentimentChart
    .stack(this.dimension.group().reduceSum((d: any) => {
      let returning = false;
      const value = this.getGroupedSentiment(d.song, 'Mixed');

      checklist.forEach((e) => { if (e.song === d.song && e.value === value) { returning = true; } });
      if (returning) { return 0; }
      checklist.push({ song: d.song, value: value });
      return value;
    }), 'Mixed');

    // stacks the non assessed sentiment collumn
    this.sentimentChart
    .stack(this.dimension.group().reduceSum((d: any) => {
      let returning = false;
      const value = this.getGroupedSentiment(d.song, 'NA');

      checklist.forEach((e) => { if (e.song === d.song && e.value === value) { returning = true; } });
      if (returning) { return 0; }
      checklist.push({ song: d.song, value: value });
      return value;
    }), 'N/A');

    this.sentimentChart.margins().right = 80;
    this.sentimentChart.margins().left = 50;
    this.sentimentChart.margins().bottom = 30;
    this.sentimentChart.legend(dc.legend().gap(5).x(220).y(10));
    this.sentimentChart.render();
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
