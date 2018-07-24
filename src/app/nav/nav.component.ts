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
  showFiller = false;
  private input: string;
  searchMatchList = [];
  selectedList = [];

  isSearching = false;

  constructor(private searcher: SearchService, private chartService: ChartService, private snackbar: MdcSnackbar) { }

  ngOnInit() {

  }
  // tried to implement spinner
  submitSearch(value: string) {
    this.searchMatchList = [];
    this.isSearching = true;
    this.searcher.search(value).subscribe((results) => {
      this.searchMatchList = results;
      this.isSearching = false;
    });
  }

  selectSong(index: number, checkbox: MdcCheckbox) {
    if (checkbox.isChecked()) {
      if (this.selectedList.length === 8) {
        const snackBar = this.snackbar.show('You can only pick 8 songs', 'OK', {});
        checkbox.toggle();
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
    this.chartService.SetData(this.selectedList);
  }

  removeSelectedSong(index) {
    const song = this.selectedList[index];
    this.searchMatchList.forEach((songData, i) => {
      if (songData.data.data[0]._id === song.data[0]._id) {
        this.searchMatchList.splice(i, 1);
        this.searchMatchList.push({displayName: song.song.artist + ' - ' + song.song.title, data: song});
      }
    });
    this.searchMatchList.sort((a, b) => {
      if (a.data.data[0].statistics === b.data.data[0].statistics) {
        return 0;
      }
      return a.data.data[0].statistics.viewCount > b.data.data[0].statistics.viewCount ? -1 : 1;
    });
    this.selectedList.splice(index, 1);
    this.chartService.SetData(this.selectedList);
  }
}
