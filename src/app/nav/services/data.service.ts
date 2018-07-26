import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { Observable, from } from 'rxjs';
 import { Database, aql } from 'arangojs/lib/web.js';
//import { Database, aql } from 'arangojs';
import { ArrayCursor } from '../../../../node_modules/arangojs/lib/cjs/cursor';


@Injectable()
export class DataService {
  private data;
  private db: Database;

  constructor(private httpClient: HttpClient) {
    this.db = new Database({
      url: 'http://127.0.0.1:8529'
    });
    this.db.useDatabase('ForTunesV0_1');
    //this.db.useBasicAuth('reader', 'hackathon');
    this.db.useBasicAuth('root', '');
    //this.db.getService('search').then((ser) => console.log(ser));
    //httpClient.get('http://localhost:8529/_db/ForTunesV0_1/search/search/fil').subscribe((res) => console.log(res));
    const service = this.db.route('search', {  });
    // service.post('search', {
    //   username: 'admin',
    //   password: 'hunter2'
    // })
    service.get('search/fil').then((res) => console.log(res));
  }

  getData(): Promise<ArrayCursor> {
    const prom: Promise<ArrayCursor> = this.db.query('for version in VideoMetadata limit 100 let song = first(flatten(for r in 1 outbound version matched return (for s in 1 outbound r requestedAbout return s) )) let comment = flatten(for c in inbound version commentOnVideo return c) let reply = flatten(for c in inbound version commentOnVideo return (for r in outbound c repliedTo return r)) collect a = first(flatten(for r in 1 outbound version matched return (for s in 1 outbound r requestedAbout return (for a in 1 inbound s sang return a)))), b = first(flatten(for r in 1 outbound version matched return (for s in 1 outbound r requestedAbout return s) )), c = comment, e = song, d = reply into videos return {"artist" : a, "song" : b, "data" : videos[*].version, "comment" : c, "reply" : d}');
    return prom;
    //return this.httpClient.get('/assets/data.json') as any;
  }

  getDataFromDb() {
  }
}
