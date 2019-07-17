import { Component, OnInit } from '@angular/core';
import { SessionStorageService } from 'angular-web-storage';
import { FormGroup, FormBuilder } from '@angular/forms';
import { LoginService } from '../services/login.service';
import { BackendApiService } from '../services/backend-api.service';

@Component({
  selector: 'app-user-groups',
  templateUrl: './user-groups.component.html',
  styleUrls: ['./user-groups.component.scss']
})
export class UserGroupsComponent implements OnInit {

  userGroupsForm: FormGroup;

  loggedUserId: number = 0;
  selectedGroupId: number = 0; // may needs value to be reset
  activatedForm: number = 0;
  genericMessage: string = "";
  selectedUser: number = 0;

  groupsList = [];
  usersList = [];
  addedUsersList = [];


  constructor(
    private sessionService: SessionStorageService,
    private formBuilder: FormBuilder,
    private backendAPI: BackendApiService) { }

  ngOnInit() {
    this.initializeGroupForm();
    
    this.loggedUserId = this.sessionService.get('user_session_data').id;

    this.activatedForm = this.sessionService.get('activatedForm');
    if (this.sessionService.get('activatedForm') == null || this.sessionService.get('activatedForm') == "") {
      this.activatedForm = 0;
    }
    else {
      this.activatedForm = parseInt(this.sessionService.get('activatedForm'));
    }
    
    // -------- GETS THE LIST OF GROUPS ---------------------------------
    this.backendAPI.getGroups();
    this.backendAPI.getGroupsList.subscribe(
      (groupsList: any)=>{
      //  console.log(groupsList);
        this.groupsList = groupsList;
      });
   
    this.backendAPI.usersGroupUpdate.subscribe(
      (groupedUsersList: any) => {
        this.usersList = groupedUsersList.remainingUsers;
        this.addedUsersList = groupedUsersList.groupUsers[0].members;
      }
    )
  }

  formActivation() {
    this.addedUsersList = [];
    this.usersList = [];

    if (this.activatedForm == 0) {
      this.sessionService.set('activatedForm', 1);
      this.activatedForm = 1;
    }
    else if (this.activatedForm == 1) {
      this.activatedForm = 0;
      this.sessionService.set('activatedForm', 0);
    }
    else{
      this.activatedForm = 0;
      this.sessionService.set('activatedForm', 0);
    }
  }

  ManageGroupUsers(groupId: number){
    this.activatedForm = 2;
    this.selectedGroupId = groupId;

    this.backendAPI.getAddedUsers(groupId);
  }

  CreateGroup() {
    const groupName = this.userGroupsForm.value.name;

    this.backendAPI.createGroup(groupName).then(
      (backendResponse: any) => {
        this.genericMessage = backendResponse.message;
        this.userGroupsForm.reset();
        setTimeout(() => { this.genericMessage = "" }, 2000)
      }
    );
  }

  DeleteGroup(groupId: number){
    this.backendAPI.deleteGroup(groupId);
  }

  excludeUser(selectedUser: number){
      this.backendAPI.deleteUserInGroup(selectedUser, this.selectedGroupId);
  }

  selectUser(_selectedUser: number){
    this.selectedUser = _selectedUser;
  }

  AddUserInGroup(){
    if (this.selectedUser != 0){
        this.backendAPI.addUsersInGroups(this.selectedUser, this.selectedGroupId);
    }
    // this.changeDetected = true;
    // this.addedUsersList.push(selectedUser);
    // this.tempUsersList.push(selectedUser);

    // let index= 0
    // for(let user of this.usersList){
    //   if (selectedUser._id == user._id){
    //     this.usersList.splice(index, 1);
    //     break;
    //   }
    //   index++;
    // }
  }

  initializeGroupForm() {
    this.userGroupsForm = this.formBuilder.group({
      name: [''],
    });
  }
}
