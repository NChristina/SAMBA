import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import * as crossfilter from 'crossfilter';
import * as dc from 'dc';
import { ChartService } from '../services/chart.service';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss']
})
export class CommentComponent implements OnInit {
  foodControl = new FormControl();
  whatOrder = 0;

  filter = [
    { value: 'comments asc', description: 'comments asc'},
    { value: 'comments desc', description: 'comments desc'},
    { value: 'likes asc', description: 'likes asc'},
    { value: 'likes desc', description: 'likes desc'},
    { value: 'date asc', description: 'date asc'},
    { value: 'date desc', description: 'date desc' },
  ];


  commentTable: dc.DataGridWidget;
  cfilter: CrossFilter.CrossFilter<{}>;
  dimension: CrossFilter.Dimension<{}, Date>;
  data: any[];
  constructor(private chartService: ChartService) { }

  ngOnInit() {
    this.commentTable = dc.dataGrid('#commentSection');
    // subscribing to the crossfilter in the chart service
    // crossfilter is needed to view the comments which are selected in any chart
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

  onFilterChange(currentValue) {

  }

  // sets the dimension
  setDimension() {
    this.dimension = this.cfilter.dimension((d: any) => {
      return new Date(d.publishedAt.split('T')[0]);
    });
  }

  // renders the comment table and sets the design and look
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
        html += '';
        html +=	'</div></div></div>';
        return html;
      }) // orders the comments by likes
      .order(d3.ascending)
      .order((a, b) => {
        // to decide after what critera the comments should be ordered
        console.log('I am rendering.');
        if (this.whatOrder === 0) {
          return a.replyCount > b.replyCount ? -1 : 1;
        } else if (this.whatOrder === 1) {
          return a.replyCount < b.replyCount ? -1 : 1;
        } else if (this.whatOrder === 2) {
          return a.likeCount > b.likeCount ? -1 : 1;
        } else if (this.whatOrder === 3) {
          return a.likeCount < b.likeCount ? -1 : 1;
        } else if (this.whatOrder === 4) {
          return a.publishedAt > b.publishedAt ? -1 : 1;
        } else if (this.whatOrder === 5) {
          return a.publishedAt < b.publishedAt ? -1 : 1;
        }

        // console.log('a datapoint: ', a, '; b datapoint: ', b);
      return a.replyCount > b.replyCount ? -1 : 1;
      })

      .renderLabel(false)
      .renderTitle(false);
    this.commentTable.render();
  }



  onSelectionChange(event: { index: any, value: any }) {
    // console.log(`onSelectionChange: ${event.value}`);

    switch (event.value) {
      case 'comments asc':
      // console.log('valueChanged: ', event.value);
      this.whatOrder = 0;
      this.renderCommentTable();
      break;

      case 'comments desc':
      // console.log('valueChanged: ', event.value);
      this.whatOrder = 1;
      this.renderCommentTable();
      break;

      case 'likes asc':
      // console.log('valueChanged: ', event.value);
      this.whatOrder = 2;
      this.renderCommentTable();
      break;

      case 'likes desc':
      // console.log('valueChanged: ', event.value);
      this.whatOrder = 3;
      this.renderCommentTable();
      break;

      case 'date asc':
      // console.log('valueChanged: ', event.value);
      this.whatOrder = 4;
      this.renderCommentTable();
      break;

      case 'date desc':
      // console.log('valueChanged: ', event.value);
      this.whatOrder = 5;
      this.renderCommentTable();
      break;

    }

  }
  // converts the published date into a viewable format (looks better :))
  private dateTimeParser (publishedDate: string) {
    const date = publishedDate.split('T')[0];
    const time = publishedDate.split('T')[1].split('.')[0];
    return date + ' ' + time;
  }
}
