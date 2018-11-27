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
  aggrView = true;
  compView = false;
  options: CloudOptions = { width: 1, height: 250, overflow: true };
  dataCloud: CloudData[] = [];
  cfilter: CrossFilter.CrossFilter<{}>;
  listSongs = [];
  wordCounted = [];
  data: any[];
  NLTKstopwords = ['i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you',
    're', 've', 'll', 'd', 'your', 'yours', 'yourself', 'yourselves',
    'he', 'him', 'his', 'himself', 'she', 's', 'her', 'hers', 'herself', 'it',
    'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what',
    'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is',
    'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do',
    'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until',
    'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through',
    'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on',
    'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where',
    'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
    'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will',
    'just', 'don',  'should',  'now', 'd', 'll', 'm', 'o', 're', 've', 'y',
    'ain', 'aren',  'couldn', 'didn', 'doesn', 'hadn', 'hasn',  'haven', 'isn', 'ma', 'mightn',
    'mustn', 'needn', 't', 'shan', 'shouldn', 'wasn', 'weren', 'won', 'wouldn'];

  constructor(private chartService: ChartService, private _element: ElementRef) { }

  ngOnInit() {
    this.chartService.GetData().subscribe((data) => {
      this.data = data;
    });

    this.chartService.getCrossfilter().subscribe((filter) => {
      this.cfilter = filter;
      this.listSongs = [];
      this.wordCounted = [];

      this.createWordCloud();
      this.createLists();
    });

    this.setVisibilityofViews();
  }

  // Tokenize, clean, and count
  createWordCloud() {
    const sw = require('stopword');
    const words = [];

    // Tokenize and clean each [english] comment
    this.data.forEach((d) => {
      if (d.analysis && d.analysis.mainLanguage === 'en') {
        const topicSent = this.getSentiment(d);
        let word_tokens = d.text.split(/[^a-zA-Z0-9_#@]|\b\w\b ?/);
        while (word_tokens.indexOf('') !== -1) { word_tokens.splice( word_tokens.indexOf(''), 1); }

        word_tokens = sw.removeStopwords(word_tokens, this.NLTKstopwords);
        word_tokens.forEach((word) => {
          words.push({ topic: word, sentiment: topicSent, song: d.song });
        });

        if (this.listSongs.indexOf(d.song.toString()) === -1) {
          this.listSongs.push(d.song.toString());
        }
      }
    });

    // Count words
    this.counter(words);
  }

  // Receive a list with words and the sentiment and song name from the comment the wors came from
  private counter(words: any) {
    const cWds = [];

    words.forEach((w) => {
      let inList = false;
      let idxcw = 0;
      // searches the position of the element if it is in the list
      cWds.forEach((cw) => {
        if (inList === false) {
          if (cw.text.trim().toLowerCase() === w.topic.trim().toLowerCase()) { inList = true; } else { idxcw++; }
        }
      });

      if (inList) {
        cWds[idxcw].count++;
        cWds[idxcw].sentiment += w.sentiment;
        if (cWds[idxcw].songs.indexOf(w.song.toString()) === -1) {
          cWds[idxcw].songs.push(w.song.toString());
        }
      } else {
        cWds.push({ text: w.topic.toString(), count: 1, sentiment: w.sentiment, songs: [w.song.toString()] });
      }
    });

    const dataForCloud = [];
    if (cWds.length > 0) {
      cWds.sort(function(a, b) { return b.count - a.count; });
      this.wordCounted = cWds;

      // Get 10 topics. If the list of counted words has less then 10 words we display only the existing topics
      let size = 10;
      let maxTopics = 10;
      if (cWds.length < 10) { size = cWds.length; maxTopics = cWds.length; }
      let i = 0;
      while (i < maxTopics) {
        const sentcolor = this.getColor(cWds[i].sentiment / cWds[i].count);
        dataForCloud.push({ text: cWds[i].text.toString(), weight: size, color: sentcolor.toString()}); // tooltip: cWds[i].songs.join(', ')
        i++;
        size -= 1;
      }
    }

    this.dataCloud = dataForCloud;
  }

  // Topics by song
  createLists() {
    // Clean div to append new list
    const list = document.getElementById('topicList');
    while (list.hasChildNodes()) { list.removeChild(list.firstChild); }
    const size = 95 / this.listSongs.length;

    // Look in the most frequent words, five topics by artist
    this.listSongs.forEach((song) => {
      const div = document.createElement('div');
      const b = document.createElement('b');
      let title = document.createTextNode(song);
      if (song.length > 20) {
        title = document.createTextNode(song.substring(0, 15) + '...');
      }

      b.appendChild(title);
      div.appendChild(b);
      div.style.cssFloat = 'left';
      div.style.width = size + '%';
      div.style.borderRight = '1px solid #eeeeee';
      div.style.wordWrap = 'break-word';
      div.style.textAlign = 'center';

      let i = 0;
      let j = 0;
      while (i < 10 && j < this.wordCounted.length) {
        if (this.wordCounted[j].songs.indexOf(song) !== -1) {
          const p = document.createElement('p');
          const topic = document.createTextNode('- ' + this.wordCounted[j].text.toString());
          p.appendChild(topic);
          const sentcolor = this.getColor(this.wordCounted[j].sentiment / this.wordCounted[j].count);
          p.style.color = sentcolor;
          p.style.marginBottom = '-10px';
          div.appendChild(p);
          i++;
        }
        j++;
      }

      // Add the lists to the comparison view
      document.getElementById('topicList').appendChild(div);
    });
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
      document.getElementsByClassName('topicAggr')[0].classList.toggle('active');
      document.getElementsByClassName('topicComp')[0].classList.toggle('active');
    } else if (button === 'compButton' && !this.compView) {
      this.aggrView = false;
      this.compView = true;
      document.getElementsByClassName('topicAggr')[0].classList.toggle('active');
      document.getElementsByClassName('topicComp')[0].classList.toggle('active');
    }
    this.setVisibilityofViews();
  }

  setVisibilityofViews() {
    if (this.aggrView) {
      document.getElementById('topiccloudTag').classList.remove('hide');
      document.getElementById('topicList').classList.add('hide');
    } else if (this.compView) {
      document.getElementById('topiccloudTag').classList.add('hide');
      document.getElementById('topicList').classList.remove('hide');
    }
    this.reDraw();
  }
}

