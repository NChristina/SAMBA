import { Component, OnInit, Input } from '@angular/core';
import * as crossfilter from 'crossfilter';
import * as dc from 'dc';
import { ChartService } from '../services/chart.service';
import { FormControl } from '@angular/forms';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss'],
})
export class CommentComponent implements OnInit {
  @Input() ids: any;
  @Input() startDate: any;
  @Input() endDate: any;

  // @Input() idsForChild: any;
  // @Input() startDateForChild: any;
  // @Input() endDateForChild: any;
  nbComments = 25; // default
  order = 'repliesDesc'; // default

  // what i need in this component:
  // start date & end date & ids of all elements at the beginning
  // all the rest i get from get chartrange



  whatOrder = 0;

  filter = [
    { value: 'replies desc', description: 'replies desc'},
    { value: 'replies asc', description: 'replies asc'},
    { value: 'likes desc', description: 'likes desc'},
    { value: 'likes asc', description: 'likes asc'},
    { value: 'date desc', description: 'date desc'},
    { value: 'date asc', description: 'date asc' },
  ];
  foodControl = new FormControl();

  constructor(private chartService: ChartService, private dataService: DataService) {

  }

  ngOnInit() {
    console.log(this.ids);
    this.chartService.getChartRange().subscribe( data => {
      console.log('COMMENT -- I RECEIVED RANGE CHANGE: ', data);
      console.log('miep: ', this.ids);
      // if(this.startDate !== null && this.endDate !== null && this.ids.length > 0) {
      //   this.dataService.getComments(this.nbComments, this.order, this.ids, this.startDate, this.endDate).subscribe( result => {
      //     console.log('COMMENT: ', result);

      //   });
      // }
    });

    this.chartService.getCrossfilter().subscribe( d => {
      console.log('crossfilter: ', d.dimension.length);
      console.log('troll: ', this.ids);
    });

    this.chartService.GetData().subscribe((data) => {
      console.log('subscription of getData.... ', data);
      console.log('are the ids already there? ', this.ids);
    });
  }

  // commentTable: dc.DataGridWidget;
  // cfilter: CrossFilter.CrossFilter<{}>;
  // dimension: CrossFilter.Dimension<{}, Date>;
  // data: any[];
  // sizeforTable = 25;

  // constructor(private chartService: ChartService) { }

  // ngOnInit() {

  //   this.commentTable = dc.dataGrid('#commentSection');

  //   // subscribing to the crossfilter in the chart service
  //   // crossfilter is needed to view the comments which are selected in any chart
  //   this.chartService.getCrossfilter().subscribe((filter) => {
  //     this.cfilter = filter;
  //     console.log('Filter data: ', filter);
  //     this.setDimension();
  //     this.renderCommentTable();
  //   });
  // }

  // // sets the dimension
  // setDimension() {
  //   this.dimension = this.cfilter.dimension((d: any) => {
  //     return new Date(d.publishedAt.split('T')[0]);
  //   });
  // }

  // orderDataAfterCurrentCriteria() {
  //     this.dimension = this.cfilter.dimension((d: any) => {
  //       if (this.whatOrder === 0) { return d.replies;
  //       } else if (this.whatOrder === 1) {return d.replies[d.replies.length];
  //       } else if (this.whatOrder === 2) {return d.likeCount;
  //       } else if (this.whatOrder === 3) {return d.likeCount[d.likeCount.length];
  //       } else if (this.whatOrder === 4) {return new Date(d.publishedAt.split('T')[0]);
  //       } else if (this.whatOrder === 5) {return new Date(d.publishedAt.split('T')[d.publishedAt.length]); }
  //     });
  // }

  // // renders the comment table and sets the design and look
  // renderCommentTable() {
  //   const dateGroup = this.dimension.group();
  //   this.orderDataAfterCurrentCriteria();


  //   this.commentTable
  //     .dimension(this.dimension)
  //     .group(function (d) {
  //       console.log('Group: ', d);
  //       return d.value;
  //     })
  //     .html((d) => {
  //       let html = `
  //       <div style="box-shadow: rgba(0, 0, 0, 0.3) 7px 7px 7px; padding: 20px 5px 30px 5px">
  //         <div class="post-heading">
  //           <div class="comment-author">
  //             <img src="../../../../assets/user.svg" style ="height: 20px; margin: 0px 5px -5px 0px"> ` + d.authorDisplayName +
  //             ` | <a href="https://www.youtube.com/watch?v=` + d.video_key + `&lc=` + d._key +
  //             `" style="text-decoration:none; color:#acb4c2" target="_blank">
  //             ` + this.dateTimeParser(d.publishedAt) + `
  //             <a href="https://www.youtube.com/watch?v=` + d.video_key +
  //             `" style="float:right; margin-right:30px; font-weight:bold; text-decoration:none; color:#acb4c2" target="_blank">
  //               ` + d.artist + ` - ` + d.song + `
  //             </a>
  //           </div>
  //         </div>
  //         <p class="comment-text">` + d.text + ` </p>
  //         <div class="bottom-comment" style="float: left; margin-left: 15px"> ` +
  //           d.likeCount + `
  //           <img src="../../../../assets/002-like.svg" height="15px" "class="iconStyle" style="margin: 0px 5px 0px 5px"> |
  //           <a style="text-decoration: none; cursor: pointer;" class="accordion" id="replyCount_` + d._key + `">
  //             <img src="../../../../assets/001-reply.svg" height="15px" class="iconStyle" style="margin: 0px 5px 0px 5px">
  //             <img src="../../../../assets/010-down.svg" height="15px" id="iDown_` + d._key + `" style="display:inline;margin: 0px 3px">
  //             <img src="../../../../assets/010-up.svg" height="15px" id="iUp_` + d._key + `" style="display:none;margin: 0px 3px">
  //           </a> |
  //           <a style="text-decoration: none; cursor: pointer;" class="sentBttn" id="sentBttn_` + d._key + `">
  //             ` + this.getSentiment(d.analysis, 'mean') + `
  //           </a>
  //           <div class="pSt" id="pSt_` + d._key + `" style="display:none; background:#aaa; color:#fff; font-size:0.8em; padding:1px 5px;">
  //             NLTK: ` + this.getSentiment(d.analysis, 'nltk') +
  //             ` | TextBlob: ` + this.getSentiment(d.analysis, 'blob') +
  //             ` | AFINN: ` + this.getSentiment(d.analysis, 'afinn') + `
  //           </div>
  //         </div>
  //         <div class="panelAc" id="replyPanel_` + d._key + `" style="display: none; margin-top: 40px;">
  //       `;

  //       // d.replies.forEach( reply => {
  //       //   html += `
  //       //       <hr>
  //       //       <div style="padding: 10px 10px 30px 50px">
  //       //         <div class="post-heading">
  //       //           <div class="comment-author">
  //       //             <img src="../../../../assets/user.svg" style ="height: 20px; margin: 0px 5px -5px 0px">` +
  //       //             reply.snippet.authorDisplayName + ` | ` + this.dateTimeParser(reply.snippet.publishedAt) + `
  //       //           </div>
  //       //         </div>
  //       //         <p class="comment-text" style="color: black"> ` + reply.snippet.textDisplay + ` </p>
  //       //         <div class="bottom-comment" style="float: left; margin-left: 15px"> ` +
  //       //           reply.snippet.likeCount + `
  //       //           <img src="../../../../assets/002-like.svg" height="15px" "class="iconStyle" style="margin: 0px 5px 0px 5px">
  //       //         </div>
  //       //       </div>`;
  //       // });
  //       html += `
  //           </div>
  //           </div>

  //         `;
  //       return html;

  //     }) // orders the comments by likes
  //     .size(this.sizeforTable)
  //     .renderLabel(false)
  //     .renderTitle(false);
  //   this.commentTable.render();
  //   this.buildReplyAccordion();
  //   this.buildSentimentBox();
  // }

  onSelectionChange(event: { index: any, value: any }) {

    switch (event.value) {
      case 'replies desc':
      this.whatOrder = 0;
      // this.orderDataAfterCurrentCriteria();
      // this.renderCommentTable();
      break;

      case 'replies asc':
      this.whatOrder = 1;
      // this.orderDataAfterCurrentCriteria();
      // this.renderCommentTable();
      break;

      case 'likes desc':
      this.whatOrder = 2;
      // this.orderDataAfterCurrentCriteria();
      // this.renderCommentTable();
      break;

      case 'likes asc':
      this.whatOrder = 3;
      // this.orderDataAfterCurrentCriteria();
      // this.renderCommentTable();
      break;

      case 'date desc':
      this.whatOrder = 4;
      // this.orderDataAfterCurrentCriteria();
      // this.renderCommentTable();
      break;

      case 'date asc':
      this.whatOrder = 5;
      // this.orderDataAfterCurrentCriteria();
      // this.renderCommentTable();
      break;

    }
  }

  // // get sentiment
  // private getSentiment (analysis: any, mode: string) {
  //   if (analysis && analysis.sentiment) {
  //     const sentiment = analysis.sentiment;
  //     if (mode === 'main') {
  //       return this.printSentiment(sentiment.mainSentiment, true);
  //     } else if (mode === 'nltk') {
  //       return this.printSentiment(sentiment.nltk.compound, false);
  //     } else if (mode === 'afinn') {
  //       return this.printSentiment(sentiment.afinn.normalized, false);
  //     } else if (mode === 'blob') {
  //       return this.printSentiment(sentiment.textBlob.polarity, false);
  //     } else if (mode === 'mean') {
  //       if (this.isIconsistent([sentiment.nltk.compound, sentiment.textBlob.polarity, sentiment.afinn.normalized])) {
  //         const sValue = '<spam style="color:#984ea3">Mixed</spam>';
  //         const iValue = '<img src="../../../../assets/009-warning.svg" height="13px" "class="iconStyle" style="margin: 0px 5px -2px 5px">';
  //         return sValue + iValue;
  //       } else {
  //         return this.printSentiment(((sentiment.nltk.compound + sentiment.afinn.normalized + sentiment.textBlob.polarity) / 3), true);
  //       }
  //     }
  //   } else {
  //     if (mode === 'main' || mode === 'mean') {
  //       return 'No Sentiment<img src="../../../../assets/008-NA.svg" height="13px" "class="iconStyle" style="margin: 0px 5px -2px 5px">';
  //     } else {
  //       return 'No Sentiment ';
  //     }
  //   }
  // }

  // // get sentiment
  // private printSentiment (sentValue: any, icon: boolean) {
  //   let scoreValue = '';
  //   let iconValue = '';
  //   let iconColor = '#999999';

  //   if (sentValue >= 0.5) {
  //     scoreValue = 'Very Positive'; iconValue = '007-verypos.svg'; iconColor = '#4daf4a';
  //   } else if (sentValue < 0.5 && sentValue > 0) {
  //     scoreValue = 'Positive'; iconValue = '006-pos.svg'; iconColor = '#4daf4a';
  //   } else if (sentValue === 0) {
  //     scoreValue = 'Neutral'; iconValue = '005-neu.svg'; iconColor = '#666666';
  //   } else if (sentValue < 0 && sentValue > -0.5) {
  //     scoreValue = 'Negative'; iconValue = '004-neg.svg'; iconColor = '#ff7f00';
  //   } else if (sentValue <= -0.5) {
  //     scoreValue = 'Very Negative'; iconValue = '003-veryneg.svg'; iconColor = '#ff7f00';
  //   } else {
  //     return 'NaN (' + sentValue + ')';
  //   }

  //   if (icon) {
  //     const iconhtml = '<img src="../../../../assets/' + iconValue + '" height="13px" "class="iconStyle" style="margin: 0px 5px -2px 5px">';
  //     return '<spam style="color:' + iconColor + '">' + scoreValue + '</spam>' + iconhtml;
  //   } else {
  //     return scoreValue;
  //   }
  // }

  // private isIconsistent (sentValues: any) {
  //   let countPos = 0;
  //   let countNeg = 0;

  //   sentValues.forEach((value) => {
  //     if (value > 0) {
  //       countPos++;
  //     } else if (value < 0) {
  //       countNeg++;
  //     }
  //   });

  //   if (countPos > 0 && countNeg > 0) {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }

  // // converts the published date into a viewable format (looks better :))
  // private dateTimeParser (publishedDate: string) {
  //   console.log('yyyy: ', publishedDate);
  //   // const date = publishedDate.split('T')[0];
  //   // const time = publishedDate.split('T')[1].split('.')[0];
  //   // return date + ' ' + time;
  //   return publishedDate;
  // }

  // buildSentimentBox() {
  //   const sentBttn = document.getElementsByClassName('sentBttn');
  //   for (let i = 0; i < sentBttn.length; i++) {
  //     sentBttn[i].addEventListener('click', function() {
  //       const box = document.getElementById('pSt_' + (this.id.split('sentBttn_')[1]));
  //       if (box.style.display === 'inline') {
  //           box.style.display = 'none';
  //       } else {
  //           box.style.display = 'inline';
  //       }
  //     });
  //   }
  // }

  // buildReplyAccordion() {
  //     // for the accordion ---> BEGINNING
  //     const acc = document.getElementsByClassName('accordion');

  //     for (let i = 0; i < acc.length; i ++) {
  //       acc[i].addEventListener('click', function() {
  //         this.classList.toggle('active');
  //         /* Toggle between hiding and showing the active panel */

  //         // const panel = this.nextElementSibling;
  //         const panel = document.getElementById('replyPanel_' + (this.id.split('replyCount_')[1]));
  //         const up = document.getElementById('iUp_' + (this.id.split('replyCount_')[1]));
  //         const down = document.getElementById('iDown_' + (this.id.split('replyCount_')[1]));
  //         if (panel.style.display === 'block') {
  //             panel.style.display = 'none';
  //             up.style.display = 'none';
  //             down.style.display = 'inline';
  //         } else {
  //             panel.style.display = 'block';
  //             up.style.display = 'inline';
  //             down.style.display = 'none';
  //         }
  //       });
  //     }
  // }
  // onEnter(value) {
  //   this.sizeforTable = value;
  //   this.renderCommentTable();
  // }

  // // sets the tooltip on mouseover
  setTooltipInfo(event: MouseEvent, tooltip: HTMLSpanElement) {
    tooltip.style.position = 'fixed';
    tooltip.style.top = (event.clientY - tooltip.offsetHeight) + 'px';
    tooltip.style.left = (event.clientX - tooltip.offsetWidth - 5) + 'px';
  }

}
