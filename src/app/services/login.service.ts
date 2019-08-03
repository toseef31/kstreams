import { Injectable } from '@angular/core';
import { SessionStorageService, LocalStorageService } from 'angular-web-storage';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  userImage: any;

  constructor(private sessionService: SessionStorageService, private localStorageService: LocalStorageService) { }

  setUserLoggedIn(loggedInStatus) {
    this.sessionService.set("userLoggedIn", loggedInStatus);
  }
  isUserLoggedIn() {
    return this.sessionService.get("userLoggedIn");
  }

  setCurrentUrl(url) {
    this.sessionService.set("ActiveUrl", url);
  }
  getCurrentUrl() {
    return  this.sessionService.get("ActiveUrl");
  }

  setUserImage(image: any){
     this.userImage = image;
  }

  getUserImage(){
    return this.userImage;
  }
}
