import { BackendApiService } from './../../services/backend-api.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { SessionStorageService } from 'angular-web-storage';
import { Router } from '@angular/router';
import { LoginService } from '../../services/login.service';
import { DomSanitizer } from '@angular/platform-browser';
import { Subscription } from 'rxjs';

declare interface RouteInfo {
  path: string;
  title: string;
  icon: string;
  class: string;
}
export const ROUTES: RouteInfo[] = [
  { path: '/dashboard', title: 'Dashboard', icon: '', class: '' },
  { path: '/user-list', title: 'Users', icon: '', class: '' },
  { path: '/user-groups', title: 'Groups', icon: '', class: '' }
];

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {

  LoggedUserDataSubscription: Subscription;

  menuItems: any[];
  username: string = '';
  userImage: any;

  constructor(
    private sanitizer: DomSanitizer,
    private sessionService: SessionStorageService,
    private router: Router,
    private loginService: LoginService,
    private backendService: BackendApiService) {
  }

  ngOnInit() {
    this.menuItems = ROUTES.filter(menuItem => menuItem);
    this.username = this.sessionService.get('user_session_data').name;
    this.userImage = this.loginService.getUserImage();

    this.backendService.getLoggedInUserRequest(this.sessionService.get('user_session_data').email);
    this.LoggedUserDataSubscription = this.backendService.refreshLoggedUserData.subscribe(
      (backendResponse: any) => {
   
        if (backendResponse.imageFile != null) {
          // let TYPED_ARRAY = new Uint8Array(backendResponse.imageFile.data);
          // const STRING_CHAR = String.fromCharCode.apply(null, TYPED_ARRAY);
          // let base64String = btoa(STRING_CHAR);
          //this.userImage = this.sanitizer.bypassSecurityTrustResourceUrl('data:image/jpg;base64,' + base64String);
          this.userImage = backendResponse.imageFile;
        }
      }
    );
  }

  isMobileMenu() {
    if (window.innerWidth > 991) {
      return false;
    }
    return true;
  };

  onSelection(index: number) {
    this.sessionService.set('activatedForm', 0);
    
    if (index == 0) {
      this.loginService.setCurrentUrl('/dashboard');
      this.router.navigate(['/dashboard']);
    }
    else if (index == 1) {
      this.loginService.setCurrentUrl('/user-list');
      this.router.navigate(['/user-list']);
    }
    else if (index == 2) {
      this.loginService.setCurrentUrl('/users-groups');
      this.router.navigate(['/users-groups']);
    }
    else if (index == 3) {
      this.loginService.setCurrentUrl('/icons');
      this.router.navigate(['/icons']);
    }
  }

  ngOnDestroy() {
    this.LoggedUserDataSubscription.unsubscribe();
  }
}
