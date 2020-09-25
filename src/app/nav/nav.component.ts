import { Component, OnInit, ElementRef, ViewChild, NgZone} from '@angular/core';
import { SearchService } from './services/search.service';
import { MdcSnackbar, MdcSnackbarConfig } from '@angular-mdc/web';
import { ChartService } from './dashboard/services/chart.service';
import { DataService } from './services/data.service';
import { MatDialog, MatDialogConfig} from '@angular/material';
import { HelpComponent } from '../help/help.component';
import {SliderComponent} from '../../../node_modules/ng5-slider/slider.component';
import {Options, LabelType} from 'ng5-slider';
import * as d3 from 'd3';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})

export class NavComponent implements OnInit {
  config: MdcSnackbarConfig = { align: 'top'};
  searchMatchList: any[] = [];
  matchForAdditionalInfo = [];
  idsForChild = [];
  loadedItems = [];
  labelsForChips = [];
  isSearching = false;
  openDrawer = false;
  totalCommentsForChild = 0;
  showContent = 'Comments';
  rowTimeSize = 3;
  rowCommSize = 1;
  protected minValue: number;
  protected maxValue: number;
  protected options: Options;
  chartRange1;
  chartRange2;
  oldChartRange1;
  oldChartRange2;
  oldTopicRes: any;
  data: any[];
  filterTopic = false;

  constructor(private searcher: SearchService, private chartService: ChartService, private dialog: MatDialog,
    private snackbar: MdcSnackbar, private dataService: DataService, private ngZone: NgZone) {
  }

  ngOnInit() {
    document.getElementById('sFimg').style.display = 'none'; // Spinner OFF default
    this.setVisibilityofViews();

    // Hardfacts component tells which item to remove
    this.chartService.GetItemRemoval().subscribe(element => {
      if (element && element.length > 0) { this.removeSelectedSong(element); }
    });

    // Gets data for controls
    this.chartService.GetData().subscribe(data => {
      if (data) {
        this.data = data;
        this.chartRange1 = d3.min(this.data, (d: any) => new Date(d.publishedAt));
        this.chartRange2 = d3.max(this.data, (d: any) => new Date(d.publishedAt));
        this.setSliderValues();
      }
    });
  }

  requestTopics() {
    this.filterTopic = false;
    this.oldChartRange1 = this.chartRange1;
    this.oldChartRange2 = this.chartRange2;

    this.searcher.songTopicsFromDb(this.idsForChild, this.chartRange1, this.chartRange2).then((topicRes) => {
      this.oldTopicRes = topicRes.body;
      this.chartService.SetDataTopics(topicRes.body);
    });
  }

  filterTopicTime() {
    this.filterTopic = false;
    this.chartService.SetTopicsRequested(true);
    this.searcher.songTopicsFromDb(this.idsForChild, this.chartRange1, this.chartRange2).then((topicRes) => {
      this.chartService.SetDataTopics(topicRes.body);
    });
  }

  restoreTopicBackup() {
    this.chartService.SetDataTopics(this.oldTopicRes);
  }

  // Search Accordion /////////////////////////////////////////////////////////////////////////////////////////////////

  toggleAccordion(index, event) {
    const element = document.getElementById('accordion_' + index);
    const panel = document.getElementById('panel_' + index);
    const img = document.getElementById('img_' + index);

    if (panel.style.maxHeight) {
      panel.style.maxHeight = null;
      (img as HTMLImageElement).src = '../../assets/chevron_down.svg';
    } else {
      panel.style.maxHeight = panel.scrollHeight + 'px';
      (img as HTMLImageElement).src = '../../assets/chevron_up.svg';
    }
  }

  setOpen() {
    this.openDrawer = !this.openDrawer;
  }

  changeFocus() {
    const elm: HTMLElement = document.getElementById('main_buttonAdd') as HTMLElement;
    if (elm && this.openDrawer) { elm.click(); }
  }

  // Search ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  submitQuickSearch(value: string) {
    if (value) {
      document.getElementById('sFtext').style.display = 'none';       // Remove any alert
      document.getElementById('sFimg').style.display = 'block';       // Spinner ON

      this.searchMatchList = [];
      this.isSearching = true;
      this.searcher.quickSearchFromDb(value.trim()).then((results) => {
        document.getElementById('sFimg').style.display = 'none';      // Spinner OFF
        if (results.body && results.body.length === 0) {
          document.getElementById('sFtext').style.display = 'block';  // Display alert
        }

        this.searchMatchList = results.body;
        this.isSearching = false;
      });
    }
  }

  // Bild Search Results //////////////////////////////////////////////////////////////////////////////////////////////

  createTotalComments() {
    this.searchMatchList.forEach( e => {
      e.versions.forEach( v => {
        const num = +v.statistics.commentCount;
        this.totalCommentsForChild = this.totalCommentsForChild + num;
      });
    });
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

  // Selection and Removal of Videos //////////////////////////////////////////////////////////////////////////////////

  triggerSelection(x: number, y: number) {
    const checkbox = document.getElementById('panel_' + x).getElementsByClassName('slc' + x + '_' + y)[0] as HTMLInputElement;
    if (checkbox) { checkbox.click(); }
  }

  // is called when the user selects a song
  // it checks if the user has already selected the song
  // it also updates the data for all charts via the chartService
  selectSong(index: number, childIndex: number, checkbox) {
    const id = checkbox.target.id;

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
            this.chartService.setSpinner(true);
            this.searcher.songDetailsFromDb(versionIDs).then((results) => {
              this.loadedItems.push(results.body[0]);
              this.matchForAdditionalInfo.push(this.searchMatchList[index]);
              this.labelsForChips.push({title: this.matchForAdditionalInfo[this.matchForAdditionalInfo.length - 1].title + ' - '
              + this.matchForAdditionalInfo[this.matchForAdditionalInfo.length - 1].artist, isGroup: true});
              this.chartService.SetData(this.loadedItems,  this.matchForAdditionalInfo);
              this.createIDarray();
              this.requestTopics();
              this.createTotalComments();
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
      if (checkbox.target.checked) {
        if (this.loadedItems && this.loadedItems.length === 8) {
              const snackBar = this.snackbar.show('You can only pick 8 items', 'OK', this.config);
              return;
        } else {
          this.chartService.setSpinner(true);

          this.searcher.songDetailsFromDb(versionID).then((results) => {
            this.loadedItems.push(results.body);
            this.matchForAdditionalInfo.push(this.searchMatchList[index].versions[childIndex]);
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

  createIDarray() {
    this.idsForChild = [];
    if (this.loadedItems !== undefined) {
      this.loadedItems.forEach(l => {
        if (l.videoIds !== undefined) {
          l.videoIds.forEach(i => { this.idsForChild.push(i); });
        } else {
          l[0].videoIds.forEach(i => { this.idsForChild.push(i); });
        }
      });
    }
  }

  // Dashboard Controls ///////////////////////////////////////////////////////////////////////////////////////////////

  // Triggered from Hardfacts, removes a song from the list
  removeSelectedSong(elementData) {
    const element = elementData[0];
    const index = this.getIndex(element.title, element.id, element.isGroup);

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

  // Auxiliary funcion: gets index from item in labelsForChips to delete
  getIndex(title: any, id: any, group: any) {
    let elmIndex = 0;
    this.labelsForChips.forEach(function (chip, i) {
      if (group === true) {
        if (chip.isGroup === group && chip.title === title.toString()) { elmIndex = i; }
      } else {
        if (chip.isGroup === group && chip.id === id) { elmIndex = i; }
      }
    });
    return elmIndex;
  }

  // Slider methods: sets the additional values for the slider
  setSliderValues() {
    if (this.data && this.data.length < 1) { return; }
    const dates = d3.nest().key((d: any) => d.publishedAt.split('T')[0]).entries(this.data);
    dates.sort((a, b) => new Date(a.key) < new Date(b.key) ? -1 : 1);
    if (dates.length < 1) { return; }
    this.maxValue = new Date(dates[dates.length - 1].key).getTime();
    this.minValue = new Date(dates[0].key).getTime();
    this.options = {
      floor: new Date(dates[0].key).getTime(),
      translate: (value: number, label: LabelType): string => new Date(value).toDateString()
    };
  }

  setMinRangeValue(value) {
    const date = new Date(value);
    this.chartRange1 = date;
    this.chartService.setChartRange({range: [this.chartRange1, this.chartRange2], chart: null});
    if (this.oldChartRange1 !== this.chartRange1) { this.filterTopic = true; }
  }

  setMaxRangeValue(value) {
    const date = new Date(value);
    this.chartRange2 = date;
    if (this.oldChartRange2 !== this.chartRange2) { this.filterTopic = true; }
  }

  resetFilters() {
    if (this.idsForChild && this.idsForChild.length > 0) {
      this.chartService.reloadForResetFilters();
      this.restoreTopicBackup();
      this.filterTopic = false;
    }
  }

  reduceString(value: String) {
    if (value.length > 20) {
      value = value.substring(0, 17);
      value = value + '...';
    }

    return value;
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
    const commCard: HTMLElement = document.getElementById('commentsCard') as HTMLElement;
    const timeCard: HTMLElement = document.getElementById('timeCard') as HTMLElement;

    this.ngZone.run(() => {
      if (this.rowCommSize === 1) {
        this.rowCommSize = 3;
        this.rowTimeSize = 1;
        if (commCard) { commCard.style.overflowY = 'overlay'; }
        if (timeCard) { timeCard.scrollTo(0, 0); timeCard.style.overflowY = 'hidden'; }
        this.chartService.SetChartMode('small');
      } else {
        this.rowCommSize = 1;
        this.rowTimeSize = 3;
        if (timeCard) { timeCard.style.overflowY = 'overlay'; }
        if (commCard) { commCard.scrollTo(0, 0); commCard.style.overflowY = 'hidden'; }
        this.chartService.SetChartMode('big');
      }
    });
  }

  openDialog() {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = false;

    const dialogRef = this.dialog.open(HelpComponent,
      {data: { },
      width: '900px',
      disableClose: true,
      autoFocus: false
    });
  }
}

