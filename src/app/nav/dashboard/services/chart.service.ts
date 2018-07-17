import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import * as crossfilter from 'crossfilter';
import { Observable, BehaviorSubject } from '../../../../../node_modules/rxjs';

@Injectable()
export class ChartService {
  private chartDataSource = new BehaviorSubject([]);
  private currentChartData = this.chartDataSource.asObservable();
  private cfilterSource = new BehaviorSubject(crossfilter([]));
  private currentCfilter = this.cfilterSource.asObservable();
  private cfilter: CrossFilter.CrossFilter<{}>;

  constructor() {
    this.GetData().subscribe((data) => {
      this.changeCrossfilter(crossfilter(data));
    });
  }

  SetData(value: any[]) {
    const newData = this.dataStructure(value);
    this.chartDataSource.next(newData);
    this.changeCrossfilter(crossfilter(newData));
  }
  GetData(): Observable<any[]> {
    return this.currentChartData;
  }

  changeCrossfilter(filter: CrossFilter.CrossFilter<{}>) {
    this.cfilterSource.next(filter);
  }

  getCrossfilter(): Observable<CrossFilter.CrossFilter<{}>> {
    return this.currentCfilter;
  }

  private dataStructure(data): any[] {
    const comments = [];
    data.forEach(song => {
      song.comment.forEach(comment => {
        comments.push({
          _key: comment._key,
          authorDisplayName: comment.snippet.topLevelComment.snippet.authorDisplayName,
          likeCount: comment.snippet.topLevelComment.snippet.likeCount,
          publishedAt: comment.snippet.topLevelComment.snippet.publishedAt,
          text: comment.snippet.topLevelComment.snippet.textOriginal,
          song: song.song.title,
          song_key: song.song._key,
          song_id: song.song._id,
          artist: song.artist[0].name,
          analysis: comment.analysis
        });
      });
    });
    comments.sort((a, b) => {
      return new Date(a.publishedAt) > new Date(b.publishedAt) ? -1 : 1;
    });
    return comments;
  }
}
