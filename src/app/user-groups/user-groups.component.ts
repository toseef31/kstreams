import { Component, OnInit, OnDestroy } from '@angular/core';
import { SessionStorageService } from 'angular-web-storage';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { LoginService } from '../services/login.service';
import { BackendApiService } from '../services/backend-api.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-groups',
  templateUrl: './user-groups.component.html',
  styleUrls: ['./user-groups.component.scss']
})
export class UserGroupsComponent implements OnInit, OnDestroy {

  getGroupsListSubscription: Subscription;
  usersGroupUpdateSubscription: Subscription;

  userGroupsForm: FormGroup;
  editGroupForm: FormGroup;

  dropdownDefaultText: string = "select a user";
  loggedUserId: number = 0;
  selectedGroupId: number = 0; // may needs value to be reset
  activatedForm: number = 0;
  genericMessage: string = "";
  selectedUserId: number = 0;
  totalGroups: number = 0;
  loading: boolean = true;
  isGroupEdited: boolean = false;
  isSubmitted: boolean = false;
  selectedGroupData: any;

  groupsList = [];
  usersList = [];
  addedUsersList = [];

  constructor(
    private sessionService: SessionStorageService,
    private formBuilder: FormBuilder,
    private backendAPI: BackendApiService) { }

  ngOnInit() {
    this.initializeUsersGroupForm();
    this.dropdownDefaultText = "Select a user";

    this.loggedUserId = this.sessionService.get('user_session_data').id;

    this.activatedForm = this.sessionService.get('activatedForm');
    console.log(this.activatedForm);
    if (this.sessionService.get('activatedForm') == null || this.sessionService.get('activatedForm') == "" || this.activatedForm == 3) {
      this.activatedForm = 0;
    }
    else {
      this.activatedForm = parseInt(this.sessionService.get('activatedForm'));
    }

    // -------- GET THE LIST OF GROUPS ---------------------------------
    this.backendAPI.getGroups();
    this.getGroupsListSubscription = this.backendAPI.getGroupsList.subscribe(
      (groupsList: any) => {
        this.groupsList = groupsList;
        this.totalGroups = groupsList.length;
        this.loading = false;
     
        if (this.isGroupEdited){
            this.genericMessage = "Group edited successfully";
            setTimeout(() => { this.genericMessage = "" }, 2000)
        }
      });

    this.usersGroupUpdateSubscription = this.backendAPI.usersGroupUpdate.subscribe(
      (groupedUsersList: any) => {
        this.usersList = groupedUsersList.remainingUsers;
        this.addedUsersList = groupedUsersList.groupUsers[0].members;
        this.loading = false;
        
        if (this.usersList.length == 0)
          this.dropdownDefaultText = "No users remaining";
        else
          this.dropdownDefaultText = "Select a user";
      }
    )
  }

  formActivation(formNumber: number) { // 0- means going back ; 1- means going to another form
    this.addedUsersList = [];
    this.usersList = [];
    this.isGroupEdited = false;
    this.isSubmitted = false;
    this.userGroupsForm.reset();

    this.activatedForm = formNumber;
    this.sessionService.set('activatedForm', this.activatedForm);
  }

  EditGroupForm(group: any) {
    this.activatedForm = 2;
    this.selectedGroupData = group;
    this.initializeEditGroupForm();
  }

  ManageUsersForm(groupId: number) {
    this.activatedForm = 3;
    this.selectedGroupId = groupId;
    this.sessionService.set('activatedForm', this.activatedForm);
    this.backendAPI.getAddedUsers(groupId);
  }

  CreateGroup() {
    const groupName = this.userGroupsForm.value.name;

    this.backendAPI.createGroup(groupName).then(
      (backendResponse: any) => {
        this.genericMessage = "Group created succesfully";
        this.userGroupsForm.reset();
        this.isSubmitted = false;
        setTimeout(() => { this.genericMessage = "" }, 2000)
      });

      setTimeout(() => {
        this.isSubmitted = false;
      }, 1000);
  }

  EditGroup() {
    this.backendAPI.editGroup(this.selectedGroupData._id, this.editGroupForm.value.name);
    this.isGroupEdited = true;
  }

  DeleteGroup(groupId: number, groupName: string) {
    if (confirm("Are you sure to delete " + groupName)) {
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

  initializeUsersGroupForm() {
    this.userGroupsForm = this.formBuilder.group({
      name: ['', Validators.required]
    });
  }

  initializeEditGroupForm() {
    this.editGroupForm = this.formBuilder.group({
      name: [this.selectedGroupData.name]
    });
  }

  ngOnDestroy() {
    this.getGroupsListSubscription.unsubscribe();
    this.usersGroupUpdateSubscription.unsubscribe();
  }
}
