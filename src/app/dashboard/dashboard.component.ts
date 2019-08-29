import { Component, OnInit, OnDestroy } from '@angular/core';
import { LocalStorageService, SessionStorageService } from 'angular-web-storage'
import { Router } from '@angular/router';
import { LoginService } from '../services/login.service';
import { Observable, Subscription } from 'rxjs';
import { BackendApiService } from '../services/backend-api.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {

  getUsersSubscription: Subscription;
  getGroupsSubscription: Subscription;

  usersList = [];
  inActiveUsersLength: number= 0;
  totalUsers: number= 0;
  totalGroups: number = 0;
  loggedUserId: number = 0;

  constructor(
    private sessionService: SessionStorageService,
    private router: Router,
    private loginService: LoginService,
    private backendAPI: BackendApiService
  ) { }

  ngOnInit() {
    this.loggedUserId = this.sessionService.get('user_session_data').id;

    if (this.router.url == this.loginService.getCurrentUrl()) {
      this.router.navigate([this.loginService.getCurrentUrl()]);
    }

    this.backendAPI.getUsersRequest(this.loggedUserId);
    this.getGroupsSubscription = this.getUsersSubscription = this.backendAPI.updateUserList.subscribe(
      (backendResponse: any) => {
    
        this.usersList = backendResponse;
        this.totalUsers = this.usersList.length;
       
        for (let i= 0; i < this.totalUsers; i++){
            if (this.usersList[i].status == 2)
                 this.inActiveUsersLength++;
        }

      }
    )

    this.backendAPI.getGroups();
    this.backendAPI.getGroupsList.subscribe(
      (groupsList: any)=>{
       this.totalGroups = groupsList.length;
      });
  }

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    if (!this.loginService.isUserLoggedIn()) {
      return true;
    }
    else {
      this.router.navigate([this.loginService.getCurrentUrl()]);
      return false;
    }
  }

  ngOnDestroy(){
    this.getUsersSubscription.unsubscribe();
    this.getGroupsSubscription.unsubscribe();
  }

}
