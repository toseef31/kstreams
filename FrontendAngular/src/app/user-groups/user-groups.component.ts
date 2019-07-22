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

  dropdownDefaultText: string = "select a user";
  loggedUserId: number = 0;
  selectedGroupId: number = 0; // may needs value to be reset
  activatedForm: number = 0;
  genericMessage: string = "";
  selectedUserId: number = 0;
  totalGroups: number = 0;

  groupsList = [];
  usersList = [];
  addedUsersList = [];

  constructor(
    private sessionService: SessionStorageService,
    private formBuilder: FormBuilder,
    private backendAPI: BackendApiService) { }

  ngOnInit() {
    this.initializeGroupForm();
    this.dropdownDefaultText = "select a user";

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
      (groupsList: any) => {
        //console.log(groupsList);
        this.groupsList = groupsList;
        this.totalGroups = groupsList.length;
      });

    this.backendAPI.usersGroupUpdate.subscribe(
      (groupedUsersList: any) => { 
        this.usersList = groupedUsersList.remainingUsers;
        this.addedUsersList = groupedUsersList.groupUsers[0].members;
       
        if (this.usersList.length == 0)
          this.dropdownDefaultText = "no users remaining";
        else
          this.dropdownDefaultText = "select a user";
      }
    )
  }

  formActivation() {
    this.addedUsersList = [];
    this.usersList = [];
    this.userGroupsForm.reset();

    if (this.activatedForm == 0) {
      this.sessionService.set('activatedForm', 1);
      this.activatedForm = 1;
    }
    else if (this.activatedForm == 1) {
      this.backendAPI.getGroups();
      this.activatedForm = 0;
      this.sessionService.set('activatedForm', 0);
    }
    else {
      this.backendAPI.getGroups();
      this.activatedForm = 0;
      this.sessionService.set('activatedForm', 0);
    }
  }

  ManageGroupUsers(groupId: number) {
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

  DeleteGroup(groupId: number, groupName: string) {
    if(confirm("Are you sure to delete "+groupName)) {
      this.backendAPI.deleteGroup(groupId);
    }
  }

  excludeUser(selectedUser: number) {
    this.backendAPI.deleteUserInGroup(selectedUser, this.selectedGroupId);
  }

  selectUser(_selectedUser: number) {
    this.selectedUserId = _selectedUser;
  }

  AddUserInGroup() {
    if (this.selectedUserId != 0) {
      this.backendAPI.addUsersInGroups(this.selectedUserId, this.selectedGroupId);
      this.selectedUserId = 0;
    }
  }

  initializeGroupForm() {
    this.userGroupsForm = this.formBuilder.group({
      name: [''],
    });
  }
}
