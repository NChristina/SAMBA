import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import * as crossfilter from 'crossfilter';
import { Observable, BehaviorSubject } from '../../../../../node_modules/rxjs';

// The Chart Service allows to use one data for all the charts
@Injectable()
export class ChartService {
  // The BehavioSubject allows us to inform all the subscribers, when data changed
  // we need two of them, one for crossfilter and one for the data
  private chartDataSource = new BehaviorSubject([]);
  private currentChartData = this.chartDataSource.asObservable();
  private cfilterSource = new BehaviorSubject(crossfilter([]));
  private currentCfilter = this.cfilterSource.asObservable();

  private chartRangeSource = new BehaviorSubject([]);
  private currentChartRange = this.chartRangeSource.asObservable();

  constructor() {
    this.GetData().subscribe((data) => {
      this.changeCrossfilter(crossfilter(data));
    });
  }

  // get and set of the data, the observable broadcasts the changed data to all its subscribers
  // the function sets also the crossfilter
  SetData(value: any[]) {
    const newData = this.dataStructure(value);
    this.chartDataSource.next(newData);
    this.changeCrossfilter(crossfilter(newData));
  }
  GetData(): Observable<any[]> {
    return this.currentChartData;
  }

  // informs all crossfilter subscribers that the crossfilter variable has changed
  changeCrossfilter(filter: CrossFilter.CrossFilter<{}>) {
    this.cfilterSource.next(filter);
  }

  resetCrossfilter() {
    // this.cfilterSource.next(null);
    // Need to apply filter to all first
    //  dc.filterAll();
    //  // Then call remove
    //  crossFilter.remove();
  }

  // function, which is used to subscribe to the crossfilter
  getCrossfilter(): Observable<CrossFilter.CrossFilter<{}>> {
    return this.currentCfilter;
  }

  // the comments are bundled for the charts
  // the function returns a new data structure, so its easier to
  // work with crossfilter and display it as visualization
  // if something is missing just add it
  private dataStructure(data): any[] {
    const comments = [];
    data.forEach(song => {
      song.comment.forEach(comment => {
        comments.push({
          _key: comment._key,
          authorDisplayName: comment.snippet.topLevelComment.snippet.authorDisplayName,
          likeCount: comment.snippet.topLevelComment.snippet.likeCount,
          replyCount: comment.snippet.totalReplyCount,
          publishedAt: comment.snippet.topLevelComment.snippet.publishedAt,
          text: comment.snippet.topLevelComment.snippet.textOriginal,
          song: song.song.title,
          song_key: song.song._key,
          song_id: song.song._id,
          artist: song.artist[0].name,
          analysis: comment.analysis,
          videoLikes: song.data[0].statistics.likeCount,
          videoDislikes: song.data[0].statistics.dislikeCount,
          videoViews: song.data[0].statistics.viewCount
        });
      });
    });
    // the comments have to be sorted for the charts
    comments.sort((a, b) => {
      return new Date(a.publishedAt) > new Date(b.publishedAt) ? -1 : 1;
    });
    return comments;
  }

  // is used to tell an subscriber if the size of view has changed
  getChartRange(): Observable<any> {
    return this.currentChartRange;
  }

  setChartRange(range) {
    this.chartRangeSource.next(range);
  }
}
