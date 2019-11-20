import { ScrollDirectiveDirective } from './../directives/ScrollDirective/scroll-directive.directive';
import { SharedVariablesService } from './../services/sharedVariables';
import { Component, OnInit } from '@angular/core';

import { OwlOptions } from 'ngx-owl-carousel-o';
import { ScrollService } from '../services/scrollService';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
 
  // --- Tuple, used in QueryParams in template package's routes ------
  packagePlane1 : [string, number] = ['Basic Plan', 45];
  packagePlane2 : [string, number] = ['Premium Plan', 120];
  packagePlane3 : [string, number] = ['Business Plan', 280];

  moveUpBtnStatus: boolean = false;

  customTestimonialOptions: OwlOptions = {
    loop: false,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: false,
    dots: false,
    navSpeed: 700,
    navText: ['', ''],
    responsive: {
      0: {
        items: 1
      },
    },
    nav: true
  }

  customClientOptions: OwlOptions = {
    loop: false,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: false,
    dots: false,
    navSpeed: 700,
    navText: ['', ''],
    responsive: {
      0: {
        items: 1
      },
      400: {
        items: 2
      },
      700: {
        items: 3
      },
      940: {
        items: 4
      }
    },
    nav: true
  }

  constructor(private scrollService: ScrollService,
    private scrollDirective: ScrollDirectiveDirective) { }

  ngOnInit() {
    this.scrollDirective.scrollTopBtnStatus.subscribe(
      (status: boolean) => {
        this.moveUpBtnStatus = status;
      })
  }

  scrollToIntro() {
    this.scrollService.triggerScrollToIntro();
  }

}
