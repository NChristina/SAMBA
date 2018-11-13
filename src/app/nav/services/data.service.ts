import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Database } from 'arangojs/lib/web';
import { ArrayCursor } from '../../../../node_modules/arangojs/lib/cjs/cursor';

@Injectable()
export class DataService {
  private data;
  private db: Database;
  private service;


  constructor(private httpClient: HttpClient) {
    this.db = new Database({
      url: 'http://10.0.1.26:8530'
    });
    this.db.useDatabase('ForTunesV0_1');
    this.db.useBasicAuth('reader', 'hackathon');
    this.service = this.db.route('search', {  });
  }

  search(value: string): Promise<any> {
    const search = value.replace(' ', '%20');
    return this.service.get('search/' + search);
  }

  // gets the data locally from the assets folder
  // getData(): Observable<any[]> {
  //   return this.httpClient.get('/assets/data.json') as any;
  // }
}
