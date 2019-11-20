import { Injectable } from '@angular/core';

import { ScrollToService, ScrollToConfigOptions } from '@nicky-lenaers/ngx-scroll-to';


@Injectable()
export class ScrollService {

    constructor(
        private _scrollToService: ScrollToService
    ) { }

    public triggerScrollToIntro() {
      const config: ScrollToConfigOptions = {
          target: 'intro'
      } 
      this._scrollToService.scrollTo(config);
    }

    public triggerScrollToService() {
        const config: ScrollToConfigOptions = {
            target: 'services'
        };

        this._scrollToService.scrollTo(config);
    }


    public triggerScrollToAbout() {
        const config: ScrollToConfigOptions = {
            target: 'about'
        };

        this._scrollToService.scrollTo(config);
    }

    public triggerScrollToPortfolio() {
        const config: ScrollToConfigOptions = {
            target: 'portfolio'
        };

        this._scrollToService.scrollTo(config);
    }

    public triggerScrollToTeam() {
        const config: ScrollToConfigOptions = {
            target: 'team'
        };

        this._scrollToService.scrollTo(config);
    }

    public triggerScrollToFooter() {
        const config: ScrollToConfigOptions = {
            target: 'footer'
        }

        this._scrollToService.scrollTo(config);
    };

    public triggerScrollToPackages(){
        const config: ScrollToConfigOptions = {
            target: 'pricing'
        }
        this._scrollToService.scrollTo(config);
    }
}