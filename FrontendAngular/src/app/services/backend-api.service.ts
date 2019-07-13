import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BackendApiService {

  private baseUrl: string = 'http://localhost:4000/business';
  public updateUserList = new Subject<any>();
  public refreshLoggedUserData = new Subject<any>();

  constructor(
    private http: HttpClient
  ) { }

  loginApiRequest(loginData: any) {
    var promise = new Promise((resolve, reject) => {
      return this.http.post(this.baseUrl + "/login", loginData).subscribe(
        (backendResponse: any) => {
          resolve(backendResponse);
        }
      );
    });
    return promise;
  }

  // ImageApiRequest() {
  //   var promise = new Promise((resolve, reject) => {
  //     return this.http.get(this.baseUrl + "/assets").subscribe(
  //       (backendResponse: any) => {
  //         console.log(backendResponse);
  //         resolve(backendResponse);
  //       }
  //     );
  //   });
  //   return promise;
  // }


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
      return this.http.post(this.baseUrl + "/adduser", fd, { headers: headers }).subscribe(
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
      return this.http.post(this.baseUrl + "/updateuser", data).subscribe(
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
    var promise = new Promise((resolve, reject) => {
      return this.http.post(this.baseUrl + "/getusers", data).subscribe(
        (usersList: any) => {
          console.log(usersList);
          resolve(usersList);
          this.updateUserList.next(usersList);
        }
      );
    });
    return promise;
  }

  getLoggedInUserRequest(email: string) {
    const data = { 'email': email };
    var promise = new Promise((resolve, reject) => {
      return this.http.post(this.baseUrl + '/getloggeduser', data).subscribe(
        (loggedUserData: any) => {
          resolve(loggedUserData);
          this.refreshLoggedUserData.next(loggedUserData);
        }
      );
    });
    return promise;
  }

  deleteUserRequest(userId: number) {
    var promise = new Promise((resolve, reject) => {
      return this.http.post(this.baseUrl + "/deleteuser", { 'userId': userId }).subscribe(
        (updatedUsersList: any) => {
          resolve(updatedUsersList);
          this.updateUserList.next(updatedUsersList);
        }
      );
    });
    return promise;
  }


}
