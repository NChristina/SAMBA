import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable()
export class DataService {
  private data;

  constructor(private httpClient: HttpClient) {
  }

  // gets the data locally from the assets folder
  getData(): Observable<any[]> {
    return this.httpClient.get('/assets/data.json') as any;
  }

  getDataFromDb() {
  }
}
