import { Http, Headers, RequestOptions } from "@angular/http";
import { Injectable } from "@angular/core";
import { ConstantsGlobal } from "../Constants-Global";
import { CookieService } from "./Cookie.service";

@Injectable()
export class UserService {
  static authToken: string;
  userData: Object;

  constructor(private http: Http) {
    this.http = http;
    UserService.getAuthFromCookie();
  }

  /**
   * Get auth token from cookie service
   */
  static getAuthFromCookie() {
    UserService.authToken = CookieService.getThrinaciaSedraAccount() ? CookieService.getThrinaciaSedraAccount() : CookieService.getAuth();
  }

  /**
   * Log in with email and password
   * @param  {string} email    email
   * @param  {string} password
   * @return {Observable}      
   */
  login(email: string, password: string) {
    let body = {
      "email": email,
      "password": password
    }
    let headers = new Headers({ 'Content-Type': 'application/json' });
    let options = new RequestOptions({ headers: headers });
    return this.http.post(ConstantsGlobal.getApiUrlAuth(), JSON.stringify(body), options)
      .map(res => res.json());
  }

  /**
   * Get user data from login()
   * @param  {Object} data JSON data from login()
   * @return {Observable}
   */
  getUserData(data: Object) {
    this.userData = data;
    CookieService.setAuth(this.userData["auth_token"]);
    CookieService.setFirstName(this.userData["first_name"]);
    CookieService.setPersonID(this.userData["person_id"]);
    UserService.getAuthFromCookie();
  }

  /**
   * Register user with provided info
   * @param  {Object}     registerParam parameter for registering
   * @return {Observable}
   */
  register(registerParam: Object) {
    let headers = new Headers({ 'Content-Type': 'application/json' });
    let options = new RequestOptions({ headers: headers })
    return this.http.post(ConstantsGlobal.getApiUrlRegister(), JSON.stringify(registerParam), options)
      .map(res => res.json());
  }

  /**
   * set new user address
   * @param  {Object} addressObj object that contains address
   * @return {Observable}        Observable
   */
  setNewAddress(addressObj: Object) {
    let param = {};
    for (let prop in addressObj) {
      if (addressObj.hasOwnProperty(prop)) {
        param[prop] = addressObj[prop];
      }
    }
    UserService.getAuthFromCookie();

    let headers = new Headers();
    headers.append("X-Auth-Token", UserService.authToken);
    let options = new RequestOptions({
      headers: headers
    });

    return this.http.post(ConstantsGlobal.getApiUrlAddress(), JSON.stringify(param), options)
      .map(res => res.json());
  }

  /**
   * get user addresses
   * @return {Observable} Observable
   */
  getAddress() {
    UserService.getAuthFromCookie();
    let headers = new Headers();
    headers.append("X-Auth-Token", UserService.authToken);
    let options = new RequestOptions({
      headers: headers
    });

    return this.http.get(ConstantsGlobal.getApiUrlAddress(), options)
      .map(res => res.json());
  }

  getProfile(person_id: string) {
    return this.http.get(ConstantsGlobal.getApiUrlPerson() + person_id)
      .map(res => res.json());
  }

  saveProfile(profileObj: Object) {
    let param = {};
    for (let prop in profileObj) {
      if (profileObj.hasOwnProperty(prop)) {
        param[prop] = profileObj[prop];
      }
    }
    UserService.getAuthFromCookie();
    let headers = new Headers();
    headers.append("X-Auth-Token", UserService.authToken);
    let options = new RequestOptions({
      headers: headers
    });

    return this.http.put(ConstantsGlobal.getApiUrlAccount(), JSON.stringify(param), options)
      .map(res => res.json());
  }

  /**
   * Log out current user
   * @return {[type]} [description]
   */
  logout() {
    UserService.getAuthFromCookie();
    let headers = new Headers();
    headers.append("X-Auth-Token", UserService.authToken);
    let options = new RequestOptions({ headers: headers });
    return this.http.post(ConstantsGlobal.getApiUrlLogout(), null, options)
      .map(res => {
        res.json();
      });
  }

  setGuestAddress(addressObj: Object) {
    return this.http.post(ConstantsGlobal.getApiUrlAddressGuest(), JSON.stringify(addressObj))
      .map(res => res.json());
  }


  /**
   * Get phone number for the current user
   * 
   * @returns
   */
  getPhone() {
    UserService.getAuthFromCookie();
    let headers = new Headers();
    headers.append("X-Auth-Token", UserService.authToken);
    let options = new RequestOptions({
      headers: headers
    });

    return this.http.get(ConstantsGlobal.getApiUrlPhoneNumber(), options)
      .map(res => res.json());
  }

  /**
   * Set new phone number for current user
   * 
   * @param {any} phoneObj required params for POST
   * @returns
   */
  setNewPhone(phoneObj: any) {
    let param = {};
    for (let prop in phoneObj) {
      if (phoneObj.hasOwnProperty(prop)) {
        param[prop] = phoneObj[prop];
      }
    }
    UserService.getAuthFromCookie();

    let headers = new Headers();
    if (!phoneObj.hasOwnProperty("inline_token")) {
      headers.append("X-Auth-Token", UserService.authToken);
    }
    let options = new RequestOptions({
      headers: headers
    });

    return this.http.post(ConstantsGlobal.getApiUrlPhoneNumber(), JSON.stringify(param), options)
      .map(res => res.json());
  }

}
