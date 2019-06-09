import { Component, OnInit, Input } from '@angular/core';
import * as crossfilter from 'crossfilter';
import * as dc from 'dc';
import { ChartService } from '../services/chart.service';
import { FormControl, FormGroup } from '@angular/forms';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss'],
})
export class CommentComponent implements OnInit {
  @Input() ids: any;
  @Input() totalComments: any;
  dateStart = '';         // default
  dateEnd = '';           // default
  nbComments = 25;        // default
  order = 'repliesDesc';  // default
  mvideoIds: string[];

  prevDateStart = '';         // previous
  prevDateEnd = '';           // previous
  prevNbComments = 25;        // previous
  prevOrder = 'repliesDesc';  // previous
  prevMvideoIds: string[];    // previous

  isLoading = false;
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
  myFormGroup = new FormGroup({
    nbComments: new FormControl()
  });

  constructor(private chartService: ChartService, private dataService: DataService) {}

  ngOnInit() {
    this.chartService.getChartRange().subscribe( data => {
      if (data && data.range && this.mvideoIds && this.mvideoIds.length > 0) {
        this.dateStart = data.range[0].toISOString();
        this.dateEnd = data.range[1].toISOString();

        // one could fetch comments right after filter
        // but if the number of comments is to big
        // that can take a long time to receive an answer from the db
        // this.fetchComments(this.mvideoIds);
      }
    });

    this.chartService.GetData().subscribe((data) => {
      (data) ? this.totalComments = data.length : this.totalComments = 0;
      this.mvideoIds = this.chartService.GetVideoIds();

      if (data && data.length > 0 && this.mvideoIds && this.mvideoIds.length > 0) {
        this.dateStart = '';
        this.dateEnd = '';
        this.fetchComments(this.mvideoIds);
      } else if (data && data.length <= 0) {
        this.receivedComments = [];
        this.nbComments = 25;
      }
    });
  }

  runFetchComments() {
    const newNbComm = this.myFormGroup.get('nbComments').value;
    if (newNbComm && !isNaN(newNbComm)) {
      this.nbComments = newNbComm;
    }

    if (this.mvideoIds && this.mvideoIds.length > 0) {
      this.fetchComments(this.mvideoIds);
    }
  }

  fetchComments(videoIdsArr) {
    if (!this.dateStart) { this.dateStart = ''; }
    if (!this.dateEnd) { this.dateEnd = ''; }

    if (!this.isLoading && this.isNewRequest(this.nbComments, this.order, videoIdsArr, this.dateStart, this.dateEnd)) {
      this.savePreviousValues(this.nbComments, this.order, videoIdsArr, this.dateStart, this.dateEnd);
      this.isLoading = true;
      this.dataService.getComments(this.nbComments, this.order, videoIdsArr, this.dateStart, this.dateEnd).then((results) => {
        this.receivedComments = results.body[0].comments;
        this.isLoading = false;
      });
    }
  }

  isNewRequest(nbComments: number, order: string, ids: string[], startDate: any, endDate: any) {
    if (this.prevDateStart !== startDate ||
        this.prevDateEnd !== endDate ||
        this.prevNbComments !== nbComments ||
        this.prevOrder !== order ||
        this.prevMvideoIds !== ids) {
          return true;
        } else {
          return false;
        }
  }

  savePreviousValues(nbComments: number, order: string, ids: string[], startDate: any, endDate: any) {
    this.prevDateStart = startDate;
    this.prevDateEnd = endDate;
    this.prevNbComments = nbComments;
    this.prevOrder = order;
    this.prevMvideoIds = ids;
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

  // // sets the tooltip on mouseover
  setTooltipInfoSent(event: MouseEvent, tooltip: HTMLSpanElement) {
    tooltip.style.position = 'fixed';
    tooltip.style.top = (event.clientY + 10) + 'px';
    tooltip.style.left = (event.clientX - (tooltip.offsetWidth / 2)) + 'px';
  }

  textareaEnterPressed($event: KeyboardEvent): boolean {
    $event.preventDefault();
    $event.stopPropagation();
    this.runFetchComments();
    return true;
  }
}
