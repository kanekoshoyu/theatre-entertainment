import { Component, OnInit, Inject, Input, Output, EventEmitter } from "@angular/core";
import { UserService } from "../../service/User.service";
import { UtilService } from "../../service/Util.service";
import { TranslationService } from '../../service/Translation.service';

declare var jQuery: any;

@Component({
  selector: "login-form",
  template: require("raw-loader!./Login.html"),
  providers: [UserService]
})

export class LoginComponent {

  @Input() isContributePage = false;
  @Output() onSuccess = new EventEmitter();
  @Output() onFailed = new EventEmitter();

  mUserService: UserService;

  loginEmail: string;
  loginPassword: string;
  isLoggedInSuccessful: boolean = true;
  logginErrorMessage: string;

  constructor( @Inject(UserService) mUserService: UserService, @Inject(TranslationService) private translationService: TranslationService) {
    this.mUserService = mUserService;
    this.translationService.setupTranslation("campaign_login"); 
  }

  onLogIn(evt: any) {
    if (evt["keyCode"] == 13) {
      this.login();
    }
  }

  /**
   * Log user in with email and password
   * @param  {boolean} withoutValidation Optional validation
   */
  login() {
    this.formValidationLogin();
    if (!jQuery("#login-form.ui.form .field.error").length) {
      this.mUserService.login(this.loginEmail, this.loginPassword).subscribe(
        data => {
          this.onSuccess.emit(data);
          this.isLoggedInSuccessful = true;
        },
        error => {
          this.onFailed.emit(error);
          this.logginErrorMessage = UtilService.logError(error);
          this.isLoggedInSuccessful = false;
        }
      );
    }
  }

  formValidationLogin() {
    jQuery("#login-form.ui.form").form({
      inline: true,
      fields: {
        Email: {
          identifier: "Email",
          rules: [
            {
              type: "empty",
              prompt: "Please enter your login email"
            },
            {
              type: "email",
              prompt: "Please enter a valid email"
            }
          ]
        },
        Password: {
          identifier: "Password",
          rules: [
            {
              type: "empty",
              prompt: "Please enter your password"
            },
            {
              type: "minLength[6]",
              prompt: "Your password must be at least 6 characters"
            }
          ]
        }
      }
    }).form("validate form");
  }

  /**
   * Translate Function
   */
  translate(name){
    return TranslationService.translation[name];
  }
}
