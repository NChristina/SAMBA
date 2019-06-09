import { Component, ViewChild , OnInit, ElementRef } from '@angular/core';
import { CloudData, CloudOptions, TagCloudComponent } from 'angular-tag-cloud-module';
import { ChartService } from '../services/chart.service';
import * as sw from 'stopword';

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
  data: any;
  totalComments = 0;
  isLoading = false;


  constructor(private chartService: ChartService, private _element: ElementRef) { }

  ngOnInit() {

    this.chartService.GetData().subscribe((data) => {
      this.data = data;
      if (this.data && this.data.length > 0) { this.isLoading = true; }
    });

    this.chartService.GetDataTopics().subscribe((data) => {
      if (this.data && this.data.length <= 0) { data = this.data; }
      this.totalComments = Math.round((data.commentsUsed * 100) / data.commentsAll);
      this.dataCloud = data.dataCloud;
      this.listSongs = data.listSongs;
      this.wordCounted = data.wordCounted;
      if (this.listSongs) {
        this.createLists();
        this.isLoading = false;
      }
    });

    this.chartService.getCrossfilter().subscribe((filter) => {
      this.cfilter = filter;
    });

    this.setVisibilityofViews();
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
          const topic = document.createTextNode('- ' + this.wordCounted[j].text);
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
    if (this.tagCloudComponent) { this.tagCloudComponent.reDraw(); }
  }

  private getColor(sent: number) {
    if (sent > 0) { return '#4daf4a'; } else if (sent < 0) { return '#ff7f00'; }
    return '#cccccc';
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

