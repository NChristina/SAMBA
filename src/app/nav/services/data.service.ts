import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Database } from 'arangojs/lib/web';
import { AppConstants } from '../../shared/app.constants';


@Injectable()
export class DataService {
  private data;
  private db: Database;
  private service;
  private p_url = AppConstants.URL;
  private p_db_name = AppConstants.DB_NAME;
  private p_auth_name = AppConstants.AUTH_NAME;
  private p_auth_password = AppConstants.AUTH_PASSWORD;

// put this on another file and put it in gitignore
// when rebase, ask alexis to change the credentials
  constructor(private httpClient: HttpClient) {
    this.db = new Database({
      url: this.p_url
    });
    this.db.useDatabase(this.p_db_name);
    this.db.useBasicAuth(this.p_auth_name, this.p_auth_password);
    this.service = this.db.route('search', {  });
  }

  // implement the new endpoints right in here
  // search
  // song details
  // comments

  search(value: string): Promise<any> {
    const search = value.replace(' ', '%20');
    return this.service.get('search/' + search);
  }
}
