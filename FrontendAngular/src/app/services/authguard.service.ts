import { Injectable } from '@angular/core';
import { CanActivate, Router } from "@angular/router";
import { LoginService } from './login.service';



@Injectable({
  providedIn: 'root'
})
export class AuthguardService implements CanActivate {

  constructor(
    private loginService: LoginService,
    private router: Router) { }

  canActivate(): boolean {
  
    if (this.loginService.isUserLoggedIn()) {
      return true
    }

    this.router.navigate(['/']);
    return false
  }

}
