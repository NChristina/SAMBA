import { Component, OnInit } from '@angular/core';
import { SearchService } from './services/search.service';
import { MdcCheckbox, MdcSnackbar } from '@angular-mdc/web';
import { ChartService } from './dashboard/services/chart.service';
@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent implements OnInit {
  // list with all the search-results
  searchMatchList = [];
  // list with all selected 'songs'
  selectedList = [];
  isSearching = false;


  constructor(private searcher: SearchService, private chartService: ChartService, private snackbar: MdcSnackbar) { }

  ngOnInit() {

  }
  // is called when the user hits enter (searchBar)
  submitSearch(value: string) {
    console.log('entered submitSearch in nav comp');
    this.searchMatchList = [];
    this.isSearching = true;
    this.searcher.searchFromDb(value).then((results) => {
      console.log(results.body);
      const list = [];
      results.body.forEach(record => {
        list.push({ displayName: record.data[0].snippet.title, data: record });
      });
      this.searchMatchList = list;
      this.isSearching = false;
    });
    console.log('this is the end of submitSearch');
  }

  // is called when the user selects a song
  // it checks if the user has already selected the song
  // it also updates the data for all charts via the chartService
  selectSong(index: number, checkbox: boolean) {
    if (checkbox) {
      if (this.selectedList.length === 8) {
        const snackBar = this.snackbar.show('You can only pick 8 songs', 'OK', {});
        // checkbox.toggle();
        return;
      }
      this.selectedList.push(this.searchMatchList[index].data);
    } else {
      this.selectedList.forEach((song, i) => {
        if (song.data[0]._id === this.searchMatchList[index].data.data[0]._id) {
          this.selectedList.splice(i, 1);
        }
      });
    }

    this.chartService.SetData(this.selectedList); // update for all charts
  }

  // removes a song, which was already selected
  removeSelectedSong(index) {
    const song = this.selectedList[index];
    this.searchMatchList.forEach((songData, i) => {
      if (songData.data.data[0]._id === song.data[0]._id) {
        this.searchMatchList.splice(i, 1);
        this.searchMatchList.push({displayName: song.song.artist + ' - ' + song.song.title, data: song});
      }
    });
    // sorts the data by views (has to be updated by comments)
    // the sort is used to keep the list as it is, when removing
    // and pushing the removed song
    // this.searchMatchList.sort((a, b) => {
    //   if (a.data.data[0].statistics === b.data.data[0].statistics) {
    //     return 0;
    //   }
    //   return a.data.data[0].statistics.viewCount > b.data.data[0].statistics.viewCount ? -1 : 1; // Sort by view count of song
    // });
    this.selectedList.splice(index, 1);
    this.chartService.SetData(this.selectedList);
  }
}
