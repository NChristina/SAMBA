import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DataService } from './data.service';

@Injectable()
export class SearchService {
  private data: any[] = [];
  private searchResultSource = new BehaviorSubject([]);
  private currentSearchResult = this.searchResultSource.asObservable();

  constructor(private dataService: DataService) {
    // dataService.getData().then((data) => {
    //   while (data.hasNext()) {
    //     data.next().then( (record) => {
    //       console.log(record);
    //       this.data.push(record);
    //       }
    //     );
    //   }
    // });
  }
  // file search
  searchFromFile(value: string, dataSelection: number): Observable<any[]> {
    this.searchResultSource.next(this.searchSplitter(value));
    return this.currentSearchResult;
  }

  searchFromDb(value: string): Promise<any> {
    if (value.length < 1) {
      return;
    }
    return this.dataService.search(value);
  }

  searchSplitter(value: string): any[] {
    if (value.length === 0) {
      return;
    }
    const matches = [];
    const splitted = value.toUpperCase().split(' ');
    this.data.forEach((element) => {
      let count = 0;
      const splittedElement = (element.song.artist + ' - ' + element.data[0].snippet.title).toUpperCase().split(' ');
      splitted.forEach((searchword) => {
        splittedElement.forEach((titleWord) => {
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
