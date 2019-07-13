import { Component, OnInit } from '@angular/core';
import { LocalStorageService } from 'angular-web-storage'
import { Router } from '@angular/router';
import { LoginService } from '../services/login.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  constructor(
    private localStorageService: LocalStorageService,
    private router: Router,
    private loginService: LoginService
  ) { }

  ngOnInit() {
    if (this.router.url == this.loginService.getCurrentUrl()) {
      this.router.navigate([this.loginService.getCurrentUrl()]);
    }
  }

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    console.log(this.loginService.getCurrentUrl());
   
    // if (this.loginService.getCurrentUrl() != ""){
    //   this.router.navigate(['/dashboard']);
    //   return false;
    // }
    

    if (!this.loginService.isUserLoggedIn()) {
      return true;
    }
    else {
      this.router.navigate([this.loginService.getCurrentUrl()]);
      return false;
    }
  }
}
