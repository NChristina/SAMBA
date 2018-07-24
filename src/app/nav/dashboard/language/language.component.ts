import { Component, OnInit } from '@angular/core';
import { ChartService } from '../services/chart.service';
import * as d3 from 'd3';
import * as crossfilter from 'crossfilter';
import * as dc from 'dc';

@Component({
  selector: 'app-language',
  templateUrl: './language.component.html',
  styleUrls: ['./language.component.scss']
})
export class LanguageComponent implements OnInit {

  cfilter: CrossFilter.CrossFilter<{}>;
  dimension: CrossFilter.Dimension<{}, Date>;
  data: any[];
  languageChart: dc.LineChart;

  groups: CrossFilter.Group<{}, Date, any>[];
  private maxGroupValue;

  constructor(private chartService: ChartService) { }

  ngOnInit() {
    this.languageChart = dc.lineChart('#languageGraph');
    this.chartService.getCrossfilter().subscribe((filter) => {
      this.cfilter = filter;
      this.setDimension();
      if (this.data !== undefined && this.data.length > 0) {
        this.renderChart();
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
  }

  // sets the crossfilter dimension
  setDimension() {
    this.dimension = this.cfilter.dimension((d: any) => {
      const splitted = d.publishedAt.split('-');
      return new Date(splitted[0] + '-' + splitted[1]);
    });
  }

  // returns a crossfilter-group for each language
  private getLanguageGroups(): { group: CrossFilter.Group<{}, Date, any>, lang: string}[] {
    if (this.data.length < 0) {
      return;
    }
    const groups: { group: CrossFilter.Group<{}, Date, any>, lang: string}[] = [];
    // group by language
    const nested = d3.nest()
      .key((d: any) =>  d.analysis.mainLanguage)
      .entries(this.data);
    nested.forEach((language) => {
      const g = this.dimension.group().reduceSum((d: any) => {
        return d.analysis.mainLanguage === language.key;
      });
      groups.push({group: g, lang: language.key });
    });
    // sort by language groups which have the most data in it
    groups.sort((a, b) => {
      let anum = 0;
      let bnum = 0;
      a.group.all().forEach((date) => {
        anum += date.value;
      });
      b.group.all().forEach((date) => {
        bnum += date.value;
      });
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

  getMaxGroupValue(): number {
    let m = 0;
    this.dimension.group().all().forEach((date: any) => {
      if (date.value > m) {
        m = date.value;
      }
    });
    return m;
  }

  renderChart () {
    const groups: { group: CrossFilter.Group<{}, Date, any>, lang: string}[] = this.getLanguageGroups();
    this.maxGroupValue = this.getMaxGroupValue();
    const group1 = groups[0];
    this.languageChart
        .renderArea(true)
        .width(300)
        .height(200)
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
      groups.forEach((group) => {
        if (group.group === group1.group || maxLang === 2) {
          return;
        }
        this.languageChart
          .stack(group.group, group.lang, function (d) {
          return d.value;
        });
        maxLang++;
      });
    this.languageChart.render();
  }
}
