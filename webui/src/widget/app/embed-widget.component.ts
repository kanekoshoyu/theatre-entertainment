///////////////////////////////////////////////////////////////////////////////////////////
// Main App Component
///////////////////////////////////////////////////////////////////////////////////////////
import { Component, Inject, ElementRef, OnInit, AfterViewChecked, ViewChild } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { NgClass, NgLocalization, NgPlural, NgPluralCase } from "@angular/common";
import { ConstantsGlobal } from "./Constants-Global";
import { Http, Headers, RequestOptions } from "@angular/http";
import { UserService } from "./service/User.service";
import { CampaignService } from "./service/Campaign.service";
import { StripeService } from "./service/Stripe.service";
import { CookieService } from "./service/Cookie.service";
import { UtilService } from "./service/Util.service";
import { SettingsService } from "./service/Settings.service";
import { RegisterComponent } from "./components/modules/Register.component";
import { LoginComponent } from "./components/modules/Login.component";
import { ProfileComponent } from "./components/modules/Profile.component";
import { TranslationService } from './service/Translation.service';

declare let jQuery: any;

export class GeneralLocalization extends NgLocalization {
  getPluralCategory(value: any) {
    if (value > 1) {
      return "other";
    }
  }
}

// Angular decorator
@Component({
  selector: "sedra-widget",
  template: require("raw-loader!./embed-widget.component.html"),
  providers: [{ provide: NgLocalization, useClass: GeneralLocalization }]
})

export class AppComponent implements OnInit {
  @ViewChild(RegisterComponent)
  private registerComponent: RegisterComponent;
  @ViewChild(LoginComponent)
  private loginComponent: LoginComponent;
  API_HOST: string;
  CONTRIBUTION_TYPE_LOGIN: string = "login";
  CONTRIBUTION_TYPE_REGISTER: string = "register";
  CONTRIBUTION_TYPE_GUEST: string = "guest";
  mCampaignService: CampaignService;
  mStripeService: StripeService;
  mUserService: UserService;
  mSettingsService: SettingsService;
  mCampaign: any;
  mCampaignManagerInfo: any = {
    "name": "",
    "description": "",
    "image": "",
    "links": []
  };
  mCampaignBusinessInfo: any = {
    "name": "",
    "description": "",
    "image": "",
    "links": []
  };
  mCampaignShowSlash: boolean = false;
  mCampaignStreams: Array<any> = [];
  mCampaignBackers: Array<any> = [];
  mCampaignFAQs: Array<any> = [];
  authToken: string;
  personId: string;
  campaignPercentage: number = 50;
  profileTypeId: number = -1;

  isContributionView: Boolean;
  isAddingCard: boolean = true;
  isAddingAddress: boolean = true;

  userInfo: Object = {
    "first_name": "",
    "last_name": "",
    "profile_image": "",
    "bio": "",
    "person_id": -2
  };

  registerInfo: any = {
    "first_name": "",
    "last_name": "",
    "email": "",
    "password": "",
    "password_confirm": ""
  };

  contribution: any = {
    "rewardName": "",
    "amount": 0
  };
  shippingFee: any;
  totalAmount: number;
  contributionType: string = this.CONTRIBUTION_TYPE_LOGIN;

  rewardIndex: number;
  rewardPageNumber: number = 1;
  cardInfo: any = {
    "cardName": "",
    "cardNumber": "",
    "cardDate": "",
    "cardCVC": "",
    "email": ""
  };
  stripe_account_id: number;
  stripeCards: Array<any> = [];

  addressInfo: any = {
    "city_id": 0,
    "street1": "",
    "street2": "",
    "mail_code": ""
  };

  addressID: number;
  addressList: Array<any> = [];

  isAddingPhone: boolean = true;
  phoneList: Array<any> = [];
  phoneID: number;

  phoneInfo: any = {
    "number": null,
    "phone_number_type_id": null
  };

  isRewardShipping: Boolean = false;
  pledgeParam: any = {};

  guestPledgeParam: any = {};

  contactManagerMessage = {
    "person_id": "",
    "subject": "",
    "body": ""
  };
  isContactMessageSent = false;

  rewardContributionPageConfig = {
    "id": "rewards-contribution-pagination",
    "itemsPerPage": 5,
    "currentPage": 1
  };

  campaignBackersConfig = {
    "id": "campaign-backers-pagination",
    "itemsPerPage": 10,
    "currentPage": 1
  };

  campaignFaqsConfig = {
    "id": "campaign-faqs-pagination",
    "itemsPerPage": 10,
    "currentPage": 1
  };

  campaignStreamsConfig = {
    "id": "campaign-streams-pagination",
    "itemsPerPage": 7,
    "currentPage": 1
  };

  contributionMethod: Array<any> = [
    {
      "id": 0,
      "name": "Regular Contribution"
    },
    {
      "id": 1,
      "name": "Partially Anonymous Contribution"
    },
    {
      "id": 2,
      "name": "Fully Anonymouse Contribution"
    }
  ];

  selectedStream: any = {};
  campaignErrorMessage: any = {};
  loginEmail: string;
  loginPassword: string;

  isShippingFeeExcluded: boolean = false;
  isRegisterFormValid: boolean = false;
  isDisqusLoaded: boolean = false;
  isFontFamilyApplied: boolean = false;
  isStreamSelected: boolean = false;
  isContributionSubmitting: boolean = false;
  isPledgingSuccess: boolean = false;
  isLoggedInSuccessful: boolean = true;
  submitErrorMessage: string = "";
  isjQueryClicked: boolean = false;
  isCommentTab: boolean = false;
  isContactTab: boolean = false;
  isFormLogin: boolean = true;
  isCustomCampaignPercentage: boolean = false;
  shouldCampaignAvatarImageShow: boolean = false;
  siteLogo: Object = {
    "image": "",
    "link": ""
  }
  settingDecimalOption: number = 1;
  isCampaignShown: boolean = true;
  isProfileShown: boolean = false;
  minContributionAmount: number = 1;

  urlTos: string;
  urlPrivacy: string;

  siteSettings: Object = {};
  profileResourceId: number = -1;
  isDropdownVisible: boolean = false;
  isMobile: boolean = false;

  constructor( @Inject(CampaignService) campaignService: CampaignService, @Inject(TranslationService) private translationService: TranslationService, @Inject(UserService) userService: UserService, @Inject(StripeService) stripeService: StripeService, @Inject(SettingsService) settingsService: SettingsService, private elementRef: ElementRef, private domSanitization: DomSanitizer, private http: Http) {
    if (process.env.ENV == "development") {
      window["widgetHost"] = "https://cascade.thrinacia.com/api";
      window["DefaultPreferredLang"] = {
        "defaultLang": "en",
        "preferredLang": "en"
      };
    }
    //getting new Default and preferred lang
    if (window["widgetHost"] && window["DefaultPreferredLang"]) {
      UtilService.setWidgetHost(window["widgetHost"]);
      UtilService.setLanguageHost(window["DefaultPreferredLang"]);

      this.API_HOST = ConstantsGlobal.getApiHost();
      this.urlTos = ConstantsGlobal.getSiteHost() + "tos";
      this.urlPrivacy = ConstantsGlobal.getSiteHost() + "privacy";

      this.resetPledgeParam();
      this.isContributionView = false;
      this.mCampaignService = campaignService;
      this.mStripeService = stripeService;
      this.mSettingsService = settingsService;
      this.elementRef = elementRef;
      this.mUserService = userService;
      this.authToken = CookieService.getThrinaciaSedraAccount() ? CookieService.getThrinaciaSedraAccount() : CookieService.getAuth();
      this.personId = CookieService.getPersonID();
      this.userInfo["first_name"] = CookieService.getFirstName();
      this.translationService.setupTranslation("campaign_page");

      this.shippingFee = !this.shippingFee ? 0 : this.shippingFee;
      let eleAttr = this.elementRef.nativeElement.attributes;
      for (let prop in eleAttr) {
        if (eleAttr.hasOwnProperty(prop)) {
          let eleAttrKey = eleAttr[prop]["name"];
          let eleAttrValue = eleAttr[prop]["value"];
          UtilService.widgetProp[eleAttrKey] = eleAttrValue;
        }
      }
      if (UtilService.widgetProp["campaignid"]) {
        UtilService.setCampaignID(UtilService.widgetProp["campaignid"]);
      }
    } else {
      console.error("app_local.js is not set up properly");
    }

  }

  ngOnInit() {
    if (window["widgetHost"] && window["DefaultPreferredLang"]) {
      if (UtilService.widgetProp["campaignid"]) {
        this.mSettingsService.getAllSettings().subscribe(
          res => {
            if (res) {
              for (let i in res) {
                this.siteSettings[res[i]["name"]] = res[i]["value"];
              }
              if (this.siteSettings.hasOwnProperty("site_campaign_exclude_shipping_cost")) {
                this.isShippingFeeExcluded = this.siteSettings["site_campaign_exclude_shipping_cost"];
              }
              if (this.siteSettings.hasOwnProperty("site_campaign_decimal_option")) {
                this.settingDecimalOption = this.siteSettings["site_campaign_decimal_option"];
              }
              if (this.siteSettings.hasOwnProperty("site_theme_campaign_min_button_show")) {
                this.isCampaignShown = this.siteSettings["site_theme_campaign_min_button_show"];
              }
              if (this.siteSettings.hasOwnProperty("site_theme_campaign_min_contribute_amount")) {
                this.minContributionAmount = this.siteSettings["site_theme_campaign_min_contribute_amount"];
              }
              this.getCampaign(this.authToken);
            }
          },
          error => {
            this.getCampaign(this.authToken);
            UtilService.logError(error);
          }
        );
        if (this.personId) {
          this.getProfile();
        }
        if (this.authToken) {
          this.mStripeService.getStripeAccount().subscribe(
            res => {
              if (res.length) {
                StripeService.stripe_account_id = res[0]["stripe_account_id"];
                this.stripe_account_id = res[0]["stripe_account_id"];
                if (this.stripe_account_id) {
                  this.isAddingCard = false;
                }
                this.getStripeAccountCard();
                this.getUserAddress();
                this.getUserPhone();
              }
            },
            error => UtilService.logError(error)
          );
        }
      }

      jQuery(document).ready(() => {
        if (jQuery(window).width() < 768) {
          this.isMobile = true;
        }
        jQuery(window).resize(() => {
          if (jQuery(window).width() < 768 && !this.isMobile) {
            this.isMobile = true;
            jQuery("#campaign-tabs").removeClass("tabular").addClass("secondary pointing");
          } else if (jQuery(window).width() >= 768 && this.isMobile) {
            this.isMobile = false;
            jQuery("#campaign-tabs").removeClass("secondary pointing").addClass("tabular");
          }
        });
      });
    }
  }

  /**
   * Set proper text depending on how much is remaining in campaign
   */
  remainingTimeMapping(dateType: string) {
    switch (dateType) {
      case "day":
        this.mCampaign.remaining = this.mCampaign.days_remaining_inclusive;
        if (this.mCampaign.remaining > 0) {
          if (this.mCampaign.days_remaining_inclusive == "1") {
            this.mCampaign.remaining_text = "day_to_go"
          } else {
            this.mCampaign.remaining_text = "days_to_go";
          }
        } else {
          if (parseInt(this.mCampaign.days_remaining_inclusive) == -1) {
            this.mCampaign.remaining_text = "day_ago"
          } else {
            this.mCampaign.remaining_text = "days_ago";
          }
        }
        break;
      case "hour":
        this.mCampaign.remaining = this.mCampaign.hours_remaining_inclusive;
        if (this.mCampaign.remaining > 0) {
          if (this.mCampaign.hours_remaining_inclusive == "1") {
            this.mCampaign.remaining_text = "hour_to_go"
          } else {
            this.mCampaign.remaining_text = "hours_to_go";
          }
        } else {
          if (parseInt(this.mCampaign.hours_remaining_inclusive) == -1) {
            this.mCampaign.remaining_text = "hour_ago"
          } else {
            this.mCampaign.remaining_text = "hours_ago";
          }
        }
        break;
      case "minute":
        this.mCampaign.remaining = this.mCampaign.minutes_remaining_inclusive;
        if (this.mCampaign.remaining > 0) {
          if (this.mCampaign.minutes_remaining_inclusive == "1") {
            this.mCampaign.remaining_text = "minute_to_go"
          } else {
            this.mCampaign.remaining_text = "minutes_to_go";
          }
        } else {
          if (parseInt(this.mCampaign.minutes_remaining_inclusive) == -1) {
            this.mCampaign.remaining_text = "minute_ago"
          } else {
            this.mCampaign.remaining_text = "minutes_ago";
          }
        }
        break;
      case "second":
        this.mCampaign.remaining = this.mCampaign.seconds_remaining_inclusive;
        if (this.mCampaign.remaining > 0) {
          if (this.mCampaign.seconds_remaining_inclusive == "1") {
            this.mCampaign.remaining_text = "second_to_go"
          } else {
            this.mCampaign.remaining_text = "seconds_to_go";
          }
        } else {
          if (parseInt(this.mCampaign.seconds_remaining_inclusive) == -1) {
            this.mCampaign.remaining_text = "second_ago"
          } else {
            this.mCampaign.remaining_text = "seconds_ago";
          }
        }
        break;
      case "continue":
        this.mCampaign.remaining_text = "continuous_campaign";
        break;
      default:
        this.mCampaign.remaining = 0;
        this.mCampaign.remaining_text = "ended_now";
    }
    // this.mCampaign.remaining = Math.abs(this.mCampaign.remaining);
  }

  backersMapping(number?: string) {
    if (number) {
      switch (number) {
        case "1":
          return "backer";
        default:
          return "backers";
      }
    } else {
      switch (this.mCampaign.total_backers) {
        case "1":
          this.mCampaign.backers_text = "backer";
          break;
        default:
          this.mCampaign.backers_text = "backers";
          break;
      }
    }
  }

  ngAfterViewChecked() {
    if (!this.isFontFamilyApplied && this.mCampaign) {
      this.isFontFamilyApplied = true;
      UtilService.setFontFamily();
    }
    if (this.mCampaign) {
      UtilService.setPaginationColor();
    }
  }

  /**
   * Get campaign data through API
   */
  getCampaign(authToken?: string) {
    this.mCampaignService.getCampaignData(ConstantsGlobal.CAMPAIGN_ID, authToken).subscribe(
      campaign => this.formatCampaignData(campaign),
      error => {
        UtilService.logError(error);
        if (error.json().errors && error.json().errors.entry_id && error.json().errors.entry_id[0].code == "account_campaign_invalid_entry_id") {
          this.campaignErrorMessage = ConstantsGlobal.ERROR_CAMPAIGN_INVALID;
        }
        else {
          this.getCampaignStatus();
        }
      }
    );
  }

  /**
   * format campaign data for easier navigation through campaign object
   * @param  {Object} campaignData the campaign object from
   */
  formatCampaignData(campaign: any) {
    if (campaign.managers) {
      campaign.managers[0].full_name = campaign.managers[0].first_name + " " + campaign.managers[0].last_name;
      if (campaign.managers[0].person_files) {
        campaign.managers[0].person_files[0].full_path = ConstantsGlobal.getApiUrlCampaignProfileImage() + campaign.managers[0].person_files[0].path_external;
      }
    }
    campaign.featured_image_full_path = this.getFeaturedImage(campaign, false);
    campaign.explore_image_full_path = this.getFeaturedImage(campaign, true);
    // if (campaign.pledges && campaign.pledges.length) {
    //   for (let i = 0; i < campaign.pledges.length; i++) {
    //     campaign.pledges[i].estimated_delivery_time = this.setDateObject(campaign.pledges[i].estimated_delivery_time);
    //   }
    // }
    if (this.isShippingFeeExcluded) {
      campaign.funded_amount = campaign.funded_amount_shipping_excluded;
    }
    this.campaignPercentage = (campaign.funded_amount / (campaign.funding_goal || 1)) * 100;
    campaign.progressID = "campaign" + campaign.id;
    campaign.description = this.domSanitization.bypassSecurityTrustHtml(campaign.description);
    this.mCampaign = campaign;
    this.processCampaignSettings();

    this.remainingTimeMapping(this.getCampaignRemainingUnit());
    if (this.mCampaign.entry_fee_percentage != null) {
      this.isCustomCampaignPercentage = true;
    }
    this.showProfile();
    this.mCampaignFAQs = this.mCampaign.faqs == null ? [] : this.mCampaign.faqs;
    this.getCampaignBackers();
    this.getCampaignStream();
    jQuery.getScript("https://static.addtoany.com/menu/page.js");
    this.getSiteLogo();

    if (this.mCampaign.settingsObject.hasOwnProperty("enable_rewards_pagination") && !this.mCampaign.settingsObject["enable_rewards_pagination"]) {
      this.rewardContributionPageConfig = {
        "id": "rewards-contribution-pagination",
        "itemsPerPage": 9999,
        "currentPage": 1
      };
    }


  }

  getCampaignStatus() {
    this.mCampaignService.getCampaignStatus(ConstantsGlobal.CAMPAIGN_ID).subscribe(
      status => {
        if (status) {
          if (status.entry_status_id == 1) {
            this.campaignErrorMessage = ConstantsGlobal.ERROR_CAMPAIGN_BEING_EDITED;
          }
          else if (status.entry_status_id == 12) {
            this.campaignErrorMessage = ConstantsGlobal.ERROR_CAMPAIGN_BEING_REVIEWED;
          }
          else {
            this.campaignErrorMessage = ConstantsGlobal.ERROR_CAMPAIGN_BEING_OTHER_STATUS;
          }
        }
      },
      error => UtilService.logError(error)
    );
  }

  getProfile() {
    this.mUserService.getProfile(this.personId)
      .subscribe(
      res => {
        this.userInfo["first_name"] = res["first_name"];
        this.userInfo["last_name"] = res["last_name"];
        this.userInfo["profile_image"] = res.files != null && res.files.length ? ConstantsGlobal.getApiUrlCampaignProfileImage() + res.files[0].path_external : null;
        this.userInfo["bio"] = res["bio"];
        this.userInfo["person_id"] = res["person_id"];
        if (res.files && res.files.length) {
          this.profileResourceId = res.files[0]["id"];
        }
      },
      error => UtilService.logError(error)
      );
  }

  processCampaignSettings() {
    this.mCampaign.settingsObject = {};
    if (this.mCampaign.settings && this.mCampaign.settings.length) {
      for (let i = 0; i < this.mCampaign.settings.length; i++) {
        this.mCampaign.settingsObject[this.mCampaign.settings[i]["name"]] = this.mCampaign.settings[i]["value"];
      }
    }
  }

  /**
   * Check if campaign has ended
   * @return {boolean} True is campaign has ended
   */
  isCampaignAvailable() {
    if (this.mCampaign.campaign_started == "t" && this.mCampaign.ends) {
      let d = new Date();
      return d.getTime() >= this.setDateObject(this.mCampaign.ends).getTime();
    }
    else if (this.mCampaign.campaign_started == "f" || this.mCampaign.entry_status_id != 2) {
      return true;
    }
  }

  /**
   * Show profile depending on the setting
   */
  showProfile() {
    let campaignSettings = {};
    for (let index in this.mCampaign.settings) {
      campaignSettings[this.mCampaign.settings[index].name] = this.mCampaign.settings[index].value;
    }

    if (campaignSettings["toggle_profile_type_view_advance"]) {
      this.profileTypeId = campaignSettings["profile_type_view_id"];
      // Show both individual user and organization
      if (this.profileTypeId == 0 || this.profileTypeId == undefined) {
        this.setCampaignManagerInfo();
        if (this.mCampaign.business_organizations != null && this.mCampaign.business_organizations.length) {
          this.setCampaignBusinessInfo();
          this.mCampaignShowSlash = true;
        }
      }
      // Show bussiness organization only
      else if (this.profileTypeId == 1) {
        if (this.mCampaign.business_organizations != null && this.mCampaign.business_organizations.length) {
          this.setCampaignBusinessInfo();
        }
        else {
          this.setCampaignManagerInfo();
        }
      }
      // Show individual user only
      else if (this.profileTypeId == 2) {
        this.setCampaignManagerInfo();
      }
    }
    else {
      this.setCampaignManagerInfo();
      if (this.mCampaign.business_organizations != null && this.mCampaign.business_organizations.length) {
        this.setCampaignBusinessInfo();
        this.mCampaignShowSlash = true;
      }
      this.profileTypeId = 0;
    }
  }

  setCampaignManagerInfo() {
    this.mCampaignManagerInfo.name = this.mCampaign.managers[0].full_name;
    this.mCampaignManagerInfo.description = this.mCampaign.managers[0].bio;
    if (this.mCampaign.managers[0].person_files && this.mCampaign.managers[0].person_files.length) {
      this.mCampaignManagerInfo.image = ConstantsGlobal.getApiUrlCampaignProfileImage() + this.mCampaign.managers[0].person_files[0].path_external;
    }
    this.mCampaignManagerInfo.links = this.mCampaign.managers[0].person_websites;
  }

  /**
   * Get campaign comments Disqus
   */
  getCampaignComments() {
    if (!this.isDisqusLoaded) {
      this.http.get(ConstantsGlobal.getApiUrlDisqusSetting())
        .map(res => res.json())
        .subscribe(
        res => {
          let disqus_shortname = res[0].value;
          if (disqus_shortname) {
            jQuery("<div id='disqus_thread'></div>").insertAfter("#insert_disqus");
            let dsq = document.createElement("script");
            dsq.type = "text/javascript";
            dsq.async = true;
            dsq.src = "//" + disqus_shortname + ".disqus.com/embed.js";
            jQuery("head").append(dsq);
            this.isDisqusLoaded = true;
          }
        },
        error => UtilService.logError(error)
        );
    }
  }

  /**
   * Change between campaign and pledge view
   * @param  {Boolean} isContributionView boolean for variable
   */
  changeView(isContributionView: Boolean) {
    this.isContributionView = isContributionView;
    if (this.isContributionView === true) {
      jQuery(this.elementRef.nativeElement).find("#login-form").form({
        fields: {
          email: {
            identifier: "email",
            rules: [{
              type: "empty",
              prompt: "Please enter your email"
            }]
          }
        }
      });
      jQuery(".contact-message.form").form("clear");
      setTimeout(() => {
        jQuery("html, body").animate({
          scrollTop: jQuery("#contribute-column").offset().top
        }, "fast");
        this.setSelectedRewardBorder(true);
      });
    }
    else if (isContributionView === false) {
      jQuery("#contribution-campaign-rewards").accordion("close", this.rewardIndex);
      this.rewardContributionPageConfig.currentPage = 1;
      jQuery("#account-info .ui.form").form("clear");
      jQuery(".address-form.ui.form").form("clear");
    }
  }

  setCampaignBusinessInfo() {
    this.mCampaignBusinessInfo.name = this.mCampaign.business_organizations[0].name;
    this.mCampaignBusinessInfo.description = this.mCampaign.business_organizations[0].description;
    if (this.mCampaign.business_organizations[0].business_files && this.mCampaign.business_organizations[0].business_files.length) {
      this.mCampaignBusinessInfo.image = ConstantsGlobal.getApiUrlCampaignProfileImage() + this.mCampaign.business_organizations[0].business_files[0].path_external;
    }
    if (this.mCampaign.business_organizations[0].business_websites && this.mCampaign.business_organizations[0].business_websites.length) {
      this.mCampaignBusinessInfo.links = this.mCampaign.business_organizations[0].business_websites;
    }
  }

  /**
   * get the time unit for remaing time of campaign
   * @return {string} time unit
   */
  getCampaignRemainingUnit() {
    if (this.mCampaign.ends_date_time == null) {
      return "continue";
    }
    else if (Math.abs(parseInt(this.mCampaign.days_remaining_inclusive)) > 0) {
      return "day";
    }
    else if (Math.abs(parseInt(this.mCampaign.hours_remaining_inclusive)) > 0) {
      return "hour";
    }
    else if (Math.abs(parseInt(this.mCampaign.minutes_remaining_inclusive)) > 0) {
      return "minute";
    }
    else if (Math.abs(parseInt(this.mCampaign.seconds_remaining_inclusive)) > 0) {
      return "second";
    }
    else {
      return null;
    }
  }

  /**
   * get how long the campaign has beeing raising money
   * @return {Object} contains unit and elapsed time
   */
  getRaisedInPeriod() {
    let returnDate = {
      "unit": "",
      "elapsed": 0
    };
    let d = new Date();
    let dateNow = d.getTime();
    let startTime = this.setDateObject(this.mCampaign.starts).getTime();
    let refTime;
    if (this.mCampaign.ends) {
      refTime = dateNow < this.setDateObject(this.mCampaign.ends).getTime() ? dateNow : this.setDateObject(this.mCampaign.ends).getTime();
    }
    else {
      refTime = dateNow;
    }
    let elapsedSecond = (refTime - startTime) / 1000;
    let elapsedMinute = elapsedSecond / 60;
    let elapsedHour = elapsedMinute / 60;
    let elapsedDay = elapsedHour / 24;
    let elapsedMonth = elapsedDay / 30;
    let elapsedYear = elapsedMonth / 12;

    if (elapsedYear >= 1) {
      returnDate.elapsed = Math.floor(elapsedYear);
      if (returnDate.elapsed > 1) {
        returnDate.unit = "years";
      }
      else {
        returnDate.unit = "year";
      }
    }
    else if (elapsedMonth >= 1) {
      returnDate.elapsed = Math.floor(elapsedMonth);
      if (returnDate.elapsed > 1) {
        returnDate.unit = "months";
      }
      else {
        returnDate.unit = "month";
      }
    }
    else if (elapsedDay >= 1) {
      returnDate.elapsed = Math.floor(elapsedDay);
      if (returnDate.elapsed > 1) {
        returnDate.unit = "days";
      }
      else {
        returnDate.unit = "day";
      }
    }
    else if (elapsedHour >= 1) {
      returnDate.elapsed = Math.floor(elapsedHour);
      if (returnDate.elapsed > 1) {
        returnDate.unit = "hours";
      }
      else {
        returnDate.unit = "hour";
      }
    }
    else if (elapsedMinute >= 1) {
      returnDate.elapsed = Math.floor(elapsedMinute);
      if (returnDate.elapsed > 1) {
        returnDate.unit = "minutes";
      }
      else {
        returnDate.unit = "minute";
      }
    }
    else if (elapsedSecond >= 1) {
      returnDate.elapsed = Math.floor(elapsedSecond);
      if (returnDate.elapsed > 1) {
        returnDate.unit = "seconds";
      }
      else {
        returnDate.unit = "second";
      }
    }

    return returnDate;
  }

  /**
   * get featured image by looping through the files with correct region_id
   * @param  {Object} campaign the campaign object
   * @return {Object}          the object that has the image
   */
  getFeaturedImage(campaign, getExplore: boolean) {
    let path: string;
    let files: Array<Object> = campaign.files;
    if (files && files.length) {
      for (let i = 0; i < files.length; i++) {
        if (files[i]["region_id"] == 3) {
          if (getExplore) {
            path = ConstantsGlobal.getApiUrlCampaignThumbnailImage() + files[i]["path_external"];
          }
          else {
            path = ConstantsGlobal.getApiUrlCampaignDetailImage() + files[i]["path_external"];
          }
          return path;
        }
      }
    }
    return null;
  }

  /**
   * Set date object with date string
   * @param  {any}    date Date string
   * @return {Object}      Date object
   */
  setDateObject(date: any) {
    if (date) {
      let offset = "";
      if (typeof date === "string" && date.length < 30) {
        offset = date.substr(date.length - 3);
        date = date.substr(0, date.length - 3).replace(" ", "T");
        date = date.concat("Z");
      }
      let dateObj: any = UtilService.getDateObject(date);
      dateObj = dateObj.setHours(dateObj.getHours() + parseInt(offset) * -1);
      return UtilService.getDateObject(dateObj);
    }
  }

  getDateForDisplay(date: any) {
    return UtilService.getDateForDisplay(date);
  }

  /**
   * Get campaign streams
   */
  getCampaignStream() {
    if (!this.mCampaignStreams.length) {
      this.mCampaignService.getCampaignStream(ConstantsGlobal.CAMPAIGN_ID)
        .subscribe(
        streams => this.mCampaignStreams = streams,
        error => UtilService.logError(error)
        );
    }
  }

  getSelectedStream(stream: Object, index: number) {
    for (let prop in stream) {
      this.selectedStream[prop] = stream[prop];
    }
    this.selectedStream["index"] = index;
    this.isStreamSelected = true;
  }

  /**
   * get campaign backers
   */
  getCampaignBackers() {
    this.backersMapping();
    if (!this.mCampaignBackers.length) {
      this.mCampaignService.getCampaignBackers(ConstantsGlobal.CAMPAIGN_ID)
        .subscribe(
        res => {
          this.mCampaignBackers = res == null ? [] : res;
        },
        error => UtilService.logError(error)
        );
    }
  }

  /**
   * Select reward and save accordion item index for further control
   * @param  {number}  rewardIndex   the position of selected reward in accordion
   * @param  {boolean} openAccordion optional, open accordion or not
   */
  selectReward(rewardIndex: number, openAccordion?: boolean) {
    this.changeView(true);
    this.rewardIndex = rewardIndex > 0 ? rewardIndex + (this.rewardContributionPageConfig.currentPage - 1) * this.rewardContributionPageConfig.itemsPerPage : 0;
    if (this.rewardIndex > 0) {
      let reward = this.mCampaign.pledges[this.rewardIndex - 1];
      this.contribution["amount"] = reward.amount;
      this.contribution["rewardName"] = reward.name;
      this.pledgeParam["pledge_level_id"] = reward.pledge_level_id;
      this.guestPledgeParam["pledge_level_id"] = reward.pledge_level_id;
      if (reward.shipping && reward.shipping.length) {
        this.isRewardShipping = true;
        if (this.addressList.length) {
          this.pledgeParam["shipping_address_id"] = this.pledgeParam["shipping_address_id"] == null ? this.addressList[0]["id"] : this.pledgeParam["shipping_address_id"];
          this.selectAddress(this.addressList[0]);
          this.isAddingAddress = false;
        }
        else {
          this.isAddingAddress = true;
        }
        if (this.phoneList.length) {
          this.pledgeParam["phone_number_id"] = this.pledgeParam["phone_number_id"] == null ? this.phoneList[0]["id"] : this.pledgeParam["phone_number_id"];
          this.selectPhone(this.phoneList[0]);
          this.isAddingPhone = false;
        }
        else {
          this.isAddingPhone = true;
        }
      }
      else {
        this.isRewardShipping = false;
        this.shippingFee = 0;
        this.isAddingAddress = false;
        this.isAddingPhone = false;
      }
    }
    else {
      this.contribution["amount"] = this.minContributionAmount;
      this.contribution["rewardName"] = "Contribution";
      this.isRewardShipping = false;
      this.isAddingAddress = false;
      this.isAddingPhone = false;
      this.pledgeParam["shipping_address_id"] = null;
      this.pledgeParam["phone_number_id"] = null;
      this.pledgeParam["pledge_level_id"] = null;
      this.shippingFee = 0;
      this.calculateTotalPayment();
    }
    if (openAccordion) {
      if (this.rewardIndex > this.rewardContributionPageConfig.currentPage) {
        this.rewardPageNumber = this.rewardContributionPageConfig.currentPage;
        this.rewardIndex = this.rewardIndex - (this.rewardContributionPageConfig.currentPage - 1) * this.rewardContributionPageConfig.itemsPerPage;
        if (this.rewardContributionPageConfig.currentPage > 1) {
          jQuery(jQuery("pagination-controls#rewards-contribution-pagination").find("li").get(this.rewardContributionPageConfig.currentPage - 1)).find("span")[0].click();
        }
        this.isjQueryClicked = true;
      } else {
        this.rewardPageNumber = 1;
      }
      setTimeout(() => {
        jQuery("#contribution-campaign-rewards").accordion("open", this.rewardIndex);
      });
    }
    this.calculateTotalPayment();
  }

  setSelectedRewardBorder(toShowBorder?: boolean) {
    jQuery("#contribution-rewards .campaign-reward").removeAttr("style");
    if (toShowBorder) {
      jQuery("#contribution-rewards .campaign-reward.selected").css("background", UtilService.widgetProp.themecolor);
    }
  }

  /**
   * Select address, also calculate shipping fee
   * @param  {Object} address address object
   */
  selectAddress(address: Object) {
    if (address["address_id"]) {
      this.pledgeParam["shipping_address_id"] = address["id"];
      this.addressID = address["id"];
    }
    if (this.mCampaign && this.mCampaign.pledges && this.mCampaign.pledges.length) {
      let reward = this.mCampaign.pledges[this.rewardIndex - 1];
      if (reward && reward.shipping != null && reward.shipping.length) {
        this.calculateShippingFee(reward.shipping, address);
      }
    }
  }

  selectPhone(phone: any) {
    if (phone["id"]) {
      this.pledgeParam["phone_number_id"] = phone["id"];
      this.phoneID = phone["id"];
    }
  }

  /**
   * Calculate shipping fee with given reward shipping options and address
   * @param  {Array<any>} rewardShippings reward shipping options
   * @param  {Object}     address         address object
   */
  calculateShippingFee(rewardShippings: Array<any>, address: Object) {
    for (let index in rewardShippings) {
      if (rewardShippings[index]["subcountry_id"] == address["subcountry_id"] && rewardShippings[index]["shipping_option_type_id"] == 3) {
        this.shippingFee = rewardShippings[index]["cost"];
        break;
      }
      else if (rewardShippings[index]["country_id"] == address["country_id"] && rewardShippings[index]["shipping_option_type_id"] == 2) {
        this.shippingFee = rewardShippings[index]["cost"];
        break;
      }
      else if (rewardShippings[index]["shipping_option_type_id"] == 1) {
        this.shippingFee = rewardShippings[index]["cost"];
        break;
      }
    }
    this.calculateTotalPayment();
  }

  onRegisterSuccess(data) {
    this.loginEmail = data["email"];
    this.loginPassword = data["password"];
    this.mUserService.login(this.loginEmail, this.loginPassword).subscribe(
      data => {
        this.onLoginSuccess(data);
      },
      error => {
        this.onLoginFailed(error);
      }
    );
  }

  onRegisterContributionSuccess(data) {
    if (!jQuery(".form .field.error").length) {
      this.loginEmail = data["email"];
      this.loginPassword = data["password"];
      this.isContributionSubmitting = true;
      this.pledgeParam["amount"] = this.totalAmount;
      let exp_month, exp_year;
      if (this.cardInfo["cardDate"]) {
        exp_month = this.cardInfo["cardDate"].split(" / ")[0];
        exp_year = this.cardInfo["cardDate"].split(" / ")[1];
      }
      this.pledgeParam["inline_token"] = data["inline_token"];
      this.mStripeService.setStripeAccount(exp_month, this.cardInfo["cardNumber"], exp_year, this.cardInfo["cardCVC"], data["inline_token"]).subscribe(
        res => {
          StripeService.stripe_account_id = res["stripe_account_id"];
          this.pledgeParam["stripe_account_card_id"] = res.cards[0]["stripe_account_card_id"];
          if (this.isAddingAddress) {
            this.addressInfo["inline_token"] = data["inline_token"];
            this.phoneInfo["inline_token"] = data["inline_token"];
            this.mUserService.setNewAddress(this.addressInfo).subscribe(
              res => {
                this.pledgeParam["shipping_address_id"] = res.address_id;
                this.mUserService.setNewPhone(this.phoneInfo).subscribe(
                  res => {
                    this.pledgeParam["phone_number_id"] = res.phone_number_id;
                    this.pledge();
                  }
                );
              }
            );
          }
          else {
            this.pledge();
          }
        },
        error => {
          this.submitErrorMessage = UtilService.logError(error);
          this.isContributionSubmitting = false;
          if (!this.authToken) {
            this.switchToLogin();
          }
        }
      );
    }
  }

  onRegisterFailed(data: any) {
    this.isContributionSubmitting = false;
  }

  switchToLogin() {
    let tempInfo = {
      "email": this.registerComponent.registerInfo.email,
      "password": this.registerComponent.registerInfo.password
    };
    jQuery(".account-info-tab-menu").find(".item").tab("change tab", "login");
    this.loginComponent.loginEmail = tempInfo.email;
    this.loginComponent.loginPassword = tempInfo.password;
    this.loginComponent.logginErrorMessage = "You have successfully created your account. However there was a problem with your payment. Please correct your payment details and click Login and Contribute button.";
    this.loginComponent.isLoggedInSuccessful = false;
    this.setContributeType(this.CONTRIBUTION_TYPE_LOGIN);
  }

  /**
   * Calculate total amount to be pledged
   */
  calculateTotalPayment() {
    this.totalAmount = parseInt(this.contribution["amount"]) + parseInt(this.shippingFee);
    if (isNaN(this.totalAmount)) {
      this.totalAmount = 0;
    }
    this.pledgeParam["amount"] = this.totalAmount;
  }

  reCalcContributionAmount() {
    if (!this.contribution["amount"]) {
      this.contribution["amount"] = this.minContributionAmount;
    }
    this.calculateTotalPayment();
  }

  onContributionAmountPressed(event) {
    if (event && /\./.test(event.key) && this.settingDecimalOption > 1) {
      return false;
    }
    return true;
  }

  /**
   * Toggle between add new card view and select card view
   */
  toggleNewCard() {
    this.isAddingCard = !this.isAddingCard;
    jQuery(".credit-card-form .ui.form").form("clear");
  }

  /**
   * Select a card from dropdown
   * @param  {Object} card Card object in cards array
   */
  selectCard(card: Object) {
    if (card["stripe_account_card_id"]) {
      StripeService.stripe_account_card_id = card["stripe_account_card_id"];
      this.pledgeParam["stripe_account_card_id"] = StripeService.stripe_account_card_id;
    }
  }

  /**
   * Get card type with given stripe account card type id
   * @param  {number} cardTypeId stripe account card type id
   * @return {string}            path for card"s image
   */
  getCardType(cardTypeId: number) {
    switch (cardTypeId) {
      case 1:
        return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAcCAYAAAAX4C3rAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3wkPEwQ0IXda5QAAAvNJREFUWMPtll2IjFEcxn/zzqeZ3R0zO4u1g12zVrIktIhNIm4UiVyQfCREbBLJhYgkN4oLKSStFOVC2ZbCZvPRUutrGGbFsqbBsrPzPfu+57h412ykLOvCMs/V6fS+nd95/s9TxzByyxNJP5BCP1EONAf6t8sgpcy1/r8ENf1w97jhx1+bC2BVpB846hwFQDSl4avx46vxk0gLdpxtw1fjp6klDkC6S1Db+In5h1qYvCvA1jNtCNFThetPoozZ9hRfjZ+OuNYHR8esg0wnGG1E3j3GGWvS9weOBuCGPwbAwslO7FaFmwEdsMRtQdUks/cHCXWolBZZKHGZufqoE0UpAUAIyebTb8moOvjL92kmltl/E7T6WHYp4iqrD5zg5PD1SIcXA3C47gMAm+Z60IQkHFEBKMwz4m9LEepQmVpup3ZTaRbuqx60JklkJOWDLQTDGe69TPQK9KejdzlM3O+ayerWY6SsI/gYVXn1IcNQl5myQVaiSaHH1whWs4LTbgTgTjDBqYZ2NCFRlJ7MH7z0HoAjK70A1D+M/rmMLqpy0hCr5o1jDnXNnQDsXDAYgFBHFwBVPgcAIzwW9i4eAsC+i2Gq97wgltJz2B5TaWpJML3CQUWxjTyrQvPr5DeO9wl03vgCABreuDlSr499dmUeAMFwuhu0Z3zLZrhp2lfBuGE2whE1G5Xaxs8AzJ9YQDIjmFA6AIBPvShUr0DHem3ZsbXHNJbPcGE16b8+eJ0EoHKYDSlltiTuPBNrZhUCEE8LVE1y9IoOvPNciMrtz2jsLmFL92V/vUzfKX+AEaddIZLQ87i2GwDg1nP9sLJBViIJwaRdASq9NoQEf1sKgA1zPNx+EUcTuvNLpw0EIPAuzfFr7dwNJphS7ug7qA7n4dztzxS7zHgLLQBIKYmnBV63maJ8E0JKFlc5uRmIo2qSFdUuNs4twpNvYveFEF63mb1Lihk1xApAKiO43NzJw9Zk7lGSA/0HXk/nDTlHc6A50D+gL+loLFjxf8xyAAAAAElFTkSuQmCC";
      case 2:
        return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAcCAYAAAAX4C3rAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3wkPEwwVpcfAswAAA7dJREFUWMPtl1tsFFUYx38zO3vpXrq7Xbpbbe0FbaJUhKaNpEQEChYUNTyBEjEhPqAJiTEUGh+8IsZgTYgxCiYUXyQaYvqg2Io0aSwXhdBSBRt6oU3s/bK73Qt76eweH4pDlqWUxzXZfzLJnDnfmfOb75zzP2ckIYQ4NRLhw78CDIVUMknFFh3vP2FnS2EO0qnhm2LXBS+ZrBNPuZCebBkXmZbJO1VqVZAzHRJgKKQi8z9RFjQLmulS7vZQAga2PoBFuf0dh64F2F+RmxZb1jxKNCHovyN+MfUF5lj36yR5RpnfN3vS2m7vmKZ9InZv0PUFRsKqoPrnMZJCUGpV+GWDG4BtHdN0e+MAHKtx8dojFnoDakp8kUWhbaObDWcmGQ6n258sSXy1yklrbT5LbQqNfwc5MRhmtdvI8RoXr//hTYFcEPRQpYO3u/x440mMMlzxzfHbRJSnPSZuBFX8cwKAfZ1+OurcBFVB/WUf3ngSAPWWNw+FVEKqoNyW2k1fUOXljhl+XJ/P4Z4gX/aGsOslPq928s4VP83/RBYf+kqnHk+OjtbRKAYZDlc7eeOij3e7Z2mvM2lxJRYdN0IqXd44y50GWkajWBWJuaRIm0ZvPmrTysvserp9cd667OfF9ikSAsw6iXObPHwzEObr/vD9zdHGKgcH/pxFFVBXYKLKZcCsk+gJqAwE57S4AyvsvHrey95OP2vdRhICdpdb+eJ6MOV9AthzyaeV13mMfL9mCT+NRGgbnx/e79a4UGSJg1cD97eYHrYqPO4w8MLgNACnx6KcHotq9Q1ds9r9pgdzyDfKXA+oDIVUDDLUL7OlgcrAD2uXaOWHzDqO9IZoG4+hSKAK2HF2hovPetj7mI3GnuDioB+ttNPUH+JmYn5evVRq1uo+vhrg7GQMt+n26myoyKW+008sCTvLzMiSlNZBEtjf6U/JcH9QRS9B2zNuvh0Mc7QvzOrWCTq3FDATT3J8ILywj3pMMrUFJs6MR3HoJY6scmLTy5ybirGtxMz2EjN2vURSgEM/D7RzqYVym4LbJPPBCvt8xiwKpVZFO/U49BJT0YR2TUcT5BtlWmrzmYgkaKjIZcethOy55OOTSgdbi3LSLdN9clgAfFbl4JUyS+rxqnmUSELwfKGJYzWutMZH+0LsLrcC8Om1APvu4rMLqWUkwq4LXorMOs5v9mCQpXv6qAaa3UKzoFnQLGiGgf5nzhn/u/ze8tyMBz240o78XGEOTTV5FFt0GQdYbNHRVJPHxgIT/wIHPWlnkbJpKwAAAABJRU5ErkJggg==";
      case 3:
        return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAcCAYAAAAX4C3rAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3wkPEwsjJTzD7QAABH5JREFUWMPtmG1sU2UUx3/3tr3d7Vq6rttoN8eG4IARcCIMRtyCAx1OQDCBGEIkBP1AglkCiDGKLqAJMYAZQtDxQRc+QTSEYAjyIgQNaTZgc7xsbBM2unWvbSlbX9a1vX7gTaKMC8OkJJ7kfrg3J8/95Tzn/M95HkFRFOW04yK79/1MR5ebeLL0tGTWrlzInFlTEE47Lioff/UD8WzbP3kPzYCUWd4/EIxr0MvNbYjxtt3/Zh1dbkSeEXtmQLWP5a0oZIb8FLq7yb/ZS2o4RLde5rzZyhmrDWdCIgjCXWfy7D0sntjMi9YuzNogvohMvWc0BxtyqOtMAwTVvxYK3l6vqHG0hAfZ2niOjFDgoT7OBAObJryMnBamsuQIZu3Di9QXkfngZAktbsvTA80Z8LHtSrWqPBFHhTGV9aCxqovUZ9WvcqIle+Q5ag2HVEMK+igJ03sYOgsxlYq3Of8UOSmeEYIqClsaL6iuOP3UvntpF6lWn/oVxceA2JODZgX9jAn51eWQMYw4aujee+zW7UeNmbVBZo3pUg+q0Yjs3ryGovzJmIwy279ci6503jB0AtKS0tvyYfvnXsfaAVGCl7bDwmswaeNDl1o6qREAg6ynvGz58PKUYhlFZnoqYzNtZNhSsCSbGXJ7MO79GjHdhnLTh//Dckw/fU/M6SK4tYLEbZuJub0krJiJmD0evJ0MVW1Av+Mi0WPbYFYh3NgPtRtA0MCMPWDKgaF+qH4fik9C8x6mTUjiyDtrqG+8jqvbPXxEx2fZOXTMQYbNSprVjE6AaFs7wZ2VhCqr0BUVoJ2RR6zVycDqMpAkghXfobi9aKbOJvLjF4jTShFfyEfp7yVych/YX4eOw4ACSgSadsHVnZBWCElTIdQJ3lr0aTMoXfU5oVCY2svXhgfNmzyO85daWFCcz4nf69BmZSK9Ngfd3CKibR1Em/4kfOgowR17SKo5ju6VmUQu1COYjMTaGlA8LsKbiiDRQvR4JYIwAEoMpOQ7c9sCSH8T/K3gbwPZDs3fgkbP0K1WBEFgXLadlrbO4UFzx2fS0uqi+o8mXD0e2s5UE6mpRZpfjH7ZIgYP/4Jp/14M5RsJbK0g2u7CuGMLkUsNKGEJ6aODiLOXIabnELt6Fk2qAqffuL298+sg1AXPvQXZy+HGATDngvcC9DkIGKawZf0KZL1En8f3eII/NtDPN5cc6qreMIRc0P3AN6kIRLO6yl/3WwkOZ/qTydN12UhHgkHdGBDQERvQ3V/YpB5yIKrH4bSNQPAFgU8nTFMt3IN19/umNl+94Jf9WvJIlEc2nV69zMZJ09VFdVBL6HwqUgGIBpUt9NwcGnqtI2yhd+yKycLKvEKcj0iDVjmRVVlzWVGzBF9EHtbXF5FZfXwRR5vGPt0x727vfz7Qz7w+F1NueRkT9NMr6TmbPJpTKXauy8YH5tHpGd0szW0kN6kHizaAPyZR77Vz4MpEatpt/808+v9RRC1ohs0a95AZNivi2ncXxj3outWLEe5e6eyqOoyrxxNXgH+/0vkL3n+p0OJ0uEsAAAAASUVORK5CYII=";
    }
  }

  /**
   * Add stripe card with parsed exp month and exp year
   * @param  {number} exp_month parsed month
   * @param  {number} exp_year  parsed year
   */
  addStripeCard(exp_month: number, exp_year: number, inlineToken?: string) {
    this.mStripeService.setStripeAccountCard(this.cardInfo["cardName"], exp_month, this.cardInfo["cardNumber"], exp_year, this.cardInfo["cardCVC"], inlineToken).subscribe(
      res => {
        StripeService.stripe_account_card_id = res["stripe_account_card_id"];
        this.pledgeParam["stripe_account_card_id"] = StripeService.stripe_account_card_id;
        if (this.isAddingAddress) {
          this.mUserService.setNewAddress(this.addressInfo).subscribe(
            res => {
              this.pledgeParam["shipping_address_id"] = res.address_id;
              if (this.isAddingPhone) {
                this.mUserService.setNewPhone(this.phoneInfo).subscribe(
                  res => {
                    this.pledgeParam["phone_number_id"] = res.id;
                    this.pledge();
                  }
                );
              }
              else {
                this.pledge();
              }
            }
          );
        }
        else {
          if (this.isAddingPhone) {
            this.mUserService.setNewPhone(this.phoneInfo).subscribe(
              res => {
                this.pledgeParam["phone_number_id"] = res.id;
                this.pledge();
              }
            );
          }
          else {
            this.pledge();
          }
        }
      },
      error => {
        UtilService.logError(error);
        this.isContributionSubmitting = false;
        this.submitErrorMessage = "error_processing_card";
      }
    );
  }

  /**
   * Toggle between add new card view and select card view
   */
  toggleNewAddress() {
    this.isAddingAddress = !this.isAddingAddress;
    if (!this.isAddingAddress) {
      for (let index in this.addressList) {
        if (this.addressList[index]["id"] == this.addressID) {
          this.selectAddress(this.addressList[index]);
          break;
        }
      }
    }
    jQuery(".address-form .ui.form").form("clear");
  }

  toggleNewPhone() {
    this.isAddingPhone = !this.isAddingPhone;
    if (!this.isAddingPhone) {
      for (let index in this.phoneList) {
        if (this.phoneList[index]["id"] == this.addressID) {
          this.selectPhone(this.phoneList[index]);
          break;
        }
      }
    }
    jQuery(".phone-form .ui.form").form("clear");
  }

  /**
   * Contribute as logged in or guest
   * @param  {string} type Logged in or guest
   */
  setContributeType(type: string) {
    this.contributionType = type;
    jQuery("#account-info .ui.form").form("clear");
  }

  setCreatingAccount() {
    jQuery("#account-info .ui.form").form("clear");
    this.contributionType = "";
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

  formValidationGuestCheckout() {
    jQuery("#guest-form.ui.form").form({
      inline: true,
      fields: {
        GuestEmail: {
          identifier: "GuestEmail",
          rules: [
            {
              type: "empty",
              prompt: "Please enter your email"
            },
            {
              type: "email",
              prompt: "Please enter a valid email"
            }
          ]
        }
      }
    }).form("validate form");
  }

  formValidationRegister() {
    jQuery("#register-form").form({
      inline: true,
      onSuccess: () => {
        this.isRegisterFormValid = true;
      },
      onFailure: () => {
        this.isRegisterFormValid = false;
      },
      fields: {
        FirstName: {
          identifier: "FirstName",
          rules: [
            {
              type: "empty",
              prompt: "Please enter your first name"
            }
          ]
        },
        LastName: {
          identifier: "LastName",
          rules: [
            {
              type: "empty",
              prompt: "please enter your last name"
            }
          ]
        },
        registerEmail: {
          identifier: "registerEmail",
          rules: [
            {
              type: "empty",
              prompt: "Please enter your email"
            },
            {
              type: "email",
              prompt: "Please enter a valid email"
            }
          ]
        },
        Pass: {
          identifier: "Pass",
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
        },
        PasswordConfirm: {
          identifier: "PasswordConfirm",
          rules: [
            {
              type: "empty",
              prompt: "Please enter your password"
            },
            {
              type: "match[Pass]",
              prompt: "Your password doesn't match"
            }
          ]
        }
      }
    }).form("validate form");
  }

  formValidationCard() {
    jQuery(".credit-card-form .ui.form").form({
      inline: true,
      fields: {
        CardName: {
          identifier: "CardName",
          rules: [
            {
              type: "empty",
              prompt: "Please enter your name"
            }
          ]
        },
        CardNumber: {
          identifier: "CardNumber",
          rules: [
            {
              type: "empty",
              prompt: "Please enter your number"
            }
          ]
        },
        CardDate: {
          identifier: "CardDate",
          rules: [
            {
              type: "empty",
              prompt: "Please enter your expiring date"
            }
          ]
        },
        CardCVC: {
          identifier: "CardCVC",
          rules: [
            {
              type: "empty",
              prompt: "Please enter your CVC number"
            },
            {
              type: "integer",
              prompt: "Please enter a valid number"
            }
          ]
        }
      }
    }).form("validate form");
  }

  formValidationAddress() {
    jQuery(".address-form.ui.form").form({
      inline: true,
      fields: {
        Street: {
          identifier: "Street",
          rules: [
            {
              type: "empty",
              prompt: "Please enter your street address"
            }
          ]
        },
        City: {
          identifier: "City",
          rules: [
            {
              type: "empty",
              prompt: "Please enter your city"
            }
          ]
        },
        MailCode: {
          identifier: "MailCode",
          rules: [
            {
              type: "empty",
              prompt: "Please enter your zip code"
            }
          ]
        }
      }
    }).form("validate form");
  }

  formValidationPhone() {
    jQuery(".phone-form.ui.form").form({
      inline: true,
      fields: {
        phoneNumber: {
          identifier: "phoneNumber",
          rules: [
            {
              type: "empty",
              prompt: "Please enter your phone number"
            }
          ]
        },
        phoneType: {
          identifier: "phoneType",
          rules: [
            {
              type: "empty",
              prompt: "Please choose the phone type"
            }
          ]
        }
      }
    }).form("validate form");
  }

  formValidation() {
    if (this.contributionType == this.CONTRIBUTION_TYPE_LOGIN) {
      this.formValidationLogin();
    }
    else if (this.contributionType == this.CONTRIBUTION_TYPE_GUEST) {
      this.formValidationGuestCheckout();
    }
    else if (this.contributionType == this.CONTRIBUTION_TYPE_REGISTER) {
      this.isAddingCard = true;
      this.formValidationRegister();
    }
    jQuery(".contribution-input.ui.form").form({
      on: "blur",
      inline: true,
      fields: {
        amount: {
          identifier: "amount",
          rules: [
            {
              type: "empty",
              prompt: "Please enter a number"
            },
            {
              type: "number",
              prompt: "Please enter a valid number"
            }
          ]
        }
      }
    }).form("validate form");

    if (this.isAddingCard) {
      this.formValidationCard();
    }
    if (this.isAddingAddress) {
      this.formValidationAddress();
      this.formValidationPhone();
    }
    if (this.isAddingPhone) {
      this.formValidationPhone();
    }
  }

  /**
   * Function called when login success
   * @param data {Object} data in success callback
   */
  onLoginSuccess(data) {
    this.isLoggedInSuccessful = true;
    this.contributionType = this.CONTRIBUTION_TYPE_LOGIN;
    this.userInfo = {
      "first_name": data.first_name
    };
    this.stripeCards = [];
    this.mUserService.getUserData(data);
    this.authToken = CookieService.getAuth();
    this.personId = CookieService.getPersonID();
    UserService.getAuthFromCookie();
    this.getProfile();
    this.mCampaignService.refreshAuthToken();
    this.mStripeService.refreshAuthToken();
    this.mStripeService.getStripeAccount().subscribe(
      res => {
        if (res.length) {
          StripeService.stripe_account_id = res[0]["stripe_account_id"];
          this.getStripeAccountCard();
        }
      },
      error => UtilService.logError(error)
    );
    this.getUserAddress();
    this.getUserPhone();
  }

  onLoginFailed(error) {
    UtilService.logError(error);
    this.isLoggedInSuccessful = false;
  }

  /**
   * Set contribution method, anonymous or not
   * @param method {Object} method object
   */
  setContributionMethod(method) {
    this.pledgeParam["anonymous_contribution_partial"] = 0;
    this.pledgeParam["anonymous_contribution"] = 0;
    switch (method.id) {
      case 1:
        this.pledgeParam["anonymous_contribution_partial"] = 1;
        break;
      case 2:
        this.pledgeParam["anonymous_contribution"] = 1;
        break;
    }
  }


  /**
   * Translate Function
   */
  translate(name) {
    return TranslationService.translation[name];
  }

  /**
   * Submit and process existing info to make contribution
   * There must be a better way to deal with this Rx
   */
  submitContribution() {
    this.submitErrorMessage = "";
    this.formValidation();
    if (!jQuery(".form .field.error").length && !this.isContributionSubmitting) {
      this.isContributionSubmitting = true;
      this.pledgeParam["amount"] = this.totalAmount;
      let exp_month, exp_year;
      if (this.cardInfo["cardDate"]) {
        exp_month = this.cardInfo["cardDate"].split(" / ")[0];
        exp_year = this.cardInfo["cardDate"].split(" / ")[1];
      }
      if (this.contributionType == this.CONTRIBUTION_TYPE_LOGIN) {
        if (this.isAddingCard && !StripeService.stripe_account_id) {
          this.mStripeService.setStripeAccount(exp_month, this.cardInfo["cardNumber"], exp_year, this.cardInfo["cardCVC"]).subscribe(
            res => {
              StripeService.stripe_account_id = res["stripe_account_id"];
              this.addStripeCard(exp_month, exp_year);
            },
            error => {
              UtilService.logError(error);
            }
          );
        }
        else {
          if (this.isAddingCard) {
            this.addStripeCard(exp_month, exp_year);
          }
          else {
            if (this.isAddingAddress) {
              this.mUserService.setNewAddress(this.addressInfo).subscribe(
                res => {
                  this.pledgeParam["shipping_address_id"] = res.address_id;
                  if (this.isAddingPhone) {
                    this.mUserService.setNewPhone(this.phoneInfo).subscribe(
                      res => {
                        this.pledgeParam["phone_number_id"] = res.id;
                        this.pledge();
                      }
                    );
                  }
                  else {
                    this.pledge();
                  }
                }
              );
            }
            else {
              if (this.isAddingPhone) {
                this.mUserService.setNewPhone(this.phoneInfo).subscribe(
                  res => {
                    this.pledgeParam["phone_number_id"] = res.id;
                    this.pledge();
                  }
                );
              }
              else {
                this.pledge();
              }
            }
          }
        }
      }
      else if (this.contributionType == this.CONTRIBUTION_TYPE_REGISTER) {
        if (this.registerComponent) {
          this.registerComponent.register();
        }
      }
      else if (this.contributionType == this.CONTRIBUTION_TYPE_GUEST) {
        this.mStripeService.setGuestStripeAccount(
          this.cardInfo["cardName"],
          exp_month,
          this.cardInfo["cardNumber"],
          exp_year,
          this.cardInfo["cardCVC"],
          this.cardInfo["email"]
        ).subscribe(
          res => {
            this.guestPledgeParam = {
              "card_id": res.card_id,
              "email": this.cardInfo["email"],
              "amount": this.totalAmount,
              "fingerprint": res.fingerprint
            };
            this.pledgeParam["card_id"] = res.card_id;
            if (this.isAddingAddress) {
              this.mUserService.setGuestAddress(this.addressInfo).subscribe(
                res => {
                  this.guestPledgeParam["shipping_address_id"] = res.id;
                  this.pledgeAsGuest();
                }
              );
            }
            else {
              this.pledgeAsGuest();
            }
          },
          error => {
            this.isContributionSubmitting = false;
            UtilService.logError(error);
          }
          );
      }
    }
  }

  pledge() {
    this.mCampaignService.pledge(ConstantsGlobal.CAMPAIGN_ID, this.pledgeParam).subscribe(
      res => {
        this.getCampaign();
        if (this.authToken) {
          this.getStripeAccountCard();
          this.getUserAddress();
          this.getUserPhone();
        }
        else {
          this.mUserService.login(this.loginEmail, this.loginPassword).subscribe(
            data => {
              this.onLoginSuccess(data);
            },
            error => {
              this.onLoginFailed(error);
            }
          );
        }
        this.isPledgingSuccess = true;
        this.isContributionSubmitting = false;
        this.isContributionView = false;
        this.resetPledgeParam();
      },
      error => {
        this.pledgeError(error);
        if (!this.authToken) {
          this.switchToLogin();
        }
      }
    );
  }

  pledgeAsGuest() {
    this.mCampaignService.pledgeAsGuest(ConstantsGlobal.CAMPAIGN_ID, this.guestPledgeParam)
      .subscribe(
      res => {
        this.getCampaign();
        this.isPledgingSuccess = true;
        this.isContributionSubmitting = false;
        this.resetPledgeParam();
      },
      error => {
        this.pledgeError(error);
      }
      );
  }

  pledgeError(error: any) {
    this.isContributionSubmitting = false;
    this.submitErrorMessage = UtilService.logError(error);
  }

  /**
   * Get stripe account cards for current user
   */
  getStripeAccountCard() {
    this.mStripeService.getStripeAccountCard().subscribe(
      res => {
        if (res.length) {
          this.isAddingCard = false;
          this.stripeCards = res;
          this.selectCard(res[0]);
        }
        else {
          this.isAddingCard = true;
        }
      },
      error => UtilService.logError(error)
    );
  }

  getUserAddress() {
    this.mUserService.getAddress().subscribe(
      res => {
        if (res.personal && res.personal.length) {
          this.addressList = res.personal;
        }
        if (this.addressList.length) {
          this.isAddingAddress = false;
          this.selectAddress(this.addressList[0]);
        }
      },
      error => UtilService.logError(error)
    );
  }

  getUserPhone() {
    this.mUserService.getPhone().subscribe(
      res => {
        if (res != null && res.personal != null && res.personal.length) {
          this.phoneList = res.personal;
        }
        if (this.phoneList.length) {
          this.isAddingPhone = false;
          this.selectAddress(this.phoneList[0]);
        }
      },
      error => UtilService.logError(error)
    );
  }

  onRewardsContributionPageChange(evt) {
    this.rewardContributionPageConfig.currentPage = evt;
    if (evt == this.rewardPageNumber) {
      setTimeout(() => {
        jQuery("#contribution-campaign-rewards").accordion("open", this.rewardIndex);
        this.setSelectedRewardBorder(true);
      });
    }
    if (this.isjQueryClicked) {
      setTimeout(() => {
        this.isjQueryClicked = false;
      }, 10);
    }
  }

  onCampaignBackerPageChange(evt) {
    this.campaignBackersConfig.currentPage = evt;
  }

  onCampaignStreamsPageChange(evt) {
    this.campaignStreamsConfig.currentPage = evt;
  }

  onCamapginFaqsChange(evt) {
    this.campaignFaqsConfig.currentPage = evt;
  }

  setCurrentTab(value: string) {
    if (value == "comments") {
      this.isCommentTab = true;
      this.isContactTab = false;
    }
    else if (value == "contact") {
      this.isCommentTab = false;
      this.isContactTab = true;
    }
  }

  showLoginOrSignup(form: string) {
    switch (form) {
      case "login":
        this.isFormLogin = true;
        break;
      case "signup":
        this.isFormLogin = false;
        break;
    }
  }

  setMessageToManager() {
    let isMessageValidated = false;
    // Need to replace newline with actual html tags to render properly in email clients
    this.contactManagerMessage.body = this.contactManagerMessage.body.replace(/(\r\n|\n|\r)/gm, "<br>");
    jQuery(".contact-message.form").form({
      inline: true,
      onSuccess: function () {
        isMessageValidated = true;
      },
      onFailure: function () {
        isMessageValidated = false;
      },
      fields: {
        Subject: {
          identifier: "Subject",
          rules: [
            {
              type: "empty",
              prompt: "Please enter your subject"
            }
          ]
        },
        Body: {
          identifier: "Body",
          rules: [
            {
              type: "empty",
              prompt: "Please enter your message body"
            }
          ]
        }
      }
    }).form("validate form");

    if (isMessageValidated) {
      jQuery(".contact-message .actions .button").addClass("loading");
      let headers = new Headers();
      headers.append("X-Auth-Token", this.authToken);
      let options = new RequestOptions({
        headers: headers
      });

      this.contactManagerMessage.person_id = this.mCampaign.managers[0].id;

      this.http.post(ConstantsGlobal.API_URL + "account/message", JSON.stringify(this.contactManagerMessage), options)
        .map(res => res.json())
        .subscribe(
        res => {
          jQuery(".contact-message .actions .button").removeClass("loading");
          this.isContactMessageSent = true;
          this.contactManagerMessage = {
            "person_id": "",
            "subject": "",
            "body": ""
          };
        },
        error => UtilService.logError(error)
        );
    }
  }

  getSiteLogo() {
    this.mSettingsService.getSiteLogo().subscribe(
      res => {
        for (let i = 0; i < res.length; i++) {
          if (res[i]["name"] == "site_logo") {
            if (res[i]["value"].hasOwnProperty("path_external")) {
              this.siteLogo["image"] = ConstantsGlobal.API_HOST + "/image/site_logo_320x80/" + res[i]["value"]["path_external"];
            }
          }
          if (res[i]["name"] == "site_logo_link") {
            if (res[i]["value"] != null && res[i]["value"] != "") {
              this.siteLogo["link"] = res[i]["value"];
            }
          }
        }
      },
      error => UtilService.logError(error)
    );
  }

  /**
   * Log current user out
   */
  logout() {
    this.mUserService.logout().subscribe(
      () => {
        jQuery(".account-dropdown").dropdown("hide");
        CookieService.deleteAuth();
        this.authToken = CookieService.getAuth();
        this.userInfo["first_name"] = CookieService.getFirstName();
        this.addressList = [];
        this.isAddingAddress = true;
        this.shippingFee = 0;
      },
      error => UtilService.logError(error)
    );
  }

  showLoggedInUserProfile() {
    this.isProfileShown = true;
  }

  closeMessage() {
    this.isPledgingSuccess = false;
  }

  resetPledgeParam() {
    this.pledgeParam = {
      "amount": null,
      "anonymous_contribution": null,
      "anonymous_contribution_partial": null,
      "pledge_level_id": null,
      "stripe_account_card_id": null,
      "shipping_address_id": null
    };

    this.guestPledgeParam = {
      "card_id": null,
      "email": null,
      "amount": null,
      "fingerprint": null,
      "pledge_level_id": null,
      "shipping_address_id": null
    };

    this.addressInfo = {
      "city_id": 0,
      "street1": "",
      "street2": "",
      "mail_code": ""
    };

    this.phoneInfo = {
      "number": null,
      "phone_number_type_id": null
    };
  }

  onBackToCampaignPage(evt: any) {
    this.isContributionView = false;
    this.isProfileShown = false;
    this.getProfile();
  }

  onUpdateUserInfo(evt: any) {
    this.userInfo = evt;
  }

  onUpdateProfileResourceId(evt: any) {
    this.profileResourceId = evt;
  }
}
