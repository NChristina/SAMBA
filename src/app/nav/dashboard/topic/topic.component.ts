import { Component, ViewChild , OnInit, ElementRef } from '@angular/core';
import { CloudData, CloudOptions, TagCloudComponent } from 'angular-tag-cloud-module';
import { ChartService } from '../services/chart.service';

@Component({
  selector: 'app-topic',
  templateUrl: './topic.component.html',
  styleUrls: ['./topic.component.scss']
})
export class TopicComponent implements OnInit {
  @ViewChild(TagCloudComponent) tagCloudComponent: TagCloudComponent;
  options: CloudOptions = { width: 1, height: 250, overflow: true };
  dataCloud: CloudData[] = [];
  cfilter: CrossFilter.CrossFilter<{}>;
  dataChange = 0;
  data: any[];

  constructor(private chartService: ChartService, private _element: ElementRef) { }

  ngOnInit() {
    this.chartService.GetData().subscribe((data) => {
      this.data = data;
    });

    this.chartService.getCrossfilter().subscribe((filter) => {
      this.cfilter = filter;
      if (this.data.length !== this.dataChange) {
        this.dataChange = this.data.length;
        this.createWordCloud();
      }
    });
  }

  createWordCloud() {
    // Tokenize it
    const natural = require('natural');
    const sw = require('stopword');
    const tokenizerPunct = new natural.RegexpTokenizer({pattern: /[^a-zA-Z0-9_#@]|\b\w\b ?/});
    const words = [];

    this.data.forEach((d) => {
      if (d.analysis.mainLanguage === 'en') {
        const topicSent = this.getSentiment(d);
        let word_tokens = tokenizerPunct.tokenize(d.text);
        word_tokens = sw.removeStopwords(word_tokens);
        word_tokens.forEach((word) => {
          words.push({ topic: word, sentiment: topicSent }); // canAdd song: d.song
        });
      }
    });

    this.counter(words);
  }

  private counter(words: any) {
    const cWds = [];

    words.forEach((w) => {
      let inList = false;
      let countedWordidx = 0;
      cWds.forEach((cw) => {
        if (inList === false) {
          if (cw.text.trim().toLowerCase() === w.topic.trim().toLowerCase()) { inList = true; } else { countedWordidx++; }
        }
      });

      if (inList) {
        cWds[countedWordidx].count++;
        cWds[countedWordidx].sentiment += w.sentiment;
      } else {
        cWds.push({ text: w.topic.toString(), count: 1, sentiment: w.sentiment });
      }
    });

    const dataForCloud = [];
    if (cWds.length > 0) {
      cWds.sort(function(a, b) { return b.count - a.count; });

      let size = 8;
      let i = 0;
      while (i < 10) {
        const sentcolor = this.getColor(cWds[i].sentiment / cWds[i].count);
        dataForCloud.push({ text: cWds[i].text.toString(), weight: size, color: sentcolor.toString() });
        i++;
        size -= (size / 10);
      }
    }

    this.dataCloud = dataForCloud;
  }

  reDraw() {
    this.tagCloudComponent.reDraw();
  }

  private getColor(sent: number) {
    if (sent > 0) { return '#4daf4a'; } else if (sent < 0) { return '#ff7f00'; }
    return '#cccccc';
  }

  private getSentiment(d: any) {
    if (d.analysis.sentiment) {
      const thisnltk = d.analysis.sentiment.nltk.compound;
      const thisblob = d.analysis.sentiment.textBlob.polarity;
      const thisafinn = d.analysis.sentiment.afinn.normalized;

      if (this.isIconsistent([thisnltk, thisblob, thisafinn])) {
        return 0;
      } else {
        const sentPolarity = ((thisnltk + thisafinn + thisblob) / 3);
        if (sentPolarity > 0) {
          return 1;
        } else if (sentPolarity === 0) {
          return 0;
        } else if (sentPolarity < 0) {
          return -1;
        }
      }
    } else { return 0; }
  }

  private isIconsistent (sentValues: any) {
    let countPos = 0;
    let countNeg = 0;

    sentValues.forEach((value) => {
      if (value > 0) { countPos++; } else if (value < 0) { countNeg++; }
    });

    if (countPos > 0 && countNeg > 0) { return true; } else { return false; }
  }
}

