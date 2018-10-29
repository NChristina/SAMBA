import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import * as crossfilter from 'crossfilter';
import * as dc from 'dc';
import { ChartService } from '../services/chart.service';
import { FormControl } from '@angular/forms';
// import { ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss'],
  // encapsulation: ViewEncapsulation.None
})
export class CommentComponent implements OnInit {
  foodControl = new FormControl();
  whatOrder = 0;




  filter = [
    { value: 'comments asc', description: 'replies desc'},
    { value: 'comments desc', description: 'replies asc'},
    { value: 'likes asc', description: 'likes desc'},
    { value: 'likes desc', description: 'likes asc'},
    { value: 'date asc', description: 'date desc'},
    { value: 'date desc', description: 'date asc' },
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
      //console.log('cfilter:', this.cfilter);
      this.setDimension();
      this.renderCommentTable();
    });
    // subscribing to the data in the chart service
    // this.chartService.GetData().subscribe((data) => { SOLLTEN WIR ABER VERWENDEN FÜR DAS AUTOMATISCHE UPDATE
    //   // this.data = data;
    //   for (let i = 0; i < 10; i ++) {
    //     this.data.push(data[i]);
    //   }
    //   console.log('SO SCHAUT DIE DATA AUUUUUS: ', data);
    // });
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
    //console.log('dimension: ', this.dimension);
    this.commentTable
      .dimension(this.dimension)
      .group(function (d) {
        return d.value;
      })
      .html((d) => {
        let html = '';
        html += '<div class="container" style="box-shadow: rgba(0, 0, 0, 0.3) 7px 7px 7px; padding: 20px 20px 30px 20px;">';
        html += '<div class="row"> <div class="col-sm-8"><div><div class="post-heading">';
        html += '<div class="comment-author">';
        html += '<img src="../../../../assets/user.svg" style ="height: 20px; margin: 0px 5px -5px 0px">';
        html += d.authorDisplayName + ' | ' + this.dateTimeParser(d.publishedAt) + '<b style="float: right; margin-right: 30px;">';
        html +=	d.artist + ' - ' + d.song + '</b></div><p class="comment-text">' + d.text + '</p></div></div>';
        html += '<div class="bottom-comment" style="float: left; margin-left: 15px">';
        html += d.likeCount +' <img src="../../../../assets/002-like.svg" height="13px" "class="iconStyle" style="margin: 0px 5px -1px 5px"> | ';
        html += '<a style="text-decoration: none; cursor: pointer;" class="accordion" id="replyCount_'+ d._key +'">' + d.replyCount + ' ';
        html += '<img src="../../../../assets/001-reply.svg" height="13px" class="iconStyle" style="margin: 0px 5px -1px 5px">';
        html += '</a> | ';
        html += '<a style="text-decoration: none; cursor: pointer;" class="sentBttn" id="sentBttn_'+ d._key +'">'+ this.getSentiment(d.analysis.sentiment,"mean")+'</a> <div class="panelSent" id="panelSent_'+ d._key +'" style="display:none; background-color:#a9a9a9; color:#fff; font-size:0.8em; padding:1px 5px;">NLTK: '+ this.getSentiment(d.analysis.sentiment,"nltk")+' | TextBlob: '+ this.getSentiment(d.analysis.sentiment,"blob")+' | AFINN: '+ this.getSentiment(d.analysis.sentiment,"afinn")+'</div>';
        html += '<div class="panelAc" id="replyPanel_'+ d._key +'" style="display: none;"><p>Lorem Ipsum...</p></div>';
        html +=	'</div></div></div></div>';
        return html;
        /** 
         *
         *
<button class="accordion">Section 1</button>
<div class="panel">
  <p>Lorem ipsum...</p>
</div>

<button class="accordion">Section 2</button>
<div class="panel">
  <p>Lorem ipsum...</p>
</div>

<button class="accordion">Section 3</button>
<div class="panel">
  <p>Lorem ipsum...</p>
</div>
         *
         *
         */
      }) // orders the comments by likes
      // .size(120)
      .order(d3.ascending)
      .order((a, b) => {
        // to decide after what critera the comments should be ordered
        //console.log('I am rendering.');
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
    this.buildReplyAccordion();
    this.buildSentimentBox();
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

  // get sentiment
  private getSentiment (sentiment: any, mode: string) {
    if(sentiment){
      if(mode == "main") return this.printSentiment(sentiment.mainSentiment, true); 
      else if(mode == "nltk") return this.printSentiment(sentiment.nltk.compound, false);
      else if(mode == "afinn") return this.printSentiment(sentiment.afinn.normalized, false);
      else if(mode == "blob") return this.printSentiment(sentiment.textBlob.polarity, false);
      else if(mode == "mean"){
        if(this.isIconsistent([sentiment.nltk.compound,sentiment.textBlob.polarity,sentiment.afinn.normalized])) return 'Inconsistent Sentiment <img src="../../../../assets/009-warning.svg" height="13px" "class="iconStyle" style="margin: 0px 5px -2px 5px">';
        else return this.printSentiment(((sentiment.nltk.compound + sentiment.afinn.normalized + sentiment.textBlob.polarity) / 3), true);
      } 
    } 
    else return 'No Sentiment <img src="../../../../assets/008-NA.svg" height="13px" "class="iconStyle" style="margin: 0px 5px -2px 5px">';
  }

  // get sentiment
  private printSentiment (sentValue: any, icon: boolean) {
    let scoreValue = "";
    let iconValue = "";

    if(sentValue >= 0.5) { scoreValue = "Very Positive"; iconValue = "007-verypos.svg"; } 
    else if(sentValue < 0.5 && sentValue > 0) { scoreValue = "Positive"; iconValue = "006-pos.svg"; }
    else if(sentValue == 0) { scoreValue = "Neutral"; iconValue = "005-neu.svg"; } 
    else if(sentValue < 0 && sentValue > -0.5) { scoreValue = "Negative"; iconValue = "004-neg.svg"; } 
    else if(sentValue <= -0.5) { scoreValue = "Very Negative"; iconValue = "003-veryneg.svg"; } 
    else return "NaN (" + sentValue + ")";

    if(icon) return scoreValue + '<img src="../../../../assets/'+ iconValue +'" height="13px" "class="iconStyle" style="margin: 0px 5px -2px 5px">';
    else return scoreValue;
  }

  private isIconsistent (sentValues: any) {
    let countPos = 0;
    let countNeg = 0;

    sentValues.forEach((value) => { 
      if(value > 0) countPos++;
      else if(value < 0) countNeg++;
    });

    if (countPos > 0 && countNeg > 0) return true;
    else return false;
  }

  // converts the published date into a viewable format (looks better :))
  private dateTimeParser (publishedDate: string) {
    const date = publishedDate.split('T')[0];
    const time = publishedDate.split('T')[1].split('.')[0];
    return date + ' ' + time;
  }

  buildSentimentBox() {
    const sentBttn = document.getElementsByClassName('sentBttn');
    for (let i = 0; i < sentBttn.length; i++) {
      sentBttn[i].addEventListener('click', function() {
        const box = document.getElementById('panelSent_' + (this.id.split('_')[1]));
        if (box.style.display === 'inline') {
            box.style.display = 'none';
        } else {
            box.style.display = 'inline';
        }
      });
    }
  }

  buildReplyAccordion() {
      // for the accordion ---> BEGINNING
      const acc = document.getElementsByClassName('accordion');

      for (let i = 0; i < acc.length; i ++) {
        acc[i].addEventListener('click', function() {
          this.classList.toggle('active');
          /* Toggle between hiding and showing the active panel */

          //const panel = this.nextElementSibling;
          const panel = document.getElementById('replyPanel_' + (this.id.split('_')[1]));
          if (panel.style.display === 'block') {
              panel.style.display = 'none';
          } else {
              panel.style.display = 'block';
          }
        });
      }
  }
}
