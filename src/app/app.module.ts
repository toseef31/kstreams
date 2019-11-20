import { SharedVariablesService } from './services/sharedVariables';
import { ScrollService } from './services/scrollService';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';

import { ScrollToModule } from '@nicky-lenaers/ngx-scroll-to';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { TermsOfServiceComponent } from './terms-of-service/terms-of-service.component';
import { PackageBuyComponent } from './package-buy/package-buy.component';
import { ScrollDirectiveDirective } from './directives/ScrollDirective/scroll-directive.directive';
import { NgxSpinnerModule } from "ngx-spinner";

const appRoutes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'privacyPolicy', component: PrivacyPolicyComponent },
  { path: 'termsOfUse', component: TermsOfServiceComponent },
  { path: 'packageForm', component: PackageBuyComponent}
]

@NgModule({
  declarations: [
    // Components
    AppComponent,
    HomeComponent,
    HeaderComponent,
    FooterComponent,
    PrivacyPolicyComponent,
    TermsOfServiceComponent,
    PackageBuyComponent,

    // Directives
    ScrollDirectiveDirective,
  ],
  imports: [
    BrowserModule,
    CarouselModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(appRoutes),
    ScrollToModule.forRoot()
  ],

  providers: [ScrollService, SharedVariablesService],
  bootstrap: [AppComponent],
  exports: [RouterModule],

})
export class AppModule { }
