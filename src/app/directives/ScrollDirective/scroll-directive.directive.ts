import { EventEmitter } from "@angular/core";
import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[appScrollDirective]',
})

export class ScrollDirectiveDirective {

  public scrollTopBtnStatus = new EventEmitter<boolean>();
  scrollTopBtn: boolean = false;

  constructor() { }

  @HostListener('window:scroll') onScrollEvent(event: Event) {

    var enableYPos = document.body.offsetHeight - (document.body.offsetHeight / 1.11);

    if (window.scrollY >= enableYPos) {
      this.scrollTopBtn = true;
      this.scrollTopBtnStatus.emit(this.scrollTopBtn);
    }
    else {
      if (this.scrollTopBtn) {
        this.scrollTopBtn = false;
        this.scrollTopBtnStatus.emit(this.scrollTopBtn);
      }
    }
  }

} // **** Class Ends *****
