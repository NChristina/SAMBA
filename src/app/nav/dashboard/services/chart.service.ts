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
    //console.log('Data changed');
    //console.log(newData);
    console.log('New Data Structur: ', newData);
    this.changeCrossfilter(crossfilter(newData));
  }
  GetData(): Observable<any[]> {
    return this.currentChartData;
  }

  changeCrossfilter(filter: CrossFilter.CrossFilter<{}>) {
    this.cfilterSource.next(filter);
    //console.log('Crossfilter changed');
  }

  getCrossfilter(): Observable<CrossFilter.CrossFilter<{}>> {
    return this.currentCfilter;
  }

  private nest(data) {
    console.log(d3.nest()
      .key(function (d: any) {
        return d.song.title;
      })
      .rollup((v: any) => {
        return {
          all: v[0],
          artist: v[0].artist[0].name,
          comments: v[0].comment,
          data: {
            channel: v[0].data[0].channelTitle,
            publishedAt: v[0].data[0].publishedAt,
            // commentCount: v[0].data.statistics.commentCount,
            // dislikeCount: v[0].data.statistics.dislikeCount,
            // likeCount: v[0].data.statistics.likeCount,
            // viewCount: v[0].data.statistics.viewCount
          }
        } as any;
      })
      .entries(data)
  );
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
          artist: song.artist[0].name,
          analysis: comment.analysis
        });
      });
    });
    // const nest = d3.nest()
    //   .key(function (d: any) {
    //     return d.song;
    //   })
    //   .entries(comments);
    // return nest;
    comments.sort((a, b) => {
      return new Date(a.publishedAt) > new Date(b.publishedAt) ? -1: 1;
    });
    return comments;
  }
}
