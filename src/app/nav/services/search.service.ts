import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DataService } from './data.service';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class SearchService {
  private data: any[];
  private mockData: any[];
  // private searchResultSource = new BehaviorSubject([]);
  // private currentSearchResult = this.searchResultSource.asObservable();

  constructor(private dataService: DataService, private httpClient: HttpClient) {}

  loadMockData(): Observable<any[]> {
    const d =  this.dataService.songDetailsMock();
    console.log('xx: ', d);
    return d;
  }

  searchFromDb(value: string): Promise<any> {
    console.log('entered searchFromDb() in search.service.ts: ', value);
    if (value.length < 1) {
      return;
    }
    console.log('???: ', this.dataService.search(value));
    return this.dataService.search(value);
  }

  quickSearchFromDb(value: string): Promise<any> {
    // console.log('entered quickSearchFromDb() in search.service.ts: ', value);
    if (value.length < 1) {
      return;
    }
    return this.dataService.quickSearch(value);
  }

  songDetailsFromDb(value: string[]): Promise<any> {
    // console.log('entered searchFromDb() in search.service.ts: ', value);
    if (value === undefined) {
      console.log('the value is undefined ?!');
    } else {
      return this.dataService.songDetails(value);
    }
  }

  songTopicsFromDb(value: string[]): Promise<any> {
    if (value === undefined) {
      console.log('the value is undefined ?!');
    } else {
      return this.dataService.songTopics(value);
    }
  }

  // splits the value and the song title by words and look for each word if it
  // matches any word. Results will be pushed to a list, after that the list will
  // be sorted by match count, comments and views
  searchSplitter(value: string): any[] {
    if (value.length === 0) {
      return;
    }
    // list
    const matches = [];
    // value splitted into words
    const splitted = value.toUpperCase().split(' ');
    // loop for each song
    this.data.forEach((element) => {
      let count = 0;
      const splittedElement = (element.song.artist + ' - ' + element.data[0].snippet.title).toUpperCase().split(' ');
      splitted.forEach((searchword) => {
        splittedElement.forEach((titleWord) => {
          // test for match
          if (titleWord.indexOf(searchword) > -1) {
            count++;
            return;
          }
        });
      });
      if (count > 0 && element.comment.length > 1) {
        matches.push({ displayName: element.data[0].snippet.title , value: count, data: element});
      }
    });
    // if they got the same count, they should be compared by views
    matches.sort((a, b) => {
      let ret = -1;
      if (a.value > b.value) {
        ret = -1;
      } else if (a.value === b.value) {
        ret = a.data.data[0].statistics.viewCount > b.data.data[0].statistics.viewCount ? -1 : 1;
      } else {
        ret = a.value < b.value ? 1 : 0;
      }
      return a.data.comment.length < b.data.comment.length ? 1 : ret;
    });
    return matches;
  }
}
