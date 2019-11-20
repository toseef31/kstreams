import { Component, OnInit } from '@angular/core';
import { ScrollService } from '../services/scrollService';
import { Router } from '@angular/router';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {

  constructor(private scrollService: ScrollService, private router: Router) { }

  ngOnInit() {
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
  // =============================================================================================

}
