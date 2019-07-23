import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BackendApiService {

  private userBaseUrl: string = 'https://localhost:4000/business';
  private groupsBaseUrl: string = 'https://localhost:4000/groups';

  public updateUserList = new Subject<any>();
  public refreshLoggedUserData = new Subject<any>();
  public getGroupsList = new Subject<any>();
  public usersGroupUpdate = new Subject<any>();
  //public getUsersList = new Subject<any>();

  constructor(
    private http: HttpClient
  ) { }

  loginApiRequest(loginData: any) {
    var promise = new Promise((resolve, reject) => {
      return this.http.post(this.userBaseUrl + "/login", loginData).subscribe(
        (backendResponse: any) => {
          resolve(backendResponse);
          this.refreshLoggedUserData.next(backendResponse);
        }
      );
    });
    return promise;
  }

  userAddRequest(userData: any, userImage: File, loggedUserId: number) {

    let headers = new HttpHeaders();
    headers.append('Content-Type', 'multipart/form-data');
    var fd = new FormData();
    fd.append('userData', JSON.stringify(userData));
    fd.append('loggedUserId', JSON.stringify(loggedUserId));

    if (userImage != null)
      fd.append('file', userImage, userImage.name);
    if (userImage != null)
      fd.append('file', null, '');

    var promise = new Promise((resolve, reject) => {
      return this.http.post(this.userBaseUrl + "/adduser", fd, { headers: headers }).subscribe(
        (backendResponse: any) => {
          //  console.log(backendResponse);
          resolve(backendResponse);
          this.updateUserList.next(backendResponse.users);
        }
      );
    });
    return promise;
  }

  userUpdateRequest(userData: any, loggedUserId: number) {
    const data = { 'userData': userData, 'loggedUserId': loggedUserId };

    var promise = new Promise((resolve, reject) => {
      return this.http.post(this.userBaseUrl + "/updateuser", data).subscribe(
        (backendResponse: any) => {
          resolve(backendResponse);
          this.updateUserList.next(backendResponse.users);
        }
      )
    });
    return promise;
  }

  getUsersRequest(loggedinUserId: number) {
    const data = { '_id': loggedinUserId }
    return this.http.post(this.userBaseUrl + "/getusers", data).subscribe(
      (usersList: any) => {
        //console.log(usersList);
        this.updateUserList.next(usersList);
      }
    );
  }

  getLoggedInUserRequest(email: string) {
    const data = { 'email': email };
    var promise = new Promise((resolve, reject) => {
      return this.http.post(this.userBaseUrl + '/getloggeduser', data).subscribe(
        (loggedUserData: any) => {
          resolve(loggedUserData);
          this.refreshLoggedUserData.next(loggedUserData);
        }
      );
    });
    return promise;
  }

  deleteUserRequest(userId: number, myUserId) {
    const data = { 'userId': userId, '_id': myUserId }

    var promise = new Promise((resolve, reject) => {
      return this.http.post(this.userBaseUrl + "/deleteuser", data).subscribe(
        (updatedUsersList: any) => {
          resolve(updatedUsersList);
          this.updateUserList.next(updatedUsersList);
        }
      );
    });
    return promise;
  }

  // ************************* ********************************************* */
  // ************************* GROUPS ***************************************** */
  // ************************* ********************************************* */

  createGroup(groupName: string) {
    const data = { 'name': groupName };
    var promise = new Promise((resolve, reject) => {
      return this.http.post(this.groupsBaseUrl + "/creategroup", data).subscribe(
        (backendResponse: any) => {
          resolve(backendResponse);
          this.getGroupsList.next(backendResponse);
        }
      );
    });
    return promise;
  }

  deleteGroup(groupId: number) {
    const data = { 'groupId': groupId, 'status': 0 }
    return this.http.post(this.groupsBaseUrl + "/deletegroup", data).subscribe(
      (backendResponse) => {
        this.getGroupsList.next(backendResponse);
      }
    )
  }

  getGroups() {
    return this.http.get(this.groupsBaseUrl + "/getgroups").subscribe(
      (groupsList: any) => {
        this.getGroupsList.next(groupsList);
      }
    )
  };

  addUsersInGroups(user: number, selectedGroupId: number) {
    const data = { 'user': user, 'selectedGroupId': selectedGroupId };
    return this.http.post(this.groupsBaseUrl + "/addusergroup", data).subscribe(
      (backendResponse) => {
        this.usersGroupUpdate.next(backendResponse);
      }
    )
  }

  deleteUserInGroup(selectedUser: number, selectedGroupId: number) {
    const data = { 'user': selectedUser, 'selectedGroupId': selectedGroupId };
    return this.http.post(this.groupsBaseUrl + "/deletegroupuser", data).subscribe(
      (backendResponse) => {
        this.usersGroupUpdate.next(backendResponse);
      }
    )
  }

  getAddedUsers(groupId: number) {
    const data = { 'selectedGroupId': groupId }
    return this.http.post(this.groupsBaseUrl + "/getaddedusers", data).subscribe(
      (groupUsers) => {
        this.usersGroupUpdate.next(groupUsers);
      }
    )
  }

} // ---- CLASS ENDS ------
