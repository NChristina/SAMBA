import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { SearchService } from './services/search.service';
import { MdcSnackbar } from '@angular-mdc/web';
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
  chevronDown = true;
  loadedItems = [];



  constructor(private searcher: SearchService, private chartService: ChartService, private snackbar: MdcSnackbar) {

  }

  ngOnInit() {
    document.getElementById('sFimg').style.display = 'none'; // Spinner OFF default

  }
  // is called when the user hits enter (searchBar)
  // submitSearch(value: string) {
  //   if (value) {
  //     // Entered submitSearch in nav comp
  //     document.getElementById('sFtext').style.display = 'none'; // Remove any alert
  //     document.getElementById('sFimg').style.display = 'block'; // Spinner ON

  //     this.searchMatchList = [];
  //     this.isSearching = true;
  //     this.searcher.searchFromDb(value.trim()).then((results) => {
  //       document.getElementById('sFimg').style.display = 'none'; // Spinner OFF
  //       if (results.body.length === 0) {
  //         document.getElementById('sFtext').style.display = 'block'; // Display alert
  //       }
  //       const list = [];
  //       results.body.forEach(record => {
  //         list.push({ displayName: record.data[0].snippet.title, data: record });
  //       });
  //       this.searchMatchList = list;
  //       this.isSearching = false;
  //     });
  //   }
  // }

  submitQuickSearch(value: string) {
    if (value) {
      // Entered submitSearch in nav comp
      document.getElementById('sFtext').style.display = 'none'; // Remove any alert
      document.getElementById('sFimg').style.display = 'block'; // Spinner ON

      this.searchMatchList = [];
      this.isSearching = true;
      this.searcher.quickSearchFromDb(value.trim()).then((results) => {
        document.getElementById('sFimg').style.display = 'none'; // Spinner OFF
        console.log('I GOT A RESULT: ', results.body);
        if (results.body.length === 0) {
          document.getElementById('sFtext').style.display = 'block'; // Display alert
        }
        this.searchMatchList = results.body;
        this.isSearching = false;
      });
    }
  }

  // is called when the user selects a song
  // it checks if the user has already selected the song
  // it also updates the data for all charts via the chartService
  selectSong(index: number, checkbox) {
    let id = checkbox.target.id;
    console.log('event: ', checkbox.path[5].id);
    console.log('checkbox: ', checkbox.target.id);

    if (id === 'checkbox_' + index) {
      let versionIDs: string[] = [];
      this.searchMatchList[index].versions.forEach(version => {
        versionIDs.push(version.id);
      });
      if (checkbox.target.checked) {
        console.log('add the whole group ', versionIDs);
        this.searcher.songDetailsFromDb(versionIDs).then((results) => {
          console.log('I GOT A RESULT FROM SONGDETAILS: ', results.body);
          this.loadedItems.push(results.body);
          this.chartService.SetData(this.loadedItems);
          this.upDateChips();
        });
      } else {
        console.log('remove the whole group', versionIDs);
        // hier die elemente rauslöschen
      }

    } else if (id === 'subcheckbox_' + index) {
      let versionID: string[] = [];
      versionID.push(this.searchMatchList[index].versions[index].id);


      if (checkbox.target.checked) {
        console.log('add only me: ', versionID);
        this.searcher.songDetailsFromDb(versionID).then((results) => {
          console.log('I GOT A RESULT FROM SONGDETAILS: ', results.body);
          this.loadedItems.push(results.body);
          this.chartService.SetData(this.loadedItems);
          this.upDateChips();


        });

      } else {
        console.log('remove only me: ', versionID);
        // hier element rauslöschen

      }

    }

    // if (checkbox.target.checked) {
    //   if (this.selectedList.length === 8) {
    //     const snackBar = this.snackbar.show('You can only pick 8 songs', 'OK', {});
    //     return;
    //   }
    //   this.selectedList.push(this.searchMatchList[index].data);
    // } else {
    //   this.selectedList.forEach((song, i) => {
    //     if (song.data[0]._id === this.searchMatchList[index].data.data[0]._id) {
    //       this.selectedList.splice(i, 1);
    //       console.log('this.selectedList: ', this.selectedList);
    //     }
    //   });
    // }
    // console.time('this.chartService.SetData()');
    // this.chartService.SetData(this.selectedList); // update for all charts
    // console.timeEnd('this.chartService.SetData()');
  }

  upDateChips(){
    console.log('items to show in chips: ', this.loadedItems);
    // if (checkbox.target.checked) {
        if (this.selectedList.length === 8) {
          const snackBar = this.snackbar.show('You can only pick 8 songs', 'OK', {});
          return;
        }
        this.selectedList.push(this.loadedItems[0][this.loadedItems.length - 1]);
        // this.selectedList.push(this.searchMatchList[index].data);
      // } else {
      //   this.selectedList.forEach((song, i) => {
      //     if (song.data[0]._id === this.searchMatchList[index].data.data[0]._id) {
      //       this.selectedList.splice(i, 1);
      //       console.log('this.selectedList: ', this.selectedList);
      //     }
      //   });
      // }

  }

  // removes a song, which was already selected
  removeSelectedSong(index) {
    const song = this.selectedList[index];
    this.searchMatchList.forEach((songData, i) => {
      if (songData.data.data[0]._id === song.data[0]._id) {

        this.searchMatchList[i] = {displayName: song.song.artist + ' - ' + song.song.title, data: song};

        console.log('removeSelectedSong: this.serachMatchList: ', this.searchMatchList);
      }
    });
    this.selectedList.splice(index, 1);
    this.chartService.SetData(this.selectedList);
  }
  toggleAccordion(index, event) {
    console.log('XXXXX event: ', event);
    console.log('accordion.....was toggled with index ', index, ' and the event is: ', event);
    let element = document.getElementById('accordion_' + index);
    let panel = document.getElementById('panel_' + index);
    let img = document.getElementById('img_' + index);

    if (panel.style.maxHeight) {
      panel.style.maxHeight = null;
      (img as HTMLImageElement).src = '../../assets/chevron_down.svg';
    } else {
      panel.style.maxHeight = panel.scrollHeight + 'px';
      (img as HTMLImageElement).src = '../../assets/chevron_up.svg'; // set attribute
    }
    // if(){

    // }
  }
}
