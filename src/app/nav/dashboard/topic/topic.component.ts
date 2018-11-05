import { Component, OnInit } from '@angular/core';
import { CloudData, CloudOptions } from 'angular-tag-cloud-module';

@Component({
  selector: 'app-topic',
  templateUrl: './topic.component.html',
  styleUrls: ['./topic.component.scss']
})
export class TopicComponent implements OnInit {
  options: CloudOptions = { width: 1, height: 300, overflow: true};
  data: CloudData[] = [/*{text: 'Eue', weight: 1},{text: 'Euu', weight: 3},{text: 'Eu', weight: 500}*/];

  constructor() { }

  ngOnInit() {
    // get data 
    this.wordCount();
    this.createWordCloud();
  }

  wordCount(){
    let natural = require('natural');
    let tokenizerPunct = new natural.RegexpTokenizer({pattern: /[^a-zA-Z0-9_#@]/});
    
    // tokenize
    //console.log("B: " + tokenizerPunct.tokenize("your @dog #VENI has fleas. I'm not a two-faced guy!!"));

    // remove stopwords

    // count (word,count,sentiment)
  }

  createWordCloud(){
    // create wordCloud
  }
}

