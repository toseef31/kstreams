import { ScrollService } from './../services/scrollService';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  mobileMenuStatus: boolean = false;

  constructor(private scrollService: ScrollService, private router: Router) { }

  ngOnInit() {
  }

  mobileMenuActivate() {
    this.mobileMenuStatus = !this.mobileMenuStatus;
  }

  changeRoute(scrollDestinationVal) {
    this.router.navigate(['/']);

    // 0 -> Scroll to Intro Page
    // 1 -> Scroll to About Page
    // 2 -> Scroll to Service Page
    // 3 -> Scroll to Packages Page
    setTimeout(() => {
      if (scrollDestinationVal == 0)
        this.scrollService.triggerScrollToIntro();

      else if (scrollDestinationVal == 1)
        this.scrollService.triggerScrollToAbout();

      else if (scrollDestinationVal == 2)
        this.scrollService.triggerScrollToService();

      else if (scrollDestinationVal == 3)
        this.scrollService.triggerScrollToPackages();

      else if (scrollDestinationVal == 4)
        this.scrollService.triggerScrollToFooter();

    }, 150);
  }


  // ================== FUNCTIONS CALLING [SCROLL SERVICE] ========================================
  scrollToIntro() {
    this.scrollService.triggerScrollToIntro();
  }

  scrollToAbout() {
    this.scrollService.triggerScrollToAbout();
  }

  scrollToService() {
    this.scrollService.triggerScrollToService();
  }

  scrollToFooter() {
    this.scrollService.triggerScrollToFooter();
  }

  scrollToPackages() {
    this.scrollService.triggerScrollToPackages();
  }

  // scrollToPortfolio() {
  //   this.scrollService.triggerScrollToPortfolio();
  // }

  // scrollToTeam() {
  //   this.scrollService.triggerScrollToTeam();
  // }



  // =============================================================================================
}
