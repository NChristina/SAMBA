import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import * as crossfilter from 'crossfilter';
import * as dc from 'dc';
import { ChartService } from '../services/chart.service';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss']
})
export class CommentComponent implements OnInit {

  commentTable: dc.DataGridWidget;
  cfilter: CrossFilter.CrossFilter<{}>;
  dimension: CrossFilter.Dimension<{}, Date>;
  data: any[];
  constructor(private chartService: ChartService) { }

  ngOnInit() {
    this.commentTable = dc.dataGrid('#commentSection');
    // subscribing to the crossfilter in the chart service
    this.chartService.getCrossfilter().subscribe((filter) => {
      this.cfilter = filter;
      this.setDimension();
      this.renderCommentTable();
    });
    // subscribing to the data in the chart service
    this.chartService.GetData().subscribe((data) => {
      this.data = data;
    });
  }

  setDimension() {
    this.dimension = this.cfilter.dimension((d: any) => {
      return new Date(d.publishedAt.split('T')[0]);
    });
  }

  renderCommentTable() {
    const dateGroup = this.dimension.group();
    this.commentTable
      .dimension(this.dimension)
      .group(function (d) {
        return d.value;
      })
      .html((d) => {
        let html = '';
        html += '<div class="comment-wrap"><div class="comment-block"><div class="comment-song">' + d.artist + ' - ' + d.song + '</div>';
        html += '<div class="comment-author">';
        html += '<mdc-icon _ngcontent-c1="" mdclistitemmeta="" aria-hidden="true" class="material-icons ng-mdc-icon comment-thumb">';
        html += 'account_circle</mdc-icon> ' + d.authorDisplayName + ' | ' + this.dateTimeParser(d.publishedAt) + '</div>';
        html +=	'<p class="comment-text">' + d.text + '</p>';
        html += '<div class="bottom-comment">';
        html += '<div class="comment-date">' + d.likeCount;
        html += ' <mdc-icon _ngcontent-c1="" mdclistitemmeta="" aria-hidden="true" class="material-icons ng-mdc-icon comment-thumb">';
        html += 'thumb_up</mdc-icon> | ' + d.replyCount + ' ';
        html += '<mdc-icon _ngcontent-c1="" mdclistitemmeta="" aria-hidden="true" class="material-icons ng-mdc-icon comment-thumb">';
        html += 'reply</mdc-icon></div>';
        // html +=	'<ul class="comment-actions">';
        // html +=	'<li class="complain">' + d.authorDisplayName + ' </li></ul>';
        html += '';
        html +=	'</div></div></div>';
        return html;
      })
      .order((a, b) => {
        return a.likeCount > b.likeCount ? -1 : 1;
      })
      .renderLabel(false)
      .renderTitle(false);
    this.commentTable.render();
  }

  // converts the published date into a viewable format
  private dateTimeParser (publishedDate: string) {
    const date = publishedDate.split('T')[0];
    const time = publishedDate.split('T')[1].split('.')[0];
    return date + ' ' + time;
  }
}
