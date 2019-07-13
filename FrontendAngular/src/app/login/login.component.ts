import { CanDeactivate } from '@angular/router';
import { BackendApiService } from './../services/backend-api.service';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionStorageService } from 'angular-web-storage';
import { LoginService } from '../services/login.service';
import { DomSanitizer, SafeResourceUrl, SafeUrl} from '@angular/platform-browser';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit {

  loginform: FormGroup;
  forgetPasswordForm: FormGroup;

  formTitle: string = "Admin Login";
  formMessage: string = "";
  activatedForm: number = 1;  // *[0: NoForm **** 1: LoginForm **** 2: ForgetPasswordForm]
  userLoggedIn: boolean = false;
  userImage: any;

  constructor(
    private backendApi: BackendApiService,
    private router: Router,
    private sessionService: SessionStorageService,
    private loginService: LoginService,
    private sanitizer: DomSanitizer
  ) {

    if (this.loginService.isUserLoggedIn()) {
      this.router.navigate([this.loginService.getCurrentUrl()]);
    }
  }

  ngOnInit() {
    this.userLoggedIn = this.loginService.isUserLoggedIn();
    this.activatedForm = 1; // set LoginForm as DefaultForm
    this.initializeFormGroup();

    // this.backendApi.ImageApiRequest().then(
    //   (res)=>{
    //      this.userImage = res;
    //   }
    // );
  }

  onLogin() {
    const email = this.loginform.get('email').value;
    const password = this.loginform.get('password').value;

    this.backendApi.loginApiRequest({ 'email': email, 'password': password }).then(
      (loginResponse: any) => {
        if (loginResponse.isUserExist) {

          let TYPED_ARRAY = new Uint8Array(loginResponse.imageFile);
          const STRING_CHAR = String.fromCharCode.apply(null, TYPED_ARRAY);
          let base64String = btoa(STRING_CHAR);
          this.userImage = this.sanitizer.bypassSecurityTrustResourceUrl('data:image/jpg;base64,'+ base64String);
        
          this.sessionService.set('user_session_data', loginResponse.data);

         this.loginService.setUserImage(this.userImage);
         this.loginService.setUserLoggedIn(true);
         this.loginService.setCurrentUrl('/dashboard');
         this.router.navigate(['/dashboard']);
        }
        else {
          this.formMessage = loginResponse.message;
          setTimeout(() => {
            this.formMessage = "";
          }, 2000);
        }
      }
    )
  }

  onForget() {

  }

  formActivation() {
    if (this.activatedForm == 1)
      this.activatedForm = 2;
    else if (this.activatedForm == 2)
      this.activatedForm = 1;
  }

  initializeFormGroup() {
    this.loginform = new FormGroup({
      'email': new FormControl(null, [Validators.required, Validators.email]),
      'password': new FormControl(null, Validators.required)
    })

    this.forgetPasswordForm = new FormGroup({
      'newpassword': new FormControl(null, Validators.required),
      'repeatpassword': new FormControl(null, Validators.required)
    })
  }

}
