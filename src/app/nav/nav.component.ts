import { Component, OnInit, ElementRef, ViewChild, NgZone} from '@angular/core';
import { SearchService } from './services/search.service';
import { MdcSnackbar, MdcSnackbarConfig } from '@angular-mdc/web';
import { ChartService } from './dashboard/services/chart.service';
import { DataService } from './services/data.service';

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
  openDrawer = false;
  idsForChild = [];
  totalCommentsForChild = 0;
  showContent = 'Comments';
  rowTimeSize = 3;
  rowCommSize = 1;

  constructor(private searcher: SearchService, private chartService: ChartService,
    private snackbar: MdcSnackbar, private dataService: DataService, private ngZone: NgZone) {
  }

  ngOnInit() {
    document.getElementById('sFimg').style.display = 'none'; // Spinner OFF default
    this.setVisibilityofViews();
  }

  resetFilters() {
    if (this.idsForChild && this.idsForChild.length > 0) {
      this.chartService.reloadForResetFilters();
    }
  }

  submitQuickSearch(value: string) {
    if (value) {
      // console.log('SEARCH UWAHHHHH !!!!!: ', value);
      // Entered submitSearch in nav comp
      document.getElementById('sFtext').style.display = 'none';       // Remove any alert
      document.getElementById('sFimg').style.display = 'block';       // Spinner ON

      this.searchMatchList = [];
      this.isSearching = true;
      this.searcher.quickSearchFromDb(value.trim()).then((results) => {
        document.getElementById('sFimg').style.display = 'none';      // Spinner OFF
        // console.log('I GOT A RESULT: ', results.body);
        if (results.body && results.body.length === 0) {
          document.getElementById('sFtext').style.display = 'block';  // Display alert
        }
        // console.log('respond from quicksearch: ', results.body);

        this.searchMatchList = results.body;
        this.isSearching = false;
      });
    }
  }

  // is called when the user selects a song
  // it checks if the user has already selected the song
  // it also updates the data for all charts via the chartService
  selectSong(index: number, childIndex: number, checkbox) {
    const id = checkbox.target.id;
    // console.log('select song has been triggered with: ', index, '// ', childIndex, '// ', checkbox);

    if (id === 'checkbox_' + index) {
      const versionIDs: string[] = [];
      this.searchMatchList[index].versions.forEach(version => {
        versionIDs.push(version.id);
      });

      if (checkbox.target.checked) {
        const confirmAdd = confirm('You are adding a group of videos to your workspace. It can take more time than loading single videos.');
        if (confirmAdd) {
          if (this.loadedItems && this.loadedItems.length === 8) {
                const snackBar = this.snackbar.show('You can only pick 8 items', 'OK', this.config);
                return;
          } else {
            // console.log('group added?');
            this.chartService.setSpinner(true);
            this.searcher.songDetailsFromDb(versionIDs).then((results) => {
              // console.log('does anything happen with the result? :', results);
              this.loadedItems.push(results.body[0]);
              this.matchForAdditionalInfo.push(this.searchMatchList[index]);
              this.labelsForChips.push({title: this.matchForAdditionalInfo[this.matchForAdditionalInfo.length - 1].title + ' - '
              + this.matchForAdditionalInfo[this.matchForAdditionalInfo.length - 1].artist, isGroup: true});
              this.chartService.SetData(this.loadedItems,  this.matchForAdditionalInfo);
              this.createIDarray();
              this.requestTopics();
              this.createTotalComments();
              // this.dataService.setVideoIds(this.loadedItems);
            });
          }
        } else {
          // cancel insertion of group
          const elm: HTMLElement = document.getElementById(id) as HTMLElement;
          if (elm) { elm.click(); }
        }
      } else {
        this.makeTheRemoval(versionIDs, index, childIndex);
        this.createIDarray();
      }
    } else if (id === 'subcheckbox_' + childIndex) {
      const versionID: string[] = [];
      versionID.push(this.searchMatchList[index].versions[childIndex].id);
      // console.log('UWAHHHHH: ', this.searchMatchList[index].versions[childIndex].id);

      if (checkbox.target.checked) {
        if (this.loadedItems && this.loadedItems.length === 8) {
              const snackBar = this.snackbar.show('You can only pick 8 items', 'OK', this.config);
              return;
        } else {
          this.chartService.setSpinner(true);
          // console.log('add only me: ', versionID);
          this.searcher.songDetailsFromDb(versionID).then((results) => {
            this.loadedItems.push(results.body);
            this.matchForAdditionalInfo.push(this.searchMatchList[index].versions[childIndex]);
            // console.log('mimi: ', this.searchMatchList[index].artist);


            this.matchForAdditionalInfo[this.matchForAdditionalInfo.length - 1].artist = this.searchMatchList[index].artist;


            this.labelsForChips.push({title: this.matchForAdditionalInfo[this.matchForAdditionalInfo.length - 1].snippet.title,
              isGroup: false, id: versionID[0]});
              this.chartService.SetData(this.loadedItems, this.matchForAdditionalInfo);
              this.createIDarray();
              this.requestTopics();
          });
        }
      } else {
        this.makeTheRemoval(versionID, index, childIndex);
        this.createIDarray();
        this.requestTopics();
      }
    }
  }

  // für die SEARCH LIST
  makeTheRemoval(versionIDs, idx, childIndex) {
    if (childIndex === null) { // is group
      // console.log('group');
      this.loadedItems.forEach((item, index) => {
        if (item.videoIds !== undefined) {
          if (item.videoIds[0] === versionIDs[0]) {
            this.loadedItems.splice(index, 1);
            this.matchForAdditionalInfo.splice(index, 1);
            this.labelsForChips.splice(index, 1);
            this.chartService.SetData(this.loadedItems, this.matchForAdditionalInfo);
          }
        }
      });
    } else {
      // console.log('single');
        this.loadedItems.forEach((item, index) => {
          if (item.videoIds === undefined) {
            if (item[0].videoIds[0] === versionIDs[0]) {
              this.loadedItems.splice(index, 1);
              this.matchForAdditionalInfo.splice(index, 1);
              this.labelsForChips.splice(index, 1);
              this.chartService.SetData(this.loadedItems, this.matchForAdditionalInfo);
            }
          }
        });
    }
  }

  // removes a song, which was already selected
  // für die chips!!!
  // das hakal von der checkbox in der suchleiste muss auch entfernt werden!!!
  removeSelectedSong(element, index) {
    this.loadedItems.splice(index, 1);
    this.labelsForChips.splice(index, 1);
    this.matchForAdditionalInfo.splice(index, 1);
    this.chartService.SetData(this.loadedItems, this.matchForAdditionalInfo);

    if (element.isGroup) {
      const tmp_element = this.searchMatchList[index];
      this.searchMatchList.splice(index, 1);
      setTimeout(() => {
        this.searchMatchList.splice(index, 0, tmp_element);
      }, 100);

    } else {
      this.searchMatchList.forEach((e, idx) => {
        e.versions.forEach((v, i) => {
          if (v.id === element.id) {
            const tmp_element = this.searchMatchList[idx].versions[i];
            this.searchMatchList[idx].versions.splice(i, 1);
            setTimeout(() => {
              this.searchMatchList[idx].versions.splice(i, 0, tmp_element);
            }, 100);
          }
        });
      });
    }
    this.createIDarray();
    this.requestTopics();
  }

  toggleAccordion(index, event) {
    const element = document.getElementById('accordion_' + index);
    const panel = document.getElementById('panel_' + index);
    const img = document.getElementById('img_' + index);

    if (panel.style.maxHeight) {
      panel.style.maxHeight = null;
      (img as HTMLImageElement).src = '../../assets/chevron_down.svg';
    } else {
      panel.style.maxHeight = panel.scrollHeight + 'px';
      (img as HTMLImageElement).src = '../../assets/chevron_up.svg'; // set attribute
    }
  }

  createIDarray() {
    this.idsForChild = [];
    if (this.loadedItems !== undefined) {
      this.loadedItems.forEach(l => {
        if (l.videoIds !== undefined) {
          l.videoIds.forEach(i => {
            this.idsForChild.push(i);
          });
        } else {
          l[0].videoIds.forEach(i => {
            this.idsForChild.push(i);
          });
        }
      });
    }
  }

  createTotalComments() {
    this.searchMatchList.forEach( e => {
      e.versions.forEach( v => {
        const num = +v.statistics.commentCount;
        this.totalCommentsForChild = this.totalCommentsForChild + num;
      });
    });
  }

  setOpen() {
    this.openDrawer = !this.openDrawer;
  }

  changeFocus() {
    const elm: HTMLElement = document.getElementById('main_buttonAdd') as HTMLElement;
    if (elm && this.openDrawer) { elm.click(); }
  }

  shortValues(value) {
    const count = this.digits_count(value);

    if (count >= 13) {
      value = Math.round(value / Math.pow(10, 12)); value = value + 't';
    } else if (count >= 10) {
      value = Math.round(value / Math.pow(10, 9)); value = value + 'B';
    } else if (count >= 7) {
      value = Math.round(value / Math.pow(10, 6)); value = value + 'M';
    } else if (count >= 4) {
      value = Math.round(value / Math.pow(10, 3)); value = value + 'K';
    }

    return value;
  }

  digits_count(n) {
    let count = 0;
    if (n >= 1) { ++count; }
    while (n / 10 >= 1) { n /= 10; ++count; }
    return count;
  }

  requestTopics() {
    this.searcher.songTopicsFromDb(this.idsForChild).then((topicRes) => {
      this.chartService.SetDataTopics(topicRes.body);
    });
  }

  switchView(op: string) {
    if (op !== this.showContent) {
      switch (op) {
        case 'Comments':
          this.showContent = 'Comments';
          break;
        case 'Engagement':
          this.showContent = 'Engagement';
          break;
        case 'Language':
          this.showContent = 'Language';
          break;
        case 'Sentiment':
          this.showContent = 'Sentiment';
          break;
      }
      this.setVisibilityofViews();
    }
  }

  setVisibilityofViews() {
    document.getElementById('overview_Comments').classList.add('hide');
    document.getElementById('overview_Engagement').classList.add('hide');
    document.getElementById('overview_Language').classList.add('hide');
    document.getElementById('overview_Sentiment').classList.add('hide');
    document.getElementById('overview_' + this.showContent).classList.remove('hide');

    document.getElementById('timeView_Comments').classList.add('hide');
    document.getElementById('timeView_Engagement').classList.add('hide');
    document.getElementById('timeView_Language').classList.add('hide');
    document.getElementById('timeView_Sentiment').classList.add('hide');
    document.getElementById('timeView_' + this.showContent).classList.remove('hide');
  }

  toggleComments() {
    const elm: HTMLElement = document.getElementById('commentsCard') as HTMLElement;

    this.ngZone.run(() => {
      if (this.rowCommSize === 1) {
        this.rowCommSize = 3;
        this.rowTimeSize = 1;
        if (elm) { elm.style.overflowY = 'overlay'; }
      } else {
        this.rowCommSize = 1;
        this.rowTimeSize = 3;
        if (elm) { elm.scrollTo(0, 0); elm.style.overflowY = 'hidden'; }
      }
    });
  }
}

