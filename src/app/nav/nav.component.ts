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
  searchMatchList: any[] = [];
  matchForAdditionalInfo = [];
  // list with all selected 'songs'
  selectedList = [];
  isSearching = false;
  chevronDown = true;
  loadedItems = [];
  loadedMockData = [];
  labelsForChips = [];



  constructor(private searcher: SearchService, private chartService: ChartService, private snackbar: MdcSnackbar) {

  }

  ngOnInit() {
    document.getElementById('sFimg').style.display = 'none'; // Spinner OFF default

  }


  submitQuickSearch(value: string) {
    if (value) {
      // Entered submitSearch in nav comp
      document.getElementById('sFtext').style.display = 'none'; // Remove any alert
      document.getElementById('sFimg').style.display = 'block'; // Spinner ON

      this.searchMatchList = [];
      this.isSearching = true;
      this.searcher.quickSearchFromDb(value.trim()).then((results) => {
        document.getElementById('sFimg').style.display = 'none'; // Spinner OFF
        // console.log('I GOT A RESULT: ', results.body);
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
  selectSong(index: number, childIndex: number, checkbox) {
    let id = checkbox.target.id;
    // console.log('event: ', checkbox.target.checked);
    // console.log('checkbox: ', checkbox.target.id);
    // this.searcher.loadMockData().subscribe( results => {
    //   this.loadedMockData = results;
    //   console.log('data should be here now: ', this.loadedMockData);
    //   this.chartService.setMockData(this.loadedMockData, this.searchMatchList[0]);
    //   // console.log('do we have the results in the nav?: ',  results);

    //   // this.chartService.setMockData(this.loadedMockData);
    // });

    if (id === 'checkbox_' + index) {
      let versionIDs: string[] = [];
      this.searchMatchList[index].versions.forEach(version => {
        versionIDs.push(version.id);
      });
      if (checkbox.target.checked) {
        // console.log('add the whole group ', versionIDs);
        this.searcher.songDetailsFromDb(versionIDs).then((results) => {
          // console.log('I GOT A RESULT FROM SONGDETAILS: ', results.body);
          this.loadedItems.push(results.body[0]);
          // console.log('lölölöl: ', this.loadedItems);
          this.matchForAdditionalInfo.push(this.searchMatchList[index]);
          this.labelsForChips.push({title: this.matchForAdditionalInfo[this.matchForAdditionalInfo.length - 1].title + ' - ' + this.matchForAdditionalInfo[this.matchForAdditionalInfo.length - 1].artist, isGroup: true});
          console.log('labels: ', this.labelsForChips);

          console.log('ULULULULULU: ', this.matchForAdditionalInfo);
          this.chartService.SetData(this.loadedItems,  this.matchForAdditionalInfo);
          this.upDateChips(false);
        });
      } else {
        this.makeTheRemoval(versionIDs, index, childIndex);
      }
    } else if (id === 'subcheckbox_' + childIndex) {
      let versionID: string[] = [];
      versionID.push(this.searchMatchList[index].versions[childIndex].id);


      if (checkbox.target.checked) {
        console.log('add only me: ', versionID);
        this.searcher.songDetailsFromDb(versionID).then((results) => {
          // console.log('I GOT A RESULT FROM SONGDETAILS: ', results.body);
          this.loadedItems.push(results.body);
          // console.log('lölölöl: ', this.loadedItems);
          // console.log('searchMatchList[index]: ', this.searchMatchList[index].versions[childIndex]);
          this.matchForAdditionalInfo.push(this.searchMatchList[index].versions[childIndex]);
          console.log('ULULULULULU: ', this.matchForAdditionalInfo);
          this.labelsForChips.push({title: this.matchForAdditionalInfo[this.matchForAdditionalInfo.length - 1].snippet.title, isGroup: false});
          console.log('labels: ', this.labelsForChips);

          this.chartService.SetData(this.loadedItems, this.matchForAdditionalInfo);
          this.upDateChips(true);
        });

      } else {
        console.log('remove only me: ', versionID);
        this.makeTheRemoval(versionID, index, childIndex);
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

  // für die SEARCH LIST
  makeTheRemoval(versionIDs, index, childIndex) {

    console.log('info: ', versionIDs, ' // index: ', index, '// childIndex: ', childIndex);

    if (childIndex === null) { // is group
      console.log('group');
    } else {
      console.log('single');
        this.loadedItems.forEach(item => {
          console.log('item: ', item, ' // is type of array: ', typeof item === 'object');
          // if(typeof item === 'array')
        });

    }
    // versionIDs.forEach( (id) => {
    //   console.log('items: ', id);

      // this.loadedItems.forEach( (li, index) => {
      //   for (let i = 0; i < li.length; i ++) {
      //     console.log('xxx1');
      //     if (id === li[i].data[0]['_key']) {
      //       console.log('loadedItems before removal: ', this.loadedItems);
      //       this.loadedItems.splice(index, 1);
      //       this.selectedList.splice(index, 1);

      //       console.log('end: ', li[i].data[0]['_key']);
      //       console.log('endx: ', li[i]);
      //       console.log('loadedItems after removal: ', this.loadedItems);
      //     }
      //     break;
      //   }
      // });
    // });
  }

  upDateChips(single) {
    // console.log('items to show in chips: ', this.loadedItems);
    // console.log('is single: ', single);
    // console.log('OLOLOLOL: ', this.loadedItems[0][0].data[0].snippet.title);
    // // if (checkbox.target.checked) {
    //     if (this.selectedList.length === 8) {
    //       const snackBar = this.snackbar.show('You can only pick 8 songs', 'OK', {});
    //       return;
    //     }

    //     if(single) {
    //       this.selectedList.push(this.loadedItems[this.loadedItems.length - 1][0]);
    //       console.log('loadedItems: ', this.loadedItems);

    //       console.log('loadedItems[this.loadedItems.length - 1]: ', this.loadedItems[this.loadedItems.length - 1]);
    //       console.log('selectedList: ', this.selectedList);

    //     } else {
    //       this.selectedList.push(this.loadedItems[this.loadedItems.length - 1][0]);
    //       console.log('selectedList: ', this.selectedList);
    //     }

    //     this.selectedList.push(this.searchMatchList[index].data);
    //   // } else {
    //   //   this.selectedList.forEach((song, i) => {
    //   //     if (song.data[0]._id === this.searchMatchList[index].data.data[0]._id) {
    //   //       this.selectedList.splice(i, 1);
    //   //       console.log('this.selectedList: ', this.selectedList);
    //   //     }
    //   //   });
    //   // }

  }

  // removes a song, which was already selected
  // für die chips!!!
  removeSelectedSong(element, index) {


    console.log('element: ', element);
    this.loadedItems.splice(index, 1);
    this.labelsForChips.splice(index, 1);

    // for (let i = 0; i < this.searchMatchList.length; i++) {
    //   let found = false;
    //   let addAgain: any;
    //   for (let j = 0; j < this.searchMatchList[i].versions.length; j ++) {
    //     if(this.searchMatchList[i].versions[j]['_key'] === id[0].data[0]['_key']) {
    //       console.log('WE FOUND A MATCH ULULULUL');
    //       addAgain = this.searchMatchList[i];
    //       console.log('the element we need to add again: ', addAgain);
    //       // this.searchMatchList[i] = [];
    //       this.searchMatchList.splice(i, 1);
    //       console.log('zwischenschritt');
    //       // this.searchMatchList[i] = addAgain;
    //       found = true;
    //       break;
    //     }
    //   }
    //   if (found) {
    //     console.log('now adding again: ', this.searchMatchList);
    //     // this.searchMatchList[i] =  addAgain;
    //     this.searchMatchList.splice(i, 0, addAgain);
    //     console.log('should be in there again: ', this.searchMatchList);
    //     // this.chartService.SetData(this.loadedItems, null);

    //     break;
    //   }
    // }




    // for(let i = 0; i < this.searchMatchList.length; i ++) {
    //   console.log('die mimi: ', this.searchMatchList[i]);

    //   console.log('matchlist: ', this.searchMatchList[i].versions[0]['_key'], ' // ', id, ' && ', this.searchMatchList[i].versions[0]['_key'] === id );
    //   console.log('test: ', 'doof' === 'doof');
    //   if(this.searchMatchList[i].versions[0]['_key'] === id) {
    //     console.log('ULULULULULULULULULUL');
    //   }

      // if () {

      //   break;
      // }

    // }

    // this.searchMatchList.forEach((songData, i) => {
    // });

    // this.searchMatchList.forEach((songData, i) => {
    //   if (songData.data.data[0]._id === song.data[0]._id) {

    //     this.searchMatchList[i] = {displayName: song.song.artist + ' - ' + song.song.title, data: song};

    //     console.log('removeSelectedSong: this.serachMatchList: ', this.searchMatchList);
    //     console.log('removeSelectedSong: this.loadedItems: ', this.loadedItems);

    //   }
    // });
    // let additionalInfo = this.selectedList[index];
    // this.selectedList.splice(index, 1);
    // this.chartService.SetData(this.selectedList, additionalInfo);
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
  }
}
