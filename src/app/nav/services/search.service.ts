import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DataService } from './data.service';

@Injectable()
export class SearchService {
  private data: any[];
  private searchResultSource = new BehaviorSubject([]);
  private currentSearchResult = this.searchResultSource.asObservable();

  constructor(private dataService: DataService) {
    dataService.getData().subscribe((data) => {
      this.data = data;
    });
  }

  search(value: string): Observable<any[]> {
    this.searchResultSource.next(this.searchSplitter(value));
    return this.currentSearchResult;
  }

  searchSplitter(value: string): any[] {
    if (value.length === 0) {
      return;
    }
    const matches = [];
    const splitted = value.toUpperCase().split(' ');
    this.data.forEach((element) => {
      let count = 0;
      const splittedElement = (element.song.artist + ' - ' + element.song.title).toUpperCase().split(' ');
      splitted.forEach((searchword) => {
        splittedElement.forEach((titleWord) => {
          if (titleWord.indexOf(searchword) > -1) {
            count++;
            return;
          }
        });
      });
      if (count > 0) {
        matches.push({ displayName: element.song.artist + ' - ' +  element.song.title , value: count, data: element});
      }
    });
    // if they got the same count, they should be compared by views
    matches.sort((a, b) => {
      if (a.value > b.value) {
        return -1;
      } else if (a.value === b.value) {
        return a.data.data[0].statistics.viewCount > b.data.data[0].statistics.viewCount ? -1 : 1;
      } else {
        return a.value < b.value ? 1 : 0;
      }
    });
    return matches;
  }
}
