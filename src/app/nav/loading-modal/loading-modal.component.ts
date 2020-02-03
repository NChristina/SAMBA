import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-modal',
  templateUrl: './loading-modal.component.html',
  styleUrls: ['./loading-modal.component.scss'],
})
export class LoadingModalComponent {
display = 'none';


  constructor() {
  const modal = document.getElementById('myModal');
  const btn = document.getElementById('myBtn');
  // let span = document.getElementsByClassName('close')[0];
   }
  open() {
      this.display = 'block';
    }
  // close() {
  //     this.display = 'none';
  //   }

}
