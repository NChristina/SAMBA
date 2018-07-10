import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DataService } from './data.service';

@Injectable()
export class SearchService {
  private data: any[];

  constructor(private dataService: DataService) {
    dataService.getData().subscribe((data) => {
      this.data = data;
      console.log(data);
    });
  }

  search(value: string): Observable<any[]> {
    return new Observable((observer) => {
      observer.next(this.getSearchArray(value));
      observer.complete();
    });
  }

  getVersions(songId: number): Observable<any[]> {
    return new Observable((observer) => {
      observer.next();
      observer.complete();
    });
  }

  getSongs(name: string) {
    return new Observable((observer) => {
      observer.next(
        this.getSongByWord(name)
      );
      observer.complete();
    });
  }

  private getSongByWord(word: string): any[] {
    const matches = [];
    const wordSplit = word.split(' ');
    this.data.forEach((e) => {
      let match = false;
      const splitted = e.title.split(' ');
      for (let i = 0; i < wordSplit.length; i++) {
        if (i === splitted.length) {
          break;
        }
        if (splitted[i] === wordSplit[i]) {
          match = true;
        } else {
          match = false;
        }
      }
      if (match) {
        matches.push(e);
      }
    });
    return matches;
  }

  private getSearchArray(value: string): any[] {
    const matches = [];
    let filter;
    if (value === '') {
      return;
    }
    filter = value.toUpperCase();
    for (let i = 0; i < this.data.length; i++) {
      const title = this.data[i].title;
      if (title.toUpperCase().indexOf(filter) > -1) {
        matches.push(this.data[i]);
      }
    }
    return matches;
  }

}
