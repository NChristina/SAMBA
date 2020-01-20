import { Component, OnInit } from '@angular/core';
import { ChartService } from '../../services/chart.service';
import * as langCodes from '../../../../shared/iso639';
import * as d3 from 'd3';
import * as dc from 'dc';

@Component({
  selector: 'app-time-language',
  templateUrl: './time-language.component.html',
  styleUrls: ['./time-language.component.scss']
})
export class TimeLanguageComponent implements OnInit {
  cfilter: CrossFilter.CrossFilter<{}>;
  dimension: CrossFilter.Dimension<{}, Date>;
  dimensionBar: CrossFilter.Dimension<{}, number>;
  data: any[];
  languageChart: dc.LineChart;
  langGroups: { group: CrossFilter.Group<{}, Date, any>, lang: string}[];
  renderedChart = false;
  notDataWarn = false;
  langCaption = '';
  showLangCaption = false;
  appliedFilter = false;
  chartHeight = 300;
  chartRange1;
  chartRange2;
  chartRangeFilter1;
  chartRangeFilter2;

  constructor(private chartService: ChartService) { }

  ngOnInit() {
    this.languageChart = dc.lineChart('#languageGraph');
    this.chartService.GetData().subscribe((data) => { this.data = data; });

    // Crossfilter
    this.chartService.getCrossfilter().subscribe((filter) => {
      this.cfilter = filter;
      this.setDimension();
      if (this.data && this.data.length > 0) {
        this.langGroups = this.getLanguageGroups();
        if (this.langGroups[0]) {
          this.notDataWarn = false;
          this.appliedFilter = false;
          this.renderChart();
          this.showCaption();
          this.showLangCaption = true;
        } else {
          this.notDataWarn = true;
          this.showLangCaption = false;
        }
      } else {
        this.showLangCaption = false;
      }
    });

    // Collapsible view
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
      if (range.chart === null) {
        if (this.data && range.range) {
          (this.diff_months(range.range[0], range.range[1]) < 2) ? this.notDataWarn = true : this.notDataWarn = false;
          this.chartRangeFilter1 = range.range[0];
          this.chartRangeFilter2 = range.range[1];
          this.languageChart
            .x(d3.scaleTime().domain([this.chartRangeFilter1, this.chartRangeFilter2]))
            .y(d3.scaleLinear().domain([0, this.getMaxGroupValue(this.chartRangeFilter1, this.chartRangeFilter2)]))
            .round(d3.timeMonth);
          this.appliedFilter = true;
          this.languageChart.redraw();

        } else {
          if (!dc.chartRegistry.list().some((c) => c.hasFilter())) {
            this.notDataWarn = false;
            this.languageChart
            .x(d3.scaleTime().domain([this.chartRange1, this.chartRange2]))
            .y(d3.scaleLinear().domain([0, this.getMaxGroupValue(this.chartRange1, this.chartRange2)]));
          this.appliedFilter = false;
          }

          if (this.data && this.data.length > 0) {
            this.langGroups = this.getLanguageGroups();
          }
        }
      }
    });

    this.renderedChart = false;
  }

  // sets the tooltip on mouseover
  setTooltipInfo(event: MouseEvent, tooltip: HTMLSpanElement) {
    tooltip.style.position = 'fixed';
    tooltip.style.top = (event.clientY) + 'px';
    tooltip.style.left = (event.clientX - tooltip.offsetWidth - 5) + 'px';
  }

  showCaption() {
    let caption = '';
    if (this.langGroups[0]) {
      caption = caption + '(' + this.langGroups[0].lang + ') ' + this.codeToLanguage(this.langGroups[0].lang);
    }
    if (this.langGroups[1]) {
      caption = caption + ', (' + this.langGroups[1].lang + ') ' + this.codeToLanguage(this.langGroups[1].lang);
    }
    if (this.langGroups[2]) {
      caption = caption + ', (' + this.langGroups[2].lang + ') ' + this.codeToLanguage(this.langGroups[2].lang);
    }

    this.langCaption = caption;
  }

  codeToLanguage(code: string) {
    let result = code;
    langCodes.iso639.forEach((l) => {
      if (l.code === code) { result = l.lang; }
    });

    return result;
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

  // Time-based Stacked Chart /////////////////////////////////////////////////////////////////////////////////////////

  // returns a crossfilter-group for each language x
  private getLanguageGroups(): { group: CrossFilter.Group<{}, Date, any>, lang: string}[] {
    if (this.data && this.data.length < 0) { return; }
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

  // renders the chart
  renderChart () {
    this.chartRange1 = d3.min(this.data, (d: any) => new Date(d.publishedAt));
    this.chartRange2 = d3.max(this.data, (d: any) => new Date(d.publishedAt));
    const group1 = this.langGroups[0];
    this.languageChart
      .renderArea(true)
      .width(900)
      .height(this.chartHeight)
      .ordinalColors(['#8c564b', '#bcbd22', '#e377c2', '#17becf', '#7f7f7f', '#9467bd', '#d62728', '#2ca02c', '#ff7f0e', '#1f77b4'])
      .useViewBoxResizing(true)
      .dimension(this.dimension)
      .x(d3.scaleTime().domain([this.chartRange1, this.chartRange2]))
      .y(d3.scaleLinear().domain([0, this.getMaxGroupValue(this.chartRange1, this.chartRange2)]))
      .yAxisLabel('Comments')
      .interpolate('monotone')
      .legend(dc.legend().x(850).y(0).itemHeight(9).gap(5))
      .brushOn(false)
      .group(group1.group, group1.lang)
      .valueAccessor(function (d) {
          return d.value;
      })
      .xAxis().ticks(7);
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

    // When filter is applied before refreshing the chart
    if (this.appliedFilter) {
      this.languageChart.x(d3.scaleTime().domain([this.chartRangeFilter1, this.chartRangeFilter2]));
    }

    // Brush: get range and send it to the other charts on brush-filtering
    this.languageChart.on('filtered', (chart, filter) => {
      if (filter) {
        this.languageChart.y(d3.scaleLinear().domain([0, this.getMaxGroupValue(filter[0], filter[1])]));
      } else {
        this.languageChart.y(d3.scaleLinear().domain([0, this.getMaxGroupValue(this.chartRange1, this.chartRange2)]));
      }
      this.chartService.setChartRange({range: filter, chart: chart});
    });

    // Adapt chart for smaller view
    (this.chartHeight < 300) ? this.languageChart.yAxis().ticks(2) : this.languageChart.yAxis().ticks(10);
    (this.chartHeight < 300) ? this.languageChart.xAxisLabel('') : this.languageChart.xAxisLabel('Date');

    this.languageChart.xAxis().tickFormat(d3.timeFormat('%b %Y')); // month

    this.languageChart.render();
  }

  // Returns the max value for the domain of the chart
  getMaxGroupValue(begin, end): number {
    let m = 0;
    const currentFilterValues = [];
    const allDimension = this.dimension.group().all();

    allDimension.forEach( d => {
      if (d['key'] <= end && d['key'] >= begin) {
        currentFilterValues.push(d);
      }
    });
    currentFilterValues.forEach((date: any) => {
      if (date.value > m) { m = date.value; }
    });
    return m / 100 * 110;
  }
}
