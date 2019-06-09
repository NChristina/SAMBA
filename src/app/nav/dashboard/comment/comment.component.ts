import { Component, OnInit, Input, OnChanges, SimpleChanges, SimpleChange } from '@angular/core';
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
export class CommentComponent implements OnInit, OnChanges {
  @Input() ids: any;
  @Input() totalComments: any;
  dateStart: any;
  dateEnd: any;
  doNotUseDefaultOnDate = false;
  nbComments = 25;        // default
  order = 'repliesDesc';  // default
  mvideoIds: string[];
  displaySent = '';
  displayReplies = '';
  receivedComments: any;
  filter = [
    { value: 'replies desc', description: 'repliesDesc'},
    { value: 'replies asc', description: 'repliesAsc'},
    { value: 'likes desc', description: 'likesDesc'},
    { value: 'likes asc', description: 'likesAsc'},
    { value: 'date desc', description: 'dateDesc'},
    { value: 'date asc', description: 'dateAsc' },
  ];
  foodControl = new FormControl();

  constructor(private chartService: ChartService, private dataService: DataService) {}

  ngOnInit() {
    this.chartService.getChartRange().subscribe( data => {
      // this.fetchComments(this.ids);
      if (data.range !== undefined) {
        this.dateStart = data.range[0];
        this.dateEnd = data.range[1];
        // console.log('we have the filtered range: ', this.dateStart, ' to ', this.dateEnd);
      }

    });

    this.chartService.GetData().subscribe((data) => {
      if (data) {
        this.totalComments = data.length;
      } else {
        this.totalComments = 0;
      }

      this.mvideoIds = this.chartService.GetVideoIds();

      if (data.length > 0 && this.mvideoIds && this.mvideoIds.length > 0) {
        this.fetchComments(this.mvideoIds);
      } else if (data.length <= 0) {
        this.receivedComments = [];
      }

      if (data[0] !== undefined) {
        this.dateStart = new Date(data[0].publishedAt);
        this.dateEnd = new Date(data[data.length - 1].publishedAt);
        // console.log('first date: ', this.dateStart);
        // console.log('last date: ', this.dateEnd);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
   /* const name: SimpleChange = changes.name;
    console.log('prev value: ', name.previousValue);
    console.log('got name: ', name.currentValue);*/
   /*for (const propName in changes) {
     if (propName === 'ids') {
      // console.log('YYYYYYYYYYYYYYYYYYYYYYYYY: ', propName);
      // this.fetchComments(this.ids);
     }
   }*/
  }

  runFetchComments() {
    if (this.mvideoIds && this.mvideoIds.length > 0) {
      this.fetchComments(this.mvideoIds);
    }
  }

  fetchComments(videoIdsArr) {
    console.log(this.dateStart);
    console.log(this.dateEnd);
    this.dateStart = '';
    this.dateEnd = '';

    this.dataService.getComments(this.nbComments, this.order, videoIdsArr, this.dateStart, this.dateEnd).then((results) => {
      this.receivedComments = results.body[0].comments;
    });
  }

  onSelectionChange(event: { index: any, value: any }) {
    switch (event.value) {
      case 'replies desc':
      this.order = this.filter[0].description;
      break;
      case 'replies asc':
      this.order = this.filter[1].description;
      break;
      case 'likes desc':
      this.order = this.filter[2].description;
      break;
      case 'likes asc':
      this.order = this.filter[3].description;
      break;
      case 'date desc':
      this.order = this.filter[4].description;
      break;
      case 'date asc':
      this.order = this.filter[5].description;
      break;
    }
  }

  displaySentimentDetails(id: string) {
    if (this.displaySent === id) {
      this.displaySent = '';
    } else {
      this.displaySent = id;
    }
  }

  displayReplyDetails(id: string) {
    if (this.displayReplies === id) {
      this.displayReplies = '';
    } else {
      this.displayReplies = id;
    }
  }

  // // get sentiment
  private getSentiment (sentiment: any, mode: string) {
    if (sentiment) {
      if (mode === 'main') {
        return this.printSentiment(sentiment.mainSentiment, true);
      } else if (mode === 'nltk') {
        return this.printSentiment(sentiment.nltk.compound, false);
      } else if (mode === 'afinn') {
        return this.printSentiment(sentiment.afinn.normalized, false);
      } else if (mode === 'blob') {
        return this.printSentiment(sentiment.textBlob.polarity, false);
      } else if (mode === 'mean') {
        if (this.isIconsistent([sentiment.nltk.compound, sentiment.textBlob.polarity, sentiment.afinn.normalized])) {
          return {sent: 'Mixed', icon: '009-warning.svg', color: '984ea3'};
        } else {
          return this.printSentiment(((sentiment.nltk.compound + sentiment.afinn.normalized + sentiment.textBlob.polarity) / 3), true);
        }
      }
    } else {
      return {sent: 'No Sentiment ', icon: '008-NA.svg', color: '999999'};
    }
  }

  // get sentiment
  private printSentiment (sentValue: any, icon: boolean) {
    let scoreValue = '';
    let iconValue = '';
    let iconColor = '999999';

    if (sentValue >= 0.5) {
      scoreValue = 'Very Positive'; iconValue = '007-verypos.svg'; iconColor = '4daf4a';
    } else if (sentValue < 0.5 && sentValue > 0) {
      scoreValue = 'Positive'; iconValue = '006-pos.svg'; iconColor = '4daf4a';
    } else if (sentValue === 0) {
      scoreValue = 'Neutral'; iconValue = '005-neu.svg'; iconColor = '666666';
    } else if (sentValue < 0 && sentValue > -0.5) {
      scoreValue = 'Negative'; iconValue = '004-neg.svg'; iconColor = 'ff7f00';
    } else if (sentValue <= -0.5) {
      scoreValue = 'Very Negative'; iconValue = '003-veryneg.svg'; iconColor = 'ff7f00';
    } else {
      return 'NaN (' + sentValue + ')';
    }

    if (icon) {
      return {sent: scoreValue, icon: iconValue, color: iconColor};
    } else {
      return {sent: scoreValue, icon: '', color: ''};
    }
  }

  private isIconsistent (sentValues: any) {
    let countPos = 0;
    let countNeg = 0;

    sentValues.forEach((value) => {
      if (value > 0) {
        countPos++;
      } else if (value < 0) {
        countNeg++;
      }
    });

    if (countPos > 0 && countNeg > 0) {
      return true;
    } else {
      return false;
    }
  }

  // converts the published date into a viewable format (looks better :))
  private dateTimeParser (publishedDate: string) {
    // console.log('yyyy: ', publishedDate);
    const date = publishedDate.split('T')[0];
    const time = publishedDate.split('T')[1].split('.')[0];
    return date + ' ' + time;
    // return publishedDate;
  }

  // // sets the tooltip on mouseover
  setTooltipInfo(event: MouseEvent, tooltip: HTMLSpanElement) {
    tooltip.style.position = 'fixed';
    tooltip.style.top = (event.clientY - tooltip.offsetHeight) + 'px';
    tooltip.style.left = (event.clientX - tooltip.offsetWidth - 5) + 'px';
  }
}
