import { DomSanitizer } from '@angular/platform-browser';
import { BackendApiService } from './../../services/backend-api.service';
import { Component, OnInit } from '@angular/core';
import { SessionStorageService } from 'angular-web-storage';
import { Router } from '@angular/router';
import { LoginService } from '../../services/login.service';

declare interface RouteInfo {
  path: string;
  title: string;
  icon: string;
  class: string;
}
export const ROUTES: RouteInfo[] = [
  { path: '/dashboard', title: 'Dashboard', icon: 'design_app', class: '' },
  //{ path: '/user-profile', title: 'Add Users', icon: 'users_single-02', class: '' },
  { path: '/user-list', title: 'Users', icon: 'design_bullet-list-67', class: '' },
  { path: '/user-groups', title: 'Groups', icon: 'design_bullet-list-67', class: '' },
  // { path: '/dashboard', title: 'Dashboard',  icon: 'design_app', class: '' },
  // { path: '/icons', title: 'Icons', icon: 'education_atom', class: '' },
  // { path: '/maps', title: 'Maps',  icon:'location_map-big', class: '' },
  // { path: '/notifications', title: 'Notifications',  icon:'ui-1_bell-53', class: '' },

  // { path: '/user-profile', title: 'User Profile',  icon:'users_single-02', class: '' },
  // { path: '/table-list', title: 'Table List',  icon:'design_bullet-list-67', class: '' },
  // { path: '/typography', title: 'Typography',  icon:'text_caps-small', class: '' },
  // { path: '/upgrade', title: 'Upgrade to PRO',  icon:'objects_spaceship', class: 'active active-pro' }
];

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

  menuItems: any[];
  username: string = '';
  userImage: any;

  constructor(private sessionService: SessionStorageService,
    private router: Router,
    private loginService: LoginService,
    private backendService: BackendApiService,
    private sanitizer: DomSanitizer) {
  }

  ngOnInit() {
    this.menuItems = ROUTES.filter(menuItem => menuItem);

    this.username = this.sessionService.get('user_session_data').username;

    // this.backendService.getLoggedInUserRequest(this.sessionService.get('user_session_data').email).then(
    //   (backendResponse: any) => {
     
    //     let TYPED_ARRAY = new Uint8Array(backendResponse.imageFile.data);
    //     const STRING_CHAR = String.fromCharCode.apply(null, TYPED_ARRAY);
    //     let base64String = btoa(STRING_CHAR);
    //     this.userImage = this.sanitizer.bypassSecurityTrustResourceUrl('data:image/jpg;base64,'+ base64String);
        
    //     this.loginService.setUserImage(this.userImage);
    //   });
  }

  isMobileMenu() {
    if (window.innerWidth > 991) {
      return false;
    }
    return true;
  };

  onSelection(index: number) {
   // console.log(index);

    if (index == 0) {
      this.loginService.setCurrentUrl('/dashboard');
      this.router.navigate(['/dashboard']);
    }
    // else if (index == 1) {
    //   this.loginService.setCurrentUrl('/user-profile');
    //   this.router.navigate(['/user-profile']);
    // }
    else if (index == 1) {
      this.loginService.setCurrentUrl('/table-list');
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

  userImageUpload() {

  }

}
