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
  aggrView = false;
  compView = true;
  data: any[];
  likeChart: dc.BarChart;
  dimension: CrossFilter.Dimension<{}, number>;
  cfilter: CrossFilter.CrossFilter<{}>;
  renderedChart = false;

  constructor(private chartService: ChartService, private _element: ElementRef) { }

  ngOnInit() {
    // initialization of the chart
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
    this.renderedChart = false;
    this.setVisibilityofViews();
  }

  // sets the dimension based on the songs
  setDimension() {
    this.dimension = this.cfilter.dimension(function (d: any) {
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

  // renders the chart
  renderChart() {
    const checklist = [];
    const barOrder = [];

    // Get values for first group (Likes)
    const group = this.dimension.group().reduceSum((d: any) => {
      let returning = false;
      const value = parseInt(d.videoLikes, 10);
      checklist.forEach((e) => { if (e.song === d.song && e.value === value) { returning = true; } });
      if (returning) { return 0; }
      checklist.push({ song: d.song, value: value });
      return value;
    });

    // Set chart and stacks first group (Likes)
    this.likeChart
      .width(300)
      .height(200)
      .useViewBoxResizing(true)
      .dimension(this.dimension)
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
      this.likeChart
      .stack(this.dimension.group().reduceSum((d: any) => {
        let returning = false;
        const value = (parseInt(d.videoDislikes, 10));
        checklist.forEach((e) => { if (e.song === d.song && e.value === value) { returning = true; } });
        if (returning) { return 0; }
        checklist.push({ song: d.song, value: value });
        return value;
      }), 'Dislikes');

    this.likeChart.margins().right = 80;
    this.likeChart.margins().left = 50;
    this.likeChart.margins().bottom = 30;
    this.likeChart.renderLabel(true).label(function (d) { barOrder.push({ label: d.data.key.toString() }); return d.data.key; });
    this.likeChart.legend(dc.legend().gap(5).x(220).y(10));
    this.likeChart.render();
    this.renderedChart = true;
    const tooltipBar = d3.selectAll('.tooltipBar');

    // Callback functions to display tooltips over each bar
    this.likeChart.renderlet((chart) => {
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
