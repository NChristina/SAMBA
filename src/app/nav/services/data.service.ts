import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Database } from 'arangojs/lib/web';
import { AppConstants } from '../../shared/app.constants';
import { Observable } from 'rxjs';



@Injectable()
export class DataService {
  private data;
  private db: Database;
  private service;
  private requestService;
  private p_url = AppConstants.URL;
  private p_db_name = AppConstants.DB_NAME;
  private p_auth_name = AppConstants.AUTH_NAME;
  private p_auth_password = AppConstants.AUTH_PASSWORD;
  // private videoIds = [];
  private baseURL = 'https://jukebox.fhstp.ac.at:8531/_db/';
  private serviceName = 'quickSearch/';
  private dbName = 'ForTunesV0_1/';

// put this on another file and put it in gitignore
// when rebase, ask alexis to change the credentials
  constructor(private httpClient: HttpClient) {
    this.db = new Database({
      url: this.p_url
    });
    console.log('am i called from the beginning?');
    this.db.useDatabase(this.p_db_name);
    this.db.useBasicAuth(this.p_auth_name, this.p_auth_password);
    this.service = this.db.route('search', {  });
    this.requestService = this.db.route('quickSearch', {  });
  }

  search(value: string): Promise<any> {
    const search = value.replace(' ', '%20');
    return this.service.get('search/' + search);
  }

  quickSearch(value: string): Observable<any> {
    const search = value.replace(' ', '%20');
    return this.httpClient.get(this.baseURL + this.dbName + this.serviceName + 'quickSearch/' + search);

  }

  songDetails(value: string[]): Observable<any> {
    // return this.requestService.get('songAggregations/' + JSON.stringify(value));
    return this.httpClient.get(this.baseURL + this.dbName + this.serviceName + 'songAggregations/' +  JSON.stringify(value));


  }

  songDetailsMock(): Observable<any[]> {
    console.log('entered loadMockData');
    return this.httpClient.get('../../../assets/newMockData.json') as any;
  }

  getComments(nbComments: number, order: String, ids: String[], startDate: any, endDate: any): Promise<any>{

    console.log('send me the new comments pls');
    console.log(nbComments);
    console.log(order);
    console.log(ids);
    console.log(startDate);
    console.log(endDate);
    return this.requestService.get('comments/' + JSON.stringify(ids));
    // return this.httpClient.get('../../../assets/newMockData.json') as any;
  }
}
