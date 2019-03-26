import { Component, OnInit } from '@angular/core';
import { ChartService } from '../services/chart.service';
import * as d3 from 'd3';
import * as dc from 'dc';

@Component({
  selector: 'app-language',
  templateUrl: './language.component.html',
  styleUrls: ['./language.component.scss']
})
export class LanguageComponent implements OnInit {
  aggrView = true;
  compView = false;
  langSumm = [];
  cfilter: CrossFilter.CrossFilter<{}>;
  dimension: CrossFilter.Dimension<{}, Date>;
  dimensionBar: CrossFilter.Dimension<{}, number>;
  data: any[];
  languageChart: dc.LineChart;
  barChart: dc.BarChart;
  langGroups: { group: CrossFilter.Group<{}, Date, any>, lang: string}[];
  private maxGroupValue;
  renderedChart = false;
  notDataWarn = false;

  constructor(private chartService: ChartService) { }

  ngOnInit() {
    // initialization of the chart
    this.languageChart = dc.lineChart('#languageGraph');
    this.barChart = dc.barChart('#languageBarGraph');
    this.chartService.getCrossfilter().subscribe((filter) => {
      this.cfilter = filter;
      this.setDimension();
      this.setBarDimension();
      if (this.data && this.data.length > 0) {
        this.langGroups = this.getLanguageGroups();
        this.countMainLang();

        // If there is at least one language group:
        if (this.langGroups[0]) {
          this.notDataWarn = false;
          this.renderChart();
          this.renderBarChart();
        } else {
          this.notDataWarn = true;
        }
      }
    });
    this.chartService.GetData().subscribe((data) => {
      this.data = data;
    });

    // gets the range through the chart service from the mainVis Component
    this.chartService.getChartRange().subscribe((range) => {
      if (this.data !== undefined && range.range !== null && range.range !== undefined) {
        this.languageChart
          .x(d3.scaleTime().domain([range.range[0], range.range[1]]))
          .y(d3.scaleLinear().domain([0, this.getMaxGroupValue()]))
          .round(d3.timeMonth);
        this.languageChart.redraw();
      } else {
        if (!dc.chartRegistry.list().some((c) => c.hasFilter())) {
          this.languageChart
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

  // returns a crossfilter-group for each language x
  private getLanguageGroups(): { group: CrossFilter.Group<{}, Date, any>, lang: string}[] {
    if (this.data.length < 0) { return; }
    const groups: { group: CrossFilter.Group<{}, Date, any>, lang: string}[] = [];

    // group by language
    const nested = d3.nest()
      .key((d: any) => {
        if (d.analysis && d.analysis.mainLanguage) {
          return d.analysis.mainLanguage;
        } else {
          return 'N/A';
        }
      })
      .entries(this.data);

    nested.forEach((language) => {
      const g = this.dimension.group().reduceSum((d: any) => {
        if (d.analysis && d.analysis.mainLanguage) {
          return d.analysis.mainLanguage === language.key;
        } else {
          return false;
        }
      });

      groups.push({group: g, lang: language.key });
    });

    // sort by language groups which have the most data in it
    groups.sort((a, b) => {
      let anum = 0;
      let bnum = 0;
      a.group.all().forEach((date) => { anum += date.value; });
      b.group.all().forEach((date) => { bnum += date.value; });

      if (anum > bnum) {
        return -1;
      } else if (anum === bnum) {
        return 0;
      } else {
        return 1;
      }
    });

    return groups;
  }

  countMainLang() {
    const langSummAux = [];
    this.data.forEach((d) => {
      if (d.analysis && d.analysis.mainLanguage) {
        let inList = false;
        let countedSongidx = 0;

        // Is the song already in the list?
        langSummAux.forEach((lang) => {
          if (inList === false) {
            if (lang.song === d.song) { inList = true; } else { countedSongidx++; }
          }
        });

        // Get values for each language
        if (inList) {
          if (d.analysis.mainLanguage === this.langGroups[0].lang) {
            langSummAux[countedSongidx].firstLang++;
          } else if (d.analysis.mainLanguage === this.langGroups[1].lang) {
            langSummAux[countedSongidx].secondLang++;
          } else if (d.analysis.mainLanguage === this.langGroups[2].lang) {
            langSummAux[countedSongidx].thirdLang++;
          } else {
            langSummAux[countedSongidx].otherLang++;
          }
        } else {
          if (d.analysis.mainLanguage === this.langGroups[0].lang) {
            langSummAux.push({ song: d.song, firstLang: 1, secondLang: 0, thirdLang: 0, otherLang: 0 });
          } else if (d.analysis.mainLanguage === this.langGroups[1].lang) {
            langSummAux.push({ song: d.song, firstLang: 0, secondLang: 1, thirdLang: 0, otherLang: 0 });
          } else if (d.analysis.mainLanguage === this.langGroups[2].lang) {
            langSummAux.push({ song: d.song, firstLang: 0, secondLang: 0, thirdLang: 1, otherLang: 0 });
          } else {
            langSummAux.push({ song: d.song, firstLang: 0, secondLang: 0, thirdLang: 0, otherLang: 1 });
          }
        }

      }
    });

    this.langSumm = langSummAux;
  }

  // returns the max value for the domain of the chart
  getMaxGroupValue(): number {
    let m = 0;
    this.dimension.group().all().forEach((date: any) => {
      if (date.value > m) { m = date.value; }
    });
    return m;
  }

  // renders the chart
  renderChart () {
    this.maxGroupValue = this.getMaxGroupValue();
    const group1 = this.langGroups[0];
    this.languageChart
        .renderArea(true)
        .width(300)
        .height(200)
        .ordinalColors(['#8c564b', '#bcbd22', '#e377c2', '#17becf', '#7f7f7f', '#9467bd', '#d62728', '#2ca02c', '#ff7f0e', '#1f77b4'])
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
        .group(group1.group, group1.lang)
        .valueAccessor(function (d) {
            return d.value;
        })
        .xAxis().ticks(4);
      let maxLang = 0;
      this.langGroups.forEach((group) => {
        if (group.group === group1.group || maxLang === 2) {
          return;
        }
        // stacks the groups
        this.languageChart
          .stack(group.group, group.lang, function (d) {
          return d.value;
        });
        maxLang++;
      });
    this.languageChart.render();
  }

  // Get summed values for the bar chart
  getPercentLang (id: any, lang: string) {
    let groupedValue = 0;
    let countedSongidx = 0;
    let inList = false;
    let sumAll = 0;

    this.langSumm.forEach((sent) => {
      if (inList === false) {
        if (sent.song === id) { inList = true; } else { countedSongidx++; }
      }
    });

    if (inList) { // song: d.song, firstLang: 0, secondLang: 0, thirdLang: 0, otherLang
      const langOne = this.langSumm[countedSongidx].firstLang;
      const langTwo = this.langSumm[countedSongidx].secondLang;
      const langThree = this.langSumm[countedSongidx].thirdLang;
      const langOthers = this.langSumm[countedSongidx].otherLang;
      sumAll = langOne + langTwo + langThree + langOthers;

      if (this.langGroups[0] && lang === this.langGroups[0].lang) {
        groupedValue = (langOne * 100) / sumAll;
      } else if (this.langGroups[1] && lang === this.langGroups[1].lang) {
        groupedValue = (langTwo * 100) / sumAll;
      } else if (this.langGroups[2] && lang === this.langGroups[2].lang) {
        groupedValue = (langThree * 100) / sumAll;
      } else if (lang === 'RemainingLang') {
        groupedValue = (langOthers * 100) / sumAll;
      } else if (lang !== 'NA') { console.log('lang' + lang + ' does not exist'); }
    } else {
      if (lang === 'NA') { return 100; }
    }

    return groupedValue;
  }

  defineChartColors() {
    switch (Object.keys(this.langGroups).length) {
      case 1:
        return ['#8c564b', '#EEEEEE'];
      case 2:
        return ['#8c564b', '#bcbd22', '#EEEEEE'];
      default:
        return ['#8c564b', '#bcbd22', '#e377c2', '#EEEEEE'];
    }
  }

   // renders the bar chart
   renderBarChart() {
    const checklist = [];
    const barOrder = [];
    const chartColors = this.defineChartColors();

    const group = this.dimensionBar.group().reduceSum((d: any) => {
      let returning = false;
      const value = this.langGroups[0].lang;
      checklist.forEach((e) => { if (e.song === d.song && e.value === value) { returning = true; } });
      if (returning) { return 0; }
      checklist.push({ song: d.song, value: value });
      return this.getPercentLang(d.song, this.langGroups[0].lang);
    });

    this.barChart
      .width(300)
      .height(200)
      .ordinalColors(chartColors)
      .useViewBoxResizing(true)
      .dimension(this.dimensionBar)
      .yAxisLabel('Language (%)')
      .x(d3.scaleBand())
      .y(d3.scaleLinear().domain([0, 100]))
      .xUnits(dc.units.ordinal)
      .brushOn(false)
      .controlsUseVisibility(true)
      .barPadding(0.1)
      .outerPadding(0.05)
      .renderTitle(false)
      .group(group, this.langGroups[0].lang);

      if (this.langGroups[1]) {
        this.barChart
        .stack(this.dimensionBar.group().reduceSum((d: any) => {
          let returning = false;
          const value = this.langGroups[1].lang;
          checklist.forEach((e) => {if (e.song === d.song && e.value === value) { returning = true; } });
          if (returning) { return 0; }
          checklist.push({ song: d.song, value: value });
          return this.getPercentLang(d.song, this.langGroups[1].lang);
        }), this.langGroups[1].lang);
      }

      if (this.langGroups[2]) {
        this.barChart
        .stack(this.dimensionBar.group().reduceSum((d: any) => {
          let returning = false;
          const value = this.langGroups[2].lang;
          checklist.forEach((e) => { if (e.song === d.song && e.value === value) { returning = true; } });
          if (returning) { return 0; }
          checklist.push({ song: d.song, value: value });
          return this.getPercentLang(d.song, this.langGroups[2].lang);
        }), this.langGroups[2].lang);
      }

      this.barChart
      .stack(this.dimensionBar.group().reduceSum((d: any) => {
        let returning = false;
        const value = 'RemainingLang';
        checklist.forEach((e) => { if (e.song === d.song && e.value === value) { returning = true; } });
        if (returning) { return 0; }
        checklist.push({ song: d.song, value: value });
        return this.getPercentLang(d.song, 'RemainingLang');
      }), 'others');

      this.barChart.margins().right = 80;
      this.barChart.margins().left = 50;
      this.barChart.margins().bottom = 30;
      this.barChart.renderLabel(true).label(function (d) { barOrder.push({ label: d.data.key.toString() }); return d.data.key; });
      this.barChart.legend(dc.legend().gap(5).x(220).y(10));
      this.barChart.render();
      this.renderedChart = true;
      const tooltipBar = d3.selectAll('.tooltipBar');

      // Callback functions to display tooltips over each bar
      this.barChart.renderlet((chart) => {
        chart.selectAll('.bar')
          .on('mouseover.samba', (d, e) => {
            tooltipBar.transition().duration(150).style('opacity', .9);
            if (barOrder[e]) {
              // First language info
              let FirstLang = this.langGroups[0].lang + ': ' + this.getPercentLang(barOrder[e].label, this.langGroups[0].lang).toFixed(1);
              FirstLang = FirstLang + '%<br/>';
              let SecLang = '';
              let ThrLang = '';

              // Second language info
              if (this.langGroups[1]) {
                SecLang = this.langGroups[1].lang + ': ' + this.getPercentLang(barOrder[e].label, this.langGroups[1].lang).toFixed(1);
                SecLang = SecLang + '%<br/>';
              }

              // Third language info
              if (this.langGroups[2]) {
                ThrLang = this.langGroups[2].lang + ': ' + this.getPercentLang(barOrder[e].label, this.langGroups[2].lang).toFixed(1);
                ThrLang = ThrLang + '%<br/>';
              }

              // Remaining languages info and tooltips
              const OthLang = 'others: ' + this.getPercentLang(barOrder[e].label, 'RemainingLang').toFixed(1);
              tooltipBar.html(barOrder[e].label + '<br/>' + FirstLang + '' + SecLang + '' + ThrLang + '' + OthLang + '%')
                .style('left', ((<any>d3).event.pageX) - 10 + 'px')
                .style('top', ((<any>d3).event.pageY) + 'px');
              }
          })
          .on('mouseout.samba', (d) => { tooltipBar.transition().duration(350).style('opacity', 0); });
      });
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
      document.getElementsByClassName('langAggr')[0].classList.toggle('active');
      document.getElementsByClassName('langComp')[0].classList.toggle('active');
    } else if (button === 'compButton' && !this.compView) {
      this.aggrView = false;
      this.compView = true;
      document.getElementsByClassName('langAggr')[0].classList.toggle('active');
      document.getElementsByClassName('langComp')[0].classList.toggle('active');
    }
    this.setVisibilityofViews();
  }

  setVisibilityofViews() {
    if (this.aggrView) {
      document.getElementById('languageGraph').classList.remove('hide');
      document.getElementById('languageBarGraph').classList.add('hide');
    } else if (this.compView) {
      document.getElementById('languageGraph').classList.add('hide');
      document.getElementById('languageBarGraph').classList.remove('hide');
    }
  }
}
