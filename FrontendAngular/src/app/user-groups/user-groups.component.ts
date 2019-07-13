import { Component, OnInit } from '@angular/core';
import { SessionStorageService } from 'angular-web-storage';
import { FormGroup, FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-user-groups',
  templateUrl: './user-groups.component.html',
  styleUrls: ['./user-groups.component.scss']
})
export class UserGroupsComponent implements OnInit {

  userGroupForm: FormGroup;
  activatedForm: number = 0;

  constructor(
    private sessionService: SessionStorageService,
    private formBuilder: FormBuilder) { }

  ngOnInit() {
    
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

  CreateGroup(){

  }

  initializeGroupForm(){
    this.userGroupForm = this.formBuilder.group({
      username: [''],
      email: [''],
      address: [''],
      contact: ['']
    });
  }
}
