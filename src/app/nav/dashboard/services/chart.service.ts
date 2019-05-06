import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import * as crossfilter from 'crossfilter';
import { Observable, BehaviorSubject, ReplaySubject } from '../../../../../node_modules/rxjs';
import { keyframes } from '@angular/animations';

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
      // console.log('this is the actual data from crossfilter: ', data);
    });
  }

  // get and set of the data, the observable broadcasts the changed data to all its subscribers
  // the function sets also the crossfilter
  SetData(value: any[], additionalInfo: any[]) {
    const newData = this.miniDataStructure(value, additionalInfo);
    // const newData = this.dataStructureNew(value, additionalInfo);
    this.chartDataSource.next(newData);
    this.changeCrossfilter(crossfilter(newData));

  }
  // setMockData(value: any[], additionalInfo: any[]) {
  //   console.log('entered setMockData() in chart.service with additionalInfo: ', additionalInfo);
  //   const newData = this.miniDataStructure(value, additionalInfo);
  //   console.log('why tho?: ', newData);
  //   this.chartDataSource.next(newData);
  //   this.changeCrossfilter(crossfilter(newData));
  // }

  GetData(): Observable<any[]> {
    console.log('am I even triggered? : ', this.currentChartData);
    return this.currentChartData;
  }

  // informs all crossfilter subscribers that the crossfilter variable has changed
  changeCrossfilter(filter: CrossFilter.CrossFilter<{}>) {
    this.cfilterSource.next(filter);
  }



  // function, which is used to subscribe to the crossfilter
  getCrossfilter(): Observable<CrossFilter.CrossFilter<{}>> {
    return this.currentCfilter;
  }

  // the comments are bundled for the charts
  // the function returns a new data structure, so its easier to
  // work with crossfilter and display it as visualization
  // if something is missing just add it
  // private dataStructure(data): any[] {
  //   console.log('XXXXXXX: ', data);
  //   const comments = [];
  //   let repliesArray = [];
  //   console.log('data in chartservice, where is replies?', data[0]);
  //   data[0].forEach(song => {
  //     song.comment.forEach(comment => {
  //       repliesArray = [];
  //       song.reply.forEach(reply => {
  //         if (reply.snippet.parentId === comment._key) {
  //           repliesArray.push(reply);
  //         }
  //       });
  //       comments.push({
  //         _key: comment._key,
  //         authorDisplayName: comment.snippet.topLevelComment.snippet.authorDisplayName,
  //         likeCount: comment.snippet.topLevelComment.snippet.likeCount,
  //         replyCount: comment.snippet.totalReplyCount,
  //         publishedAt: comment.snippet.topLevelComment.snippet.publishedAt,
  //         text: comment.snippet.topLevelComment.snippet.textOriginal,
  //         song: song.song.title,
  //         song_key: song.song._key,
  //         song_id: song.song._id,
  //         artist: song.artist[0].name,
  //         analysis: comment.analysis,
  //         video_key: song.data[0]._key,
  //         videoLikes: song.data[0].statistics.likeCount,
  //         videoDislikes: song.data[0].statistics.dislikeCount,
  //         videoViews: song.data[0].statistics.viewCount,
  //         replies: repliesArray
  //       });
  //     });
  //   });

  //   // console.log(data);
  //   // the comments have to be sorted for the charts
  //   comments.sort((a, b) => {
  //     return new Date(a.publishedAt) > new Date(b.publishedAt) ? -1 : 1;
  //   });
  //   console.log('ready structure for graphs: ', comments);
  //   return comments;
  // }

  // is used to tell an subscriber if the size of view has changed
  getChartRange(): Observable<any> {
    console.log('getChartRange() was triggered: ', this.currentChartRange);
    return this.currentChartRange;
  }

  setChartRange(range) {
    console.log('setChartRange() was triggered');
    this.chartRangeSource.next(range);
  }

  // for loop for the new data structure
  private miniDataStructure(data, additionalInfo): any[] {
    let isGroup = true;
    console.log('XXXXXXX: ', data);
    console.log('YYYYYYY: ', additionalInfo);
    const dataPoints = [];
    let totalViews: number;
    let totalLikes: number;
    let totalDislikes: number;

    let artist = '';
    let title = '';
    let songID = '';
    let songKey = '';

    totalViews = 0;
    totalLikes = 0;
    totalDislikes = 0;





    data.forEach((song, index) => {
      let control = 0;
      console.log('song: ', song);


      // unterscheidung zw 1 version oder 1. gruppe für additionalInfo!!!
      if('etag' in additionalInfo[index]) {
        console.log('I AM ONLY ONE VERSION');
        isGroup = false;
        let words = additionalInfo[index].snippet.title.split('-');
        console.log('words: ', words);
        artist = words[0];
        title = words[1];

        songID = additionalInfo[index].id;
        songKey = additionalInfo[index]._key;



        totalViews = additionalInfo[index].statistics.viewCount;
        totalLikes =  additionalInfo[index].statistics.likeCount;
        totalDislikes =  additionalInfo[index].statistics.dislikeCount;
      } else {
        isGroup = true;
        artist = additionalInfo[index].artist;
        title = additionalInfo[index].title;
        songID = additionalInfo[index].versions[0].id;
        songKey = additionalInfo[index].versions[0]._key;
        console.log('I AM THE WHOLE GROUP');



        // building together total views, dislikes and likes of 1-? versions, whatever is given in addtionalInfo variable
        additionalInfo[index].versions.forEach ((version, index) => {
          totalViews += parseInt(version.statistics.viewCount);
          totalLikes += parseInt(version.statistics.likeCount);
          totalDislikes += parseInt(version.statistics.dislikeCount);
        });
      }



      // console.log('aggregations of song: ', song[0].aggregations);
      let tmp_song = song;
      isGroup ? tmp_song = tmp_song : tmp_song = song[0];

      let analysisObject = {
        languageProbability: 1,
        mainLanguage: 'de'
      };
      tmp_song.aggregations.forEach( date => {
        for (let i = 0; i < date.nbComments; i ++) {
          dataPoints.push({
            _key: control, // where the comment key was
            authorDisplayName: null, // author display name of comment
            likeCount: null, // like count of comment
            replyCount: null, // reply count of comment
            publishedAt: date.publishedAt,
            text: null, // text of the comment
            song: title, // *** song title of the commented song
            song_key: songID, // key of the commented song
            song_id: songKey, // id of song of commented
            artist: artist, // *** artist of the song which was commented
            analysis: analysisObject,
            video_key: song.videoId,
            videoLikes: totalLikes, // *** likes of the video commented
            videoDislikes: totalDislikes, // *** dislikes of the video commented
            videoViews: totalViews, // *** views of the video commented
            replies: null // *** replies of the comment
          });
          control++;
        }
      });
    });

    // the comments have to be sorted for the charts
    dataPoints.sort((a, b) => {
      return new Date(a.publishedAt) > new Date(b.publishedAt) ? -1 : 1;
    });
    console.log('new data structure: ', dataPoints);
    return dataPoints;

    // return null;
  }
}
