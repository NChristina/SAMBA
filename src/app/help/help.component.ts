import { Component, OnInit } from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss']
})
export class HelpComponent implements OnInit {
  showMenu = true;
  showInfo = '';

  constructor(public thisDialogRef: MatDialogRef<HelpComponent>) { }

  ngOnInit() {
  }

  cancelDialog() {
    this.thisDialogRef.close('cancel');
  }

  show(option: string) {
    switch (option) {
      case 'about':
      case 'analytics':
      case 'contact':
      case 'faq':
        this.showMenu = false;
        this.showInfo = option;
        break;
      case 'showMenu':
      default:
        this.showMenu = true;
        this.showInfo = '';
        break;
    }
  }
}
