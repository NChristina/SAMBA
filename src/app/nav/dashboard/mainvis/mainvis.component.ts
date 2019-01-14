import {Component, OnInit} from '@angular/core';
import {ChartService} from '../services/chart.service';
import * as d3 from 'd3';
import * as crossfilter from 'crossfilter';
import * as dc from 'dc';
import {Options, LabelType} from 'ng5-slider';
import {SliderComponent} from '../../../../../node_modules/ng5-slider/slider.component';
import {MdcFab} from '../../../../../node_modules/@angular-mdc/web';



@Component({
  selector: 'app-mainvis',
  templateUrl: './mainvis.component.html',
  styleUrls: ['./mainvis.component.scss'],
})
export class MainvisComponent implements OnInit {
  // chart values
  cfilter: CrossFilter.CrossFilter<{}>;
  compositeChart: dc.CompositeChart;
  dimension: CrossFilter.Dimension<{}, Date>;
  data: any[];
  private lineCharts: dc.LineChart[];
  chartShowOption = 2;
  protected songs = [];
  rowtip;
  maxGroupValue;

  // slider values
  protected value: number;
  protected value2: number;
  protected options: Options;
  private chartRange1;
  private chartRange2;


  private initialValues;
  // total comments
  protected showTotalComments = false;

  constructor(private chartService: ChartService) {}

  ngOnInit() {

    this.rowtip = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .attr('x', 10)
    .attr('y', 10)
    .style('opacity', 0);

    // initialization of the chart by id = compositeChart
    this.compositeChart = dc.compositeChart('#compositeChart');
    // subscribing to crossfilter
    this.initialValues = this.chartService.getCrossfilter().subscribe(filter => {
      this.cfilter = filter;
      this.setDimension();
      if (this.data !== undefined) {
        this.lineCharts = this.getLineCharts();
        this.renderChart();
        this.setSliderValues();
      }
    });
    this.chartService.GetData().subscribe(data => {
      this.data = data;
      console.log('test');
      this.songs = d3
        .nest()
        .key((d: any) => d.song_key)
        .key((d: any) => d.song)
        .entries(this.data);
      // console.log(this.songs);
      if (this.showTotalComments) {
        this.songs.push({ key: '-------', values: [{ key: 'Total Comments', values: this.data }]});
      }
      // console.log(this.songs);
    });
  }

  // sets the dimension by date
  // the dimension is required for the dc and crossfilter library
  setDimension() {
    this.dimension = this.cfilter.dimension((d: any) => {
      return new Date(this.getDateStringByShowOption(d.publishedAt));
    });
  }

  // nests the data by song and returns an array of line charts
  // each line chart belongs to one song
  getLineCharts(): dc.LineChart[] {
    const charts: dc.LineChart[] = [];
    const nestedData = d3
      .nest()
      .key((comment: any) => comment.song)
      .entries(this.data);
    nestedData.forEach(song => {
      const lineChart = dc.lineChart(this.compositeChart);
      // comulative show option
      if (this.chartShowOption === 3) {
        const dataLength = this.data.length;
        const dates = d3.nest().key((d: any) => this.getDateStringByShowOption(d.publishedAt)).entries(song.values);
        for (let i = 0; i < dates.length; i++) {
          if ((i + 1) === dates.length) {
            break;
          }
          const date = new Date(this.getDateStringByShowOption(dates[i].key));
          const date2 = new Date(this.getDateStringByShowOption(dates[i + 1].key));
          const daysBetween = Math.floor( (date.getTime() - date2.getTime()) / 86400000); // 86400000 = one day
          this.addDaysToData(daysBetween, dates[i].values.length, date, song.key);
        }
        // console.log(dataLength, this.data.length);
        lineChart.interpolate('monotone');

      }
      const group = this.dimension.group().reduceSum((d: any) => {
        return d.song === song.key;
      });
      lineChart.group(group).renderDataPoints(true);
      charts.push(lineChart);
    });
    if (this.showTotalComments) {
      charts.push(dc.lineChart(this.compositeChart).group(this.dimension.group()).renderDataPoints(true));
    }
    return charts;
  }

  // renders the chart
  renderChart() {
    console.log('test render');
    const dateGroup = this.dimension.group();
    this.chartRange1 = d3.min(this.data, (d: any) => new Date(d.publishedAt));
    this.chartRange2 = d3.max(this.data, (d: any) => new Date(d.publishedAt));
    this.compositeChart
      .width(900)
      .height(300)
      .useViewBoxResizing(true)
      .dimension(this.dimension)
      .x(d3.scaleTime().domain([this.chartRange1, this.chartRange2]))
      .y(d3.scaleLinear().domain([0, d3.max(dateGroup.all(), (d: any) => d.value)]) )
      .xAxisLabel('Date')
      .yAxisLabel('Comment Amount')
      .shareTitle(true)
      .compose(this.lineCharts);
      // .on('pretransition', function(chart) {
      //   chart.selectAll('g.row')
      //     .call(this.rowtip)
      //     .on('mouseover', this.rowtip.show)
      //     .on('mouseout', this.rowtip.hide);

      // });



    //   chart.on('pretransition', function(chart) {
    //     chart.selectAll('g.row')
    //         .call(rowtip)
    //         .on('mouseover', rowtip.show)
    //         .on('mouseout', rowtip.hide);
    // });

    // sends data to the language chart component on brush-filtering //
    this.compositeChart.on('filtered', (chart, filter) => {


      // console.log('test filter', filter[1]);
      this.maxGroupValue = this.getMaxGroupValue(filter[0], filter[1]);
      console.log('value of maxGroupValue: ', this.maxGroupValue);
      this.compositeChart.y(d3.scaleLinear().domain([0, this.maxGroupValue]));
      this.chartService.setChartRange({range: filter, chart: chart});
    });
    this.compositeChart.render();
    // this.compositeChart.svg().append('path').attr('d', this.path);

  }
  addDaysToData (days: number, amount: number, from: Date, song: string = '') {
    if (days === 0) {
      return;
    }
    for (let j = 1; j <= days; j++) {
      for (let i = 0; i < amount; i++) {
        this.data.push({
          _key: '----------comulative---------',
          authorDisplayName: '',
          likeCount: 0,
          replyCount: 0,
          publishedAt: new Date(from.getTime() + (86400000 * j)).toISOString(),
          text: '',
          song: song,
          song_key: '',
          song_id: '',
          artist: '',
          analysis: {},
          videoLikes: 0,
          videoDislikes: 0,
          videoViews: 0
        });
      }
    }
  }


  // sets the display mode of the line chart (daily, monthly, yearly)
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

  // slider methods
  // sets the additional values for the slider
  setSliderValues() {
    if (this.data.length < 1) {
      return;
    }
    const dates = d3
      .nest()
      .key((d: any) => {
        return this.getDateStringByShowOption(d.publishedAt);
      })
      .entries(this.data);
    dates.sort((a, b) => {
      return new Date(a.key) < new Date(b.key) ? -1 : 1;
    });
    if (dates.length < 1) {
      return;
    }
    this.value2 = new Date(dates[dates.length - 1].key).getTime();
    // scales the slider to the last week or the last 2 datapoints on daily-view
    if (this.chartShowOption === 0) {
      let weeks = 604800000; // one week
      const diff =
        this.value2 - new Date(dates[dates.length - 2].key).getTime();
      while (weeks <= diff) {
        weeks += weeks;
      }
      this.value = new Date(this.value2 - weeks).getTime();
      this.setMinRangeValue(this.value);
    } else {
      this.value = new Date(dates[0].key).getTime();
    }
    this.options = {
      floor: new Date(dates[0].key).getTime(),
      // stepsArray: dates.map((date: any) => {
      //   return { value: new Date(date.key).getTime() };
      // }),
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

  // sets the first displayed date of the x-axis
  setMinRangeValue(value) {
    const date = new Date(value);
    this.chartRange1 = date;
    this.compositeChart.x(
      d3.scaleTime().domain([this.chartRange1, this.chartRange2])
    );
    this.compositeChart.redraw();
  }
  // sets the last displayed date of the x-axis
  setMaxRangeValue(value) {
    const date = new Date(value);
    this.chartRange2 = date;
    this.compositeChart.x(
      d3.scaleTime().domain([this.chartRange1, this.chartRange2])
    );
    this.compositeChart.redraw();
  }

  // converts the date for each mode (yearly, monthly, daily)
  // this is important to stack the comments
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

  // sets the tooltip on mouseover
  setTooltipInfo(event: MouseEvent, tooltip: HTMLSpanElement) {
    tooltip.style.position = 'fixed';
    tooltip.style.top = (event.clientY) + 'px';
    tooltip.style.left = (event.clientX - tooltip.offsetWidth - 5) + 'px';
  }

  // returns the max value for the domain of the chart
  getMaxGroupValue(begin, end): number { // ich brauche hier den max comment ammount für die gefilterte variante
    let m = 0;
    const currentFilterValues = [];
    let allDimension = this.dimension.group().all();
    console.log('allDimension: ', allDimension);
    console.log('begin: ', begin);
    console.log('end: ', end);

    allDimension.forEach( d => {
      if (d['key'] <= end && d['key'] >= begin) {
        currentFilterValues.push(d);
      }
    });
    console.log('xxx: ', currentFilterValues);
    console.log('fitting values: ', currentFilterValues);
    // console.log('dimension: ', this.dimension.group().all());
    // console.log('begin: ', begin, '// end: ', end);
    currentFilterValues.forEach((date: any) => {
      console.log('dv:', date);
      if (date.value > m) { m = date.value; }
    });
    console.log('m: ', m);
    return m+20;
  }
}
