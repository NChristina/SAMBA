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

  getData() {
    const prom: Promise<ArrayCursor> = this
    .db
    .query(`for version in VideoMetadata
     limit 100 let song = first(flatten(for r in 1 outbound version matched
      return (for s in 1 outbound r requestedAbout return s) )) let comment = flatten(for c in inbound version commentOnVideo return c)
      let reply = flatten(for c in inbound version commentOnVideo
      return (for r in outbound c repliedTo return r)) collect a = first(flatten(for r in 1 outbound version matched
        return (for s in 1 outbound r requestedAbout
        return (for a in 1 inbound s sang return a)))), b = first(flatten(for r in 1 outbound version matched
          return (for s in 1 outbound r requestedAbout return s) )), c = comment, e = song, d = reply into videos
          return {"artist" : a, "song" : b, "data" : videos[*].version, "comment" : c, "reply" : d}`);
    return prom;
  }
  search(value: string): Promise<any> {
    const search = value.replace(' ', '%20');
    return this.service.get('search/' + search);
  }

  // gets the data locally from the assets folder
  // getData(): Observable<any[]> {
  //   return this.httpClient.get('/assets/data.json') as any;
  // }

  getDataFromDb() {
  }
}
