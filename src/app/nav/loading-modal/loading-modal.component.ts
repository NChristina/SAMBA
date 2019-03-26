import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-modal',
  templateUrl: './loading-modal.component.html',
  styleUrls: ['./loading-modal.component.scss'],
})
export class LoadingModalComponent {
display = 'none';


  constructor() {
  let modal = document.getElementById('myModal');
  let btn = document.getElementById('myBtn');
  let span = document.getElementsByClassName('close')[0];
   }

  // btnClick(){
  //   modal.style.display = 'block';
  // }
  // spanClick(){
  //   modal.style.display = 'none';
  // };
  open() {
    this.display = 'block';
  }
close() {
    this.display = 'none';
  }

  // btn.onclick = function() {
//   modal.style.display = "block";
  // }

  // When the user clicks on <span> (x), close the modal
  // span.onclick = function() {
  //   modal.style.display = "none";
  // }

  // window.onclick = function(event) {
  //   if(event.target === modal) {
  //     modal.style.display = 'none';
  //   }
  // };


}
