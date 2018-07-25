import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Database } from 'arangojs/lib/web';

@Injectable()
export class DataService {
  private data;
  private database: Database;

  constructor(private httpClient: HttpClient) {
    this.database = new Database({
      url: 'http://10.0.1.26:8530'
    });
    this.database.useDatabase('ForTunesV0_1');
    //this.database.login('reader', 'hackathon').then((result) => {
    //  this.database.useBearerAuth(result);
    //});
    this.database.useBasicAuth('reader', 'hackathon');
    this.database.query('Return date_now()').then((response) => {
       console.log(response._result);
    }).catch((err) => {console.log(err)});
    //this.httpClient.get('http://10.0.1.26:8530/_db/ForTunesV0_1/_admin/status', { withCredentials: true })
    //  .subscribe((res) => console.log(res));
  }

  getData(): Observable<any[]> {
    return this.httpClient.get('/assets/data.json') as any;
  }

  getDataFromDb() {
  }
}
