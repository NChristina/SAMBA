import { Component, OnInit } from '@angular/core';
import * as mdc from '@angular-mdc/web';
import { SearchService } from './services/search.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent implements OnInit {
  showFiller = false;
  private input: string;
  searchMatchList = [];
  proposalList = [];
  versionsMatchList = [];

  constructor(private searcher: SearchService) { }

  ngOnInit() {

  }

  onSearching(event) {
    this.searcher.search(event.target.value).subscribe((results) => {
      this.proposalList = results;
    });
  }

  submitSearch(value: string) {
    this.searchMatchList = [];
    // let filter;
    // const input = value;
    // if (input === '') {
    //   return;
    // }
    // filter = input.toUpperCase();
    // for (let i = 0; i < this.songData.length; i++) {
    //   const title = this.songData[i].title;
    //   if (title.toUpperCase().indexOf(filter) > -1) {
    //     this.searchMatchList.push(this.songData[i]);
    //   }
    // }
  }

  /**
   *  - handles the click on the song and shows the versions of the song
   *  - handles the opening of the version-side-bar
   */
  showVersions(index, drawer) {
    this.versionsMatchList = [];
    console.log(index);
    if (this.searchMatchList[index].versions !== undefined) {
      this.searchMatchList[index].versions.forEach((v) => {
        this.versionsMatchList.push(v);
      });
      drawer.open();
    } else {
      drawer.close();
    }
  }

}
