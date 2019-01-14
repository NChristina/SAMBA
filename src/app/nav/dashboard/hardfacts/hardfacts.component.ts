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
  aggrView = true;
  compView = false;
  data: any[];
  cfilter: CrossFilter.CrossFilter<{}>;
  dimension: CrossFilter.Dimension<{}, Date>;
  dimensionBar: CrossFilter.Dimension<{}, number>;
  likeGroups: { group: CrossFilter.Group<{}, Date, any>, likes: string}[];
  likeLineChart: dc.LineChart;
  likeBarChart: dc.BarChart;
  private maxGroupValue;
  renderedChart = false;
  notDataWarn = false;

  constructor(private chartService: ChartService, private _element: ElementRef) { }

  ngOnInit() {
    // initialization of the chart
    this.likeLineChart = dc.lineChart('#likeChartLine');
    this.likeBarChart = dc.barChart('#likeChart');
    this.chartService.GetData().subscribe((data) => {
      this.data = data;
    });
    this.chartService.getCrossfilter().subscribe((filter) => {
      this.cfilter = filter;
      this.setDimension();
      this.setBarDimension();
      if (this.data && this.data.length > 0) {
        this.likeGroups = this.getLikeGroups();

        // If there is at least one like group:
        if (this.likeGroups[0]) {
          this.notDataWarn = false;
          this.renderChart();
          this.renderBarChart();
        } else {
          this.notDataWarn = true;
        }
      }
    });

    // gets the range through the chart service from the mainVis Component
    this.chartService.getChartRange().subscribe((range) => {
      if (this.data !== undefined && range.range !== null && range.range !== undefined) {
        this.likeLineChart
          .x(d3.scaleTime().domain([range.range[0], range.range[1]]))
          .y(d3.scaleLinear().domain([0, this.getMaxGroupValue()]))
          .round(d3.timeMonth);
        this.likeLineChart.redraw();
      } else {
        if (!dc.chartRegistry.list().some((c) => c.hasFilter())) {
          this.likeLineChart
            .x(d3.scaleTime().domain([d3.min(this.data, (d: any) => new Date(d.publishedAt)),
              d3.max(this.data, (d: any) => new Date(d.publishedAt))]))
            .y(d3.scaleLinear().domain([0, this.maxGroupValue]));
        }
      }
    });

    this.renderedChart = false;
    this.setVisibilityofViews();
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
  // used to set the domain
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

  // returns a crossfilter-group for each language x
  private getLikeGroups(): { group: CrossFilter.Group<{}, Date, any>, likes: string}[] {
    if (this.data.length < 0) { return; }
    const groups: { group: CrossFilter.Group<{}, Date, any>, likes: string}[] = [];

    // group by likes
    const nested = d3.nest().key((d: any) => {
      if (d.likeCount > 0) { return 'Liked'; } else { return 'Others'; }
    })
    .entries(this.data);
    nested.forEach((like) => {
      const g = this.dimension.group().reduceSum((d: any) => {
        let catg = '';
        if (d.likeCount > 0) { catg = 'Liked'; } else { catg = 'Others'; }
        return catg === like.key;
      });
      groups.push({group: g, likes: like.key });
    });

    return groups;
  }

  // Reorder groups by category: liked comments and other comments
  reorderGroups() {
    let groups: { group: CrossFilter.Group<{}, Date, any>, likes: string}[] = [];

    if (Object.keys(this.likeGroups).length > 1) {
      this.likeGroups.forEach((g) => {
        if (g.likes === 'Liked') {
          groups[0] = g;
        } else if (g.likes === 'Others') {
          groups[1] = g;
        }
      });
    } else {
      groups = this.likeGroups;
    }

    return groups;
  }

  // returns the max value for the domain of the chart
  getMaxGroupValue(): number {
    let m = 0;
    this.dimension.group().all().forEach((date: any) => {
      if (date.value > m) { m = date.value; }
    });
    console.log('hardfacts maxVal: ', m);
    return m;
  }

  defineChartColors() {
    switch (Object.keys(this.likeGroups).length) {
      case 1:
        return ['#EEEEEE'];
      default:
        return ['#377eb8', '#EEEEEE'];
    }
  }

  // Renders line chart (aggregation)
  renderChart () {
    this.maxGroupValue = this.getMaxGroupValue();
    const sentGroupsOrdered = this.reorderGroups();
    const chartColors = this.defineChartColors();
    const group1 = sentGroupsOrdered[0];
    this.likeLineChart
        .renderArea(true)
        .width(300)
        .height(200)
        .ordinalColors(chartColors)
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
        .group(group1.group, group1.likes)
        .valueAccessor(function (d) {
            return d.value;
        })
        .xAxis().ticks(4);
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
    this.likeLineChart.render();
  }

  // renders the chart
  renderBarChart() {
    const checklist = [];
    const barOrder = [];

    // Get values for first group (Likes)
    const group = this.dimensionBar.group().reduceSum((d: any) => {
      let returning = false;
      const value = parseInt(d.videoLikes, 10);
      checklist.forEach((e) => { if (e.song === d.song && e.value === value) { returning = true; } });
      if (returning) { return 0; }
      checklist.push({ song: d.song, value: value });
      return value;
    });

    // Set chart and stacks first group (Likes)
    this.likeBarChart
      .width(300)
      .height(200)
      .useViewBoxResizing(true)
      .dimension(this.dimensionBar)
      .yAxisLabel('Likes / Dislikes')
      .ordinalColors(['#377eb8', '#e41a1c'])
      .x(d3.scaleBand())
      .y(d3.scaleLog().clamp(true).domain([1, this.getMaxLikesAndDislikes()]))
      .xUnits(dc.units.ordinal)
      .brushOn(false)
      .controlsUseVisibility(true)
      .barPadding(0.1)
      .outerPadding(0.05)
      .renderTitle(false)
      .group(group, 'Likes');

      // Stacks second group (Dislikes)
      this.likeBarChart
      .stack(this.dimensionBar.group().reduceSum((d: any) => {
        let returning = false;
        const value = (parseInt(d.videoDislikes, 10));
        checklist.forEach((e) => { if (e.song === d.song && e.value === value) { returning = true; } });
        if (returning) { return 0; }
        checklist.push({ song: d.song, value: value });
        return value;
      }), 'Dislikes');

    this.likeBarChart.margins().right = 80;
    this.likeBarChart.margins().left = 50;
    this.likeBarChart.margins().bottom = 30;
    this.likeBarChart.renderLabel(true).label(function (d) { barOrder.push({ label: d.data.key.toString() }); return d.data.key; });
    this.likeBarChart.legend(dc.legend().gap(5).x(220).y(10));
    this.likeBarChart.render();
    this.renderedChart = true;
    const tooltipBar = d3.selectAll('.tooltipBar');

    // Callback functions to display tooltips over each bar
    this.likeBarChart.renderlet((chart) => {
      chart.selectAll('.bar')
        .on('mouseover.samba', (d, e) => {
          tooltipBar.transition().duration(150).style('opacity', .9);
          const AllLikesDeslikes = this.getLikesandDislikes();
          // If there is any summ of likes and deslikes, generate tooltip
          if (AllLikesDeslikes && barOrder[e]) {
            let currBar;
            AllLikesDeslikes.forEach((song) => {
              if (song.name === barOrder[e].label) { currBar = song; }
            });
            tooltipBar.html(currBar.name + '<br/>' + 'Likes: ' + currBar.likes + '<br/>' + 'Dislikes: ' + currBar.dislikes)
              .style('left', ((<any>d3).event.pageX) - 10 + 'px')
              .style('top', ((<any>d3).event.pageY) + 'px');
            }
        })
        .on('mouseout.samba', (d) => { tooltipBar.transition().duration(350).style('opacity', 0); });
    });
  }

  // Summary of likes and dislikes for tooltips in the chart bar
  getLikesandDislikes() {
    const nest = d3.nest().key((d: any) => d.song).entries(this.data);
    const likesDislikes = [];

    nest.forEach((d) => {
      likesDislikes.push({
        name: d.key,
        likes: d.values[0].videoLikes,
        dislikes: d.values[0].videoDislikes
      });
    });

    return likesDislikes;
  }

  // returns the views and song name for each song (tooltip)
  getSongsAndViews(): any[] {
    const nest = d3.nest()
      .key((d: any) => d.song)
      .entries(this.data);
    const returner = [];
    nest.forEach((d) => {
      returner.push(
        { name: d.key, views: d.values[0].videoViews}
      );
    });
    return returner;
  }

  // returns the amount of comments and the song for the tooltip
  getSongsAndComments(): any[] {
    const nest = d3.nest()
      .key((d: any) => d.song)
      .entries(this.data);
    const returner = [];
    nest.forEach((d) => {
      returner.push(
        { name: d.key, comments: d.values.length}
      );
    });
    return returner;
  }
  // returns the total views
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

  // sets the tooltip on mouseover
  setTooltip(event: MouseEvent, tooltip: HTMLSpanElement) {
    tooltip.style.position = 'fixed';
    tooltip.style.top = (event.clientY - tooltip.offsetHeight - 20) + 'px';
    tooltip.style.left = (event.clientX - tooltip.offsetWidth / 2) + 'px';
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
      document.getElementsByClassName('hardAggr')[0].classList.toggle('active');
      document.getElementsByClassName('hardComp')[0].classList.toggle('active');
    } else if (button === 'compButton' && !this.compView) {
      this.aggrView = false;
      this.compView = true;
      document.getElementsByClassName('hardAggr')[0].classList.toggle('active');
      document.getElementsByClassName('hardComp')[0].classList.toggle('active');
    }
    this.setVisibilityofViews();
  }

  setVisibilityofViews() {
    if (this.aggrView) {
      document.getElementById('likeChartLine').classList.remove('hide');
      document.getElementById('likeChart').classList.add('hide');
    } else if (this.compView) {
      document.getElementById('likeChartLine').classList.add('hide');
      document.getElementById('likeChart').classList.remove('hide');
    }
  }
}
