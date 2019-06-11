import { Injectable } from '@angular/core';
import * as crossfilter from 'crossfilter';
import { BehaviorSubject, Observable } from 'rxjs';

// The Chart Service allows to use one data for all the charts
@Injectable()
export class ChartService {
  // The BehavioSubject allows us to inform all the subscribers, when data changed
  // we need two of them, one for crossfilter and one for the data
  private chartDataSource = new BehaviorSubject([]);
  private currentChartData = this.chartDataSource.asObservable();
  private cfilterSource = new BehaviorSubject(crossfilter([]));
  private currentCfilter = this.cfilterSource.asObservable();

  private chartTopicsSource = new BehaviorSubject([]);
  private currentChartTopics = this.chartTopicsSource.asObservable();

  private chartRangeSource = new BehaviorSubject([]);
  private currentChartRange = this.chartRangeSource.asObservable();
  private loggedIn = false;
  private spinner = false;
  private dataForReset: any;
  private videoIds = [];
  private topicsRequested = false;

  constructor() {
    this.GetData().subscribe((data) => {
      this.changeCrossfilter(crossfilter(data));
    });
  }

  loginProtection() {
    this.loggedIn = true;
  }

  public getSpinner(): boolean {
    return this.spinner;
  }

  public setSpinner(value) {
    if (value) {
      this.SetTopicsRequested();
    }
    this.spinner = value;
  }

  getLoggedIn(): boolean {
    return this.loggedIn;
  }

  // get and set of the data, the observable broadcasts the changed data to all its subscribers
  // the function sets also the crossfilter
  SetData(value: any[], additionalInfo: any[]) {
    this.spinner = true;
    const newData = this.miniDataStructure(value, additionalInfo);
    this.dataForReset = newData;
    if (!newData || newData.length <= 0) { const topicData = {}; this.SetDataTopics(topicData); }
    this.chartDataSource.next(newData);
    this.changeCrossfilter(crossfilter(newData));
    this.spinner = false;
  }

  GetVideoIds(): any {
    return this.videoIds;
  }

  GetData(): Observable<any[]> {
    return this.currentChartData;
  }

  SetDataTopics(topicData: any) {
    this.chartTopicsSource.next(topicData);
    this.ResetTopicsRequested();
  }

  GetDataTopics(): Observable<any> {
    return this.currentChartTopics;
  }

  GetTopicsRequested() {
    return this.topicsRequested;
  }

  SetTopicsRequested() {
    this.topicsRequested = true;
  }

  ResetTopicsRequested() {
    this.topicsRequested = false;
  }

  reloadForResetFilters() {
    this.chartDataSource.next(this.dataForReset);
    this.changeCrossfilter(crossfilter(this.dataForReset));
  }

  // informs all crossfilter subscribers that the crossfilter variable has changed
  changeCrossfilter(filter: CrossFilter.CrossFilter<{}>) {
    this.cfilterSource.next(filter);
  }

  // function, which is used to subscribe to the crossfilter
  getCrossfilter(): Observable<CrossFilter.CrossFilter<{}>> {
    return this.currentCfilter;
  }

  // is used to tell an subscriber if the size of view has changed
  getChartRange(): Observable<any> {
    return this.currentChartRange;
  }

  setChartRange(range) {
    this.chartRangeSource.next(range);
  }

  // for loop for the new data structure
  private miniDataStructure(data, additionalInfo): any[] {
    let isGroup = true;
    const dataPoints = [];
    let totalViews: number;
    let totalLikes: number;
    let totalDislikes: number;

    let artist = '';
    let title = '';
    let songID = '';
    let songKey = '';


    this.videoIds = [];
    data.forEach((song, index) => {

      totalViews = 0;
      totalLikes = 0;
      totalDislikes = 0;

      let control = 0;
      // unterscheidung zw 1 version oder 1. gruppe für additionalInfo!!!
      if ('etag' in additionalInfo[index]) {
        // console.log('I AM ONLY ONE VERSION');

        //bauuuustellleee höhöhöhö
        isGroup = false;
        const words = additionalInfo[index].snippet.title.split('-');
        // console.log('words[0]: ', words[0]);
        // console.log('words[1]: ', words[1]);
        // console.log('words[2]: ', words[2]);
        artist = words[0];
        title = words[1];

        if (words[1] === undefined) {
          // console.log('HEYYYYYY title is empty');
          // console.log('artist: ', additionalInfo[index]);
          artist =  additionalInfo[index].artist;
          title = words[0];
        }

        if (words[2] !== undefined) {
          title = title + ' ' + words[2];
        }

        songID = additionalInfo[index].id;
        songKey = additionalInfo[index]._key;

        totalViews = additionalInfo[index].statistics.viewCount;
        totalLikes =  additionalInfo[index].statistics.likeCount;
        totalDislikes =  additionalInfo[index].statistics.dislikeCount;
      } else {
        // console.log('a group was added');

        isGroup = true;
        artist = additionalInfo[index].artist;
        title = additionalInfo[index].title;
        songID = additionalInfo[index].versions[0].id;
        songKey = additionalInfo[index].versions[0]._key;

        // building together total views, dislikes and likes of 1-? versions, whatever is given in addtionalInfo variable
        additionalInfo[index].versions.forEach ((version) => {
          if (version.statistics.viewCount !== undefined ) { totalViews = (+totalViews) + (+version.statistics.viewCount); }
          if (version.statistics.likeCount !== undefined ) { totalLikes = (+totalLikes) + (+version.statistics.likeCount); }
          if (version.statistics.dislikeCount !== undefined ) { totalDislikes = (+totalDislikes) + (+version.statistics.dislikeCount); }
        });
      }

      let tmp_song = song;
      isGroup ? tmp_song = tmp_song : tmp_song = song[0];

      if (tmp_song) {
        const newVideoIds = this.videoIds.concat(tmp_song.videoIds);
        this.videoIds = newVideoIds;
      }

      tmp_song.aggregations.forEach( date => {
        const mSentiment = this.fixSentimentData(date.sentimentDistribution[0]);

        let lidx = 0;
        let sentx = 0;
        let currentNbCommentsLanguage = date.languageDistribution[lidx].nbComments;
        let currentNbCommentsSent = mSentiment[sentx].nbComments;
        let currentNbLikedComments = date.likedComments;

        for (let i = 0; i < date.nbComments; i ++) {
          let mlikeCount = 0;
          if (currentNbLikedComments > 0) {
            mlikeCount = 1;
            currentNbLikedComments -= 1;
          }

          const analysisObject = {
            languageProbability: 1,
            mainLanguage: date.languageDistribution[lidx].language,
            mainSentiment: mSentiment[sentx].sentiment
          };

          currentNbCommentsLanguage -= 1;
          currentNbCommentsSent -= 1;
          if (currentNbCommentsLanguage === 0) { lidx += 1; }
          if (currentNbCommentsSent === 0) { sentx += 1; }

          let songShort = '';
          if (title !== undefined) {
              (title.length > 15) ? songShort = title.substr(0, 12) + '...' : songShort = title;
          }

          dataPoints.push({
            _key: control,              // where the comment key was
            authorDisplayName: null,    // author display name of comment
            likeCount: mlikeCount,      // like count of comment
            replyCount: 0,              // reply count of comment
            publishedAt: date.publishedAt,
            text: null,                 // text of the comment
            song: songShort,            // *** song title of the commented song (max 15 char)
            songFull: title,            // *** song title of the commented song (original)
            song_key: songID,           // key of the commented song
            song_id: songKey,           // id of song of commented
            artist: artist,             // *** artist of the song which was commented
            analysis: analysisObject,
            video_key: song.videoId,
            videoLikes: totalLikes,     // *** likes of the video commented
            videoDislikes: totalDislikes, // *** dislikes of the video commented
            videoViews: totalViews,     // *** views of the video commented
            replies: null               // *** replies of the comment
          });

          control++;
        }
      });
    });

    // the comments have to be sorted for the charts
    dataPoints.sort((a, b) => {
      return new Date(a.publishedAt) > new Date(b.publishedAt) ? -1 : 1;
    });

    return dataPoints;
  }

  fixSentimentData(data: any) {
    const mSentiment = [];
    if (data.positive !== 0) { mSentiment.push({sentiment: 'positive', nbComments: data.positive}); }
    if (data.neutral !== 0) { mSentiment.push({sentiment: 'neutral', nbComments: data.neutral}); }
    if (data.negative !== 0) { mSentiment.push({sentiment: 'negative', nbComments: data.negative}); }
    if (data.mixed !== 0) { mSentiment.push({sentiment: 'mixed', nbComments: data.mixed}); }
    if (data.NAs !== 0) { mSentiment.push({sentiment: 'na', nbComments: data.NAs }); }

    return mSentiment;
  }
}
