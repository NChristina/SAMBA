import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { SearchService } from './services/search.service';
import { MdcSnackbar, MdcSnackbarConfig } from '@angular-mdc/web';
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
  config: MdcSnackbarConfig = { align: 'top'};



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

    if (id === 'checkbox_' + index) {
      let versionIDs: string[] = [];
      this.searchMatchList[index].versions.forEach(version => {
        versionIDs.push(version.id);
      });
      if (checkbox.target.checked) {
        if (this.loadedItems.length === 8) {
              const snackBar = this.snackbar.show('You can only pick 8 items', 'OK', this.config);
              return;
        } else {
          // console.log('add the whole group ', versionIDs);
          this.searcher.songDetailsFromDb(versionIDs).then((results) => {
            // console.log('I GOT A RESULT FROM SONGDETAILS: ', results.body);
            this.loadedItems.push(results.body[0]);
            // console.log('lölölöl: ', this.loadedItems);
            this.matchForAdditionalInfo.push(this.searchMatchList[index]);
            this.labelsForChips.push({title: this.matchForAdditionalInfo[this.matchForAdditionalInfo.length - 1].title + ' - '
            + this.matchForAdditionalInfo[this.matchForAdditionalInfo.length - 1].artist, isGroup: true});
            console.log('labels: ', this.labelsForChips);

            console.log('ULULULULULU: ', this.matchForAdditionalInfo);
            this.chartService.SetData(this.loadedItems,  this.matchForAdditionalInfo);
            this.upDateChips(false);
          });
        }
      } else {
        this.makeTheRemoval(versionIDs, index, childIndex);
      }
    } else if (id === 'subcheckbox_' + childIndex) {
      let versionID: string[] = [];
      versionID.push(this.searchMatchList[index].versions[childIndex].id);

      if (checkbox.target.checked) {
        if (this.loadedItems.length === 8) {
              const snackBar = this.snackbar.show('You can only pick 8 items', 'OK', this.config);
              return;
        } else {
          console.log('add only me: ', versionID);
          this.searcher.songDetailsFromDb(versionID).then((results) => {
            this.loadedItems.push(results.body);
            this.matchForAdditionalInfo.push(this.searchMatchList[index].versions[childIndex]);
            console.log('ULULULULULU: ', this.matchForAdditionalInfo);
            this.labelsForChips.push({title: this.matchForAdditionalInfo[this.matchForAdditionalInfo.length - 1].snippet.title,
              isGroup: false});
            console.log('labels: ', this.labelsForChips);

            this.chartService.SetData(this.loadedItems, this.matchForAdditionalInfo);
            this.upDateChips(true);
          });
        }

      } else {
        this.makeTheRemoval(versionID, index, childIndex);
      }
    }
  }

  // für die SEARCH LIST
  makeTheRemoval(versionIDs, idx, childIndex) {
    console.log('info: ', versionIDs, ' // index: ', idx, '// childIndex: ', childIndex);
    console.log('delete out of loadedItems: ', this.loadedItems);

    if (childIndex === null) { // is group
      console.log('group');
      this.loadedItems.forEach((item, index) => {
        if(item.videoIds !== undefined) {
          if (item.videoIds[0] === versionIDs[0]) {
            this.loadedItems.splice(index, 1);
            this.matchForAdditionalInfo.splice(index, 1);
            this.labelsForChips.splice(index, 1);
            this.chartService.SetData(this.loadedItems, this.matchForAdditionalInfo);

          }
        }
      });

    } else {
      console.log('single');
        this.loadedItems.forEach((item, index) => {
          if(item.videoIds === undefined) {
            if(item[0].videoIds[0] === versionIDs[0]) {
              this.loadedItems.splice(index, 1);
              this.matchForAdditionalInfo.splice(index, 1);
              this.labelsForChips.splice(index, 1);
              this.chartService.SetData(this.loadedItems, this.matchForAdditionalInfo);
            }
          }
        });
    }
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
    this.matchForAdditionalInfo.splice(index, 1);
    this.chartService.SetData(this.loadedItems, this.matchForAdditionalInfo);

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
