import { Component, OnInit, ElementRef } from '@angular/core';
import { ChartService } from '../services/chart.service';
import * as d3 from 'd3';
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
  likeBarChart: dc.BarChart;
  private maxGroupValue;
  renderedChart = false;
  notDataWarn = false;
  nbSongs = 0;
  videoSummary: any[];

  constructor(private chartService: ChartService, private _element: ElementRef) { }

  ngOnInit() {
    // initialization of the chart
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
          this.countSongs();
          this.renderBarChart();
        } else {
          this.notDataWarn = true;
        }
      }
    });

    this.renderedChart = false;
    this.setVisibilityofViews();
  }

  countSongs() {
    const videoSummAux = [];

    this.data.forEach((d) => {
      let inList = false;
      let countedSongidx = 0;
      videoSummAux.forEach((sent) => { if (inList === false) { (sent.song === d.song) ? inList = true : countedSongidx++; } });
      if (!inList) {
        const mlikes = this.shortValues(d.videoLikes);
        const mviews = this.shortValues(d.videoViews);
        const mdlikes = this.shortValues(d.videoDislikes);

        videoSummAux.push({ song: d.song, songFull: d.songFull, artist: d.artist,
          likes: mlikes, dislikes: mdlikes, views: mviews, video_key: d.song_id });
      }
    });

    this.videoSummary = videoSummAux;
    this.nbSongs = videoSummAux.length;
  }

  shortValues(value) {
    const count = this.digits_count(value);

    if (count >= 67) {
      value = Math.round(value / Math.pow(10, 66)); value = value + 'c';
    } else if (count >= 64) {
      value = Math.round(value / Math.pow(10, 63)); value = value + 'v';
    } else if (count >= 61) {
      value = Math.round(value / Math.pow(10, 60)); value = value + 'N';
    } else if (count >= 58) {
      value = Math.round(value / Math.pow(10, 57)); value = value + 'O';
    } else if (count >= 55) {
      value = Math.round(value / Math.pow(10, 54)); value = value + 'St';
    } else if (count >= 52) {
      value = Math.round(value / Math.pow(10, 51)); value = value + 'Sd';
    } else if (count >= 49) {
      value = Math.round(value / Math.pow(10, 48)); value = value + 'Qd';
    } else if (count >= 46) {
      value = Math.round(value / Math.pow(10, 45)); value = value + 'Qt';
    } else if (count >= 43) {
      value = Math.round(value / Math.pow(10, 42)); value = value + 'T';
    } else if (count >= 40) {
      value = Math.round(value / Math.pow(10, 39)); value = value + 'D';
    } else if (count >= 37) {
      value = Math.round(value / Math.pow(10, 36)); value = value + 'U';
    } else if (count >= 34) {
      value = Math.round(value / Math.pow(10, 33)); value = value + 'd';
    } else if (count >= 31) {
      value = Math.round(value / Math.pow(10, 30)); value = value + 'n';
    } else if (count >= 28) {
      value = Math.round(value / Math.pow(10, 27)); value = value + 'o';
    } else if (count >= 25) {
      value = Math.round(value / Math.pow(10, 24)); value = value + 'S';
    } else if (count >= 22) {
      value = Math.round(value / Math.pow(10, 21)); value = value + 's';
    } else if (count >= 19) {
      value = Math.round(value / Math.pow(10, 18)); value = value + 'Q';
    } else if (count >= 16) {
      value = Math.round(value / Math.pow(10, 15)); value = value + 'q';
    } else if (count >= 13) {
      value = Math.round(value / Math.pow(10, 12)); value = value + 't';
    } else if (count >= 10) {
      value = Math.round(value / Math.pow(10, 9)); value = value + 'B';
    } else if (count >= 7) {
      value = Math.round(value / Math.pow(10, 6)); value = value + 'M';
    } else if (count >= 4) {
      value = Math.round(value / Math.pow(10, 3)); value = value + 'K';
    }
    return value;
  }

  digits_count(n) {
    let count = 0;
    if (n >= 1) { ++count; }
    while (n / 10 >= 1) { n /= 10; ++count; }
    return count;
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
      if (d.likeCount > 0) {
        return 'Liked';
      } else {
        return 'Others';
      }
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
    this.likeBarChart.renderLabel(true).label(function (d) { barOrder.push({label: d.data.key.toString()}); return d.data.key; });
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
      document.getElementById('summary').classList.remove('hide');
      document.getElementById('likeChart').classList.add('hide');
    } else if (this.compView) {
      document.getElementById('summary').classList.add('hide');
      document.getElementById('likeChart').classList.remove('hide');
    }
  }
}
