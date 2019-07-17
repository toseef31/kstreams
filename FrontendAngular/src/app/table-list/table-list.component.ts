import { SessionStorageService } from 'angular-web-storage';
import { Component, OnInit, ElementRef, OnDestroy } from '@angular/core';
import { LoginService } from '../services/login.service';
import { Router } from '@angular/router';
import { ROUTES } from '../components/sidebar/sidebar.component';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { BackendApiService } from '../services/backend-api.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-table-list',
  templateUrl: './table-list.component.html',
  styleUrls: ['./table-list.component.css']
})
export class TableListComponent implements OnInit, OnDestroy {

  getUsersSubscription : Subscription

  userAddFormGroup: FormGroup;
  userUpdateFormGroup: FormGroup;

  isImageUploaded: boolean = false;
  isCollapsed: boolean = false;
  isPasswordValid: boolean = false;
  passwordMatching: boolean = false;
  passwordMessage: string = '';
  genericMessage: string = '';
  activatedForm: number = 0;

  userImage: File = null;
  imageSrc: string = "";
  userPassword: string = "";
  usersList = [];
  selectedUser: any;
  loggedUserId: number = 0;
  totalUsers: number = 0;

  constructor(
    private loginService: LoginService,
    private router: Router,
    private element: ElementRef,
    private formBuilder: FormBuilder,
    private backendService: BackendApiService,
    private sessionService: SessionStorageService
  ) {
  }

  ngOnInit() {
    this.loggedUserId = this.sessionService.get('user_session_data').id;
    
    this.initializeAddForm();

    if (this.sessionService.get('activatedForm') == null || this.sessionService.get('activatedForm') == "") {
      this.activatedForm = 0;
    }
    else {
      this.activatedForm = parseInt(this.sessionService.get('activatedForm'));
    }

    this.backendService.getUsersRequest(this.loggedUserId);
    this.getUsersSubscription = this.backendService.updateUserList.subscribe(
      (backendResponse: any) => {
        this.usersList = backendResponse;
        this.totalUsers = this.usersList.length;
      }
    )
  }

  formActivation() {
    if (this.activatedForm == 0) {
      this.sessionService.set('activatedForm', 1);
      this.activatedForm = 1;
    }
    else if (this.activatedForm == 1) {
      this.activatedForm = 0;
      this.sessionService.set('activatedForm', 0);
    }
  }

  updateForm(user: any) {
    this.selectedUser = user;
    this.activatedForm = 2;
    this.initializeUpdateForm();
  }
  DeActivateUpdateForm() {
    this.selectedUser = [];
    this.activatedForm = 0;
  }

  AddUser() {
    const username = this.userAddFormGroup.value.username;
    const email = this.userAddFormGroup.value.email;
    const password = this.userAddFormGroup.value.password;
    const country = this.userAddFormGroup.value.country;
    const phone = this.userAddFormGroup.value.phone;

    var tempUserImage;
    if (this.userImage == null) {
      tempUserImage = "";
    }
    else {
      tempUserImage = this.userImage.name;
    }

    const userData = {
      'username': username,
      'email': email,
      'password': password,
      'country': country,
      'phone': phone,
      'user_image': tempUserImage
    };

    // const fdata = new FormData();
    // fdata.append('');

    this.backendService.userAddRequest(userData, this.userImage, this.loggedUserId).then(
      (backendResponse: any) => {
        if (backendResponse.status) {
          this.genericMessage = backendResponse.message;
          this.formReset();
          setTimeout(() => { this.genericMessage = "" }, 2500);
        }
        else {
          this.genericMessage = backendResponse.message;
          setTimeout(() => { this.genericMessage = "" }, 2500);
        }
      });
  }

  UpdateUser() {

    const id = this.selectedUser._id;
    const username = this.userUpdateFormGroup.value.username;
    const email = this.userUpdateFormGroup.value.email;
    const country = this.userUpdateFormGroup.value.country;
    const phone = this.userUpdateFormGroup.value.phone
    const password = this.userUpdateFormGroup.value.password;

    const userData = {
      '_id': id,
      'username': username,
      'email': email,
      'country': country,
      'phone': phone,
      'password': password
    };

    this.backendService.userUpdateRequest(userData, this.loggedUserId).then(
      (backendResponse: any) => {
        if (backendResponse.status) {
          this.genericMessage = backendResponse.message;
          setTimeout(() => { this.genericMessage = "" }, 2500);
        }
        else {
          this.genericMessage = backendResponse.message;
          setTimeout(() => { this.genericMessage = "" }, 2500);
        }
      });
  }

  DeleteUser(userId: number) {
    this.backendService.deleteUserRequest(userId, this.loggedUserId);
  }

  initializeAddForm() {
    this.userAddFormGroup = this.formBuilder.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      country: [''],
      phone: ['']
    })
  }

  initializeUpdateForm() {
    this.userUpdateFormGroup = this.formBuilder.group({
      username: [this.selectedUser.username],
      email: [this.selectedUser.email],
      password: [''],
      country: [this.selectedUser.country],
      phone: [this.selectedUser.phone]
    });
  }

  passwordValidation(element: HTMLInputElement) {
    const passwordLength = element.value.length;
    if (passwordLength < 6) {
      this.passwordMessage = "password minimum length is 6";
      this.isPasswordValid = true;
    }
    else {
      this.passwordMessage = "";
      this.isPasswordValid = false;
    }

    if (passwordLength == 0) {
      this.passwordMessage = "";
      this.isPasswordValid = false;
    }
  }

  userImageUpload(event) {
    this.userImage = <File>event.target.files[0];

    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = e => this.imageSrc = reader.result as string;
      reader.readAsDataURL(file);
      this.isImageUploaded = true;
    }
  }

  formReset() {
    this.userAddFormGroup.reset();
  }

  ngOnDestroy(){
    this.getUsersSubscription.unsubscribe();
  }
}
