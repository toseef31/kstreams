import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class BackendConnectorService {

  private baseUrl: string = "https://localhost:22000/projects/";

  constructor(private http: HttpClient) {

  }

  registerPackageRequest(packageData: any) {
    var promise = new Promise((resolve, reject) => {
      return this.http.post(this.baseUrl + 'registerProject', packageData).subscribe(
        (response: any) => {

        }
      );
    })
    return promise;
  }


}
