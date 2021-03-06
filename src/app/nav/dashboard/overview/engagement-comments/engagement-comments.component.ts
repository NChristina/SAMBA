import { Component, OnInit, ElementRef } from '@angular/core';
import { ChartService } from '../../services/chart.service';
import * as d3 from 'd3';
import * as dc from 'dc';

@Component({
  selector: 'app-engagement-comments',
  templateUrl: './engagement-comments.component.html',
  styleUrls: ['./engagement-comments.component.scss']
})
export class EngagementCommentsComponent implements OnInit {
  data: any[];
  cfilter: CrossFilter.CrossFilter<{}>;
  dimension: CrossFilter.Dimension<{}, Date>;
  dimensionBar: CrossFilter.Dimension<{}, number>;
  likeGroups: { group: CrossFilter.Group<{}, Date, any>, likes: string}[];

  likeBarChart: dc.BarChart;
  private maxGroupValue;
  renderedChart = false;
  notDataWarn = false;
  engagementSumm = [];
  nbSongs = 0;
  appliedFilter = false;

  constructor(private chartService: ChartService, private _element: ElementRef) { }

  ngOnInit() {
    // initialization of the chart
    this.likeBarChart = dc.barChart('#engChart');
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
          this.countEngagement('', '', false);
          // this.renderChart();
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
        this.countEngagement(range.range[0].toString(), range.range[1].toString(), true);
        this.renderBarChart();
      } else {
        if (!dc.chartRegistry.list().some((c) => c.hasFilter())) { this.notDataWarn = false; }
        if (this.data && this.data.length > 0) {
          this.countEngagement('', '', false);
          this.renderBarChart();
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

  // returns the max value for the domain of the chart
  getMaxGroupValue(): number {
    let m = 0;
    this.dimension.group().all().forEach((date: any) => {
      if (date.value > m) { m = date.value; }
    });
    // console.log('hardfacts maxVal: ', m);
    return m;
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

  isInDateRange(publishedAt: any, startDate: any, endDate: any) {
    if (new Date(publishedAt) > new Date(startDate) && new Date(publishedAt) < new Date(endDate)) {
      return true;
    } else {
      return false;
    }
  }

  // summarizes the sentiment for positive, neutral, and negative scores
  countEngagement(startDate: any, endDate: any, isFiltered: boolean) {
    let includeItem = true;
    const engagementSummAux = [];

    this.data.forEach((d) => {
      if (isFiltered) {
        this.isInDateRange(d.publishedAt, startDate, endDate) ? includeItem = true : includeItem = false;
        this.appliedFilter = true;
      } else {
        this.appliedFilter = false;
      }

      if (includeItem) {
        let inList = false;
        let countedSongidx = 0;

        // Is the song already in the list?
        engagementSummAux.forEach((sent) => {
          if (inList === false) {
            if (sent.song === d.song) { inList = true; } else { countedSongidx++; }
          }
        });

        if (inList) {
          if (d.likeCount && d.likeCount > 0) {
            engagementSummAux[countedSongidx].countLike++;
          }
          engagementSummAux[countedSongidx].countComments++;
        } else {
          if (d.likeCount && d.likeCount > 0) {
              engagementSummAux.push({ song: d.song, countComments: 1, countLike: 1 });
          } else {
            engagementSummAux.push({ song: d.song, countComments: 1, countLike: 0 });
          }
        }
      }
    });

    this.nbSongs = engagementSummAux.length;
    this.engagementSumm = engagementSummAux;
  }

  getGroupedEngagement (id: any, engagement: string) {
    let groupedValue = 0;
    let countedSongidx = 0;
    let inList = false;

    this.engagementSumm.forEach((eng) => {
      if (inList === false) {
        if (eng.song === id) { inList = true; } else { countedSongidx++; }
      }
    });

    if (inList) {
      const engagementSummAll = this.engagementSumm[countedSongidx].countComments;
      const engagementSummLikes = this.engagementSumm[countedSongidx].countLike;
      const engagementSummOther = engagementSummAll - engagementSummLikes;

      if (engagement === 'Liked') {
        groupedValue = (engagementSummLikes * 100) / engagementSummAll;
      } else if (engagement === 'Comments') {
        groupedValue = (engagementSummOther * 100) / engagementSummAll;
      } else { console.log('Engagement' + engagement + ' does not exist'); }
    }

    return groupedValue;
  }

  // renders bar chart (comparison)
  renderBarChart() {
    const checklist = [];
    const barOrder = [];

    const group = this.dimensionBar.group().reduceSum((d: any) => {
      let returning = false;
      const value = 'Liked';
      checklist.forEach((e) => { if (e.song === d.song && e.value === value) { returning = true; } });
      if (returning) { return 0; }
      checklist.push({ song: d.song, value: value });
      return this.getGroupedEngagement(d.song, 'Liked');
    });

    this.likeBarChart
      .width(300)
      .height(200)
      .ordinalColors(['#377eb8', '#a8a8a8', '#ff0000'])
      .useViewBoxResizing(true)
      .dimension(this.dimensionBar)
      .yAxisLabel('Comments (%)')
      .x(d3.scaleBand())
      .y(d3.scaleLinear().domain([0, 100]))
      .xUnits(dc.units.ordinal)
      .brushOn(false)
      .controlsUseVisibility(true)
      .barPadding(0.1)
      .outerPadding(0.05)
      .renderTitle(false)
      .group(group, 'Liked');

    // stacks the neutrals
    this.likeBarChart
      .stack(this.dimensionBar.group().reduceSum((d: any) => {
        let returning = false;
        const value = 'Comments';

        checklist.forEach((e) => { if (e.song === d.song && e.value === value) { returning = true; } });
        if (returning) { return 0; }
        checklist.push({ song: d.song, value: value });
        return this.getGroupedEngagement(d.song, 'Comments');
      }), 'Non-Liked');

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
          e = e % barOrder.length;
          tooltipBar.transition().duration(150).style('opacity', .9);
          if (barOrder[e]) {
            // this.getGroupedEngagement(d.song, 'Mixed');
            const tlPs = 'Liked: ' + this.getGroupedEngagement(barOrder[e].label, 'Liked').toFixed(1);
            const tlNu = 'Non Liked: ' + this.getGroupedEngagement(barOrder[e].label, 'Comments').toFixed(1);
            tooltipBar.html(barOrder[e].label + '<br/>' + tlPs + '%<br/>' + tlNu + '%')
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
}
