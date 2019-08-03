import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BackendApiService {

  private userBaseUrl: string = 'https://localhost:22000/business';
  private groupsBaseUrl: string = 'https://localhost:22000/groups';

  public updateUserList = new Subject<any>();
  public refreshLoggedUserData = new Subject<any>();
  public getGroupsList = new Subject<any>();
  public usersGroupUpdate = new Subject<any>();

  constructor(
    private http: HttpClient
  ) { }

  loginApiRequest(loginData: any) {
    //var headers = new HttpHeaders();
    //headers.append('Content-Type', 'application/x-www-form-urlencoded');
    var promise = new Promise((resolve, reject) => {
      return this.http.post(this.userBaseUrl + "/login", loginData).subscribe(
        (backendResponse: any) => {
          resolve(backendResponse);
          console.log("login");
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
    // if (userImage == null)
    //   fd.append('file', null, '');

    var promise = new Promise((resolve, reject) => {
      return this.http.post(this.userBaseUrl + "/adduser", fd, { headers: headers }).subscribe(
        (backendResponse: any) => {
          resolve(backendResponse);
          this.updateUserList.next(backendResponse.users);
        }
      );
    });
    return promise;
  }

  userUpdateRequest(userData: any, userImage: File, loggedUserId: number) {
    //const data = { 'userData': userData, 'loggedUserId': loggedUserId };
    let headers = new HttpHeaders();
    headers.append('Content-Type', 'multipart/form-data');

    var fd = new FormData();
    fd.append('userData', JSON.stringify(userData));
    //fd.append('loggedUserId', JSON.stringify(loggedUserId));

    if (userImage != null)
      fd.append('file', userImage, userImage.name);
    // if (userImage != null)
    //   fd.append('file', null, '');

    var promise = new Promise((resolve, reject) => {
      return this.http.post(this.userBaseUrl + "/updateuser", fd, { headers: headers }).subscribe(
        (backendResponse: any) => {
          resolve(backendResponse);
        }
      )
    });
    return promise;
  }

  getUsersRequest(loggedinUserId: number) {
    const data = { '_id': loggedinUserId }
    return this.http.post(this.userBaseUrl + "/getusers", data).subscribe(
      (usersList: any) => {
        this.updateUserList.next(usersList);
      }
    );
  }

  getLoggedInUserRequest(email: string) {
    const data = { 'email': email };
    return this.http.post(this.userBaseUrl + '/getloggeduser', data).subscribe(
      (loggedUserData: any) => {
        this.refreshLoggedUserData.next(loggedUserData);
      }
    );
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

  editGroup(groupId: number, groupName: string) {
    const data = { 'groupId': groupId, 'groupName': groupName };

    return this.http.post(this.groupsBaseUrl + '/editgroup', data).subscribe(
      (backendResponse) => {
        this.getGroupsList.next(backendResponse);
      });
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
