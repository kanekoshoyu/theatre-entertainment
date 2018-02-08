app.config(["$routeProvider","$locationProvider","RestangularProvider","$httpProvider","API_URL","LANG","flowFactoryProvider","ngQuickDateDefaultsProvider","uiSelectConfig","$analyticsProvider","$provide","$compileProvider","$sceDelegateProvider","CDN",function($routeProvider,$locationProvider,RestangularProvider,$httpProvider,API_URL,LANG,flowFactoryProvider,ngQuickDateDefaultsProvider,uiSelectConfig,$analyticsProvider,$provide,$compileProvider,$sceDelegateProvider,CDN){$httpProvider.interceptors.push("authHttpInterceptor"),$httpProvider.defaults.useXDomain=!0,$httpProvider.defaults.withCredentials=!1,delete $httpProvider.defaults.headers.common["X-Requested-With"],RestangularProvider.setBaseUrl(API_URL.url+API_URL.loc),$locationProvider.html5Mode(!0),uiSelectConfig.theme="select2",$routeProvider.when("/",{templateUrl:"views/templates/index.a18a9b4f.html",controller:"HomeCtrl"}).when("/register/confirm/:validation_token?",{templateUrl:"views/templates/login-register.a18a9b4f.html",controller:"RegConfirmCtrl",title:"Confirm Account"}).when("/register",{templateUrl:"views/templates/login-register.a18a9b4f.html",title:"Register"}).when("/login",{templateUrl:"views/templates/login-register.a18a9b4f.html",title:"Login"}).when("/getstarted/:campaign_id?",{templateUrl:"views/templates/getstarted.a18a9b4f.html",controller:"CreateCampaignCtrl",title:"Get Started"}).when("/explore",{templateUrl:"views/templates/explore.a18a9b4f.html",controller:"ExploreCtrl",title:"Explore",reloadOnSearch:!1}).when("/campaign-setup/:campaign_id",{templateUrl:"views/templates/campaign-setup.a18a9b4f.html",controller:"CreateCampaignCtrl",title:"Campaign Setup"}).when("/campaign-widget/:campaign_id",{templateUrl:"views/templates/campaign-widget.a18a9b4f.html",controller:"WidgetCtrl",title:"Widget Setup"}).when("/campaign-setup",{templateUrl:"views/templates/campaign-setup.a18a9b4f.html",controller:"CreateCampaignCtrl",title:"Campaign Setup"}).when("/profile-setup/:campaign_id",{templateUrl:"views/templates/profile-setup.a18a9b4f.html",controller:"UserProfileCtrl",title:"Profile Setup"}).when("/api-docs",{templateUrl:"views/templates/api-docs.a18a9b4f.html",controller:"ApiDocsCtrl",title:"API Docs",reloadOnSearch:!1}).when("/admin/dashboard",{templateUrl:"views/templates/portal-setting.a18a9b4f.html",controller:"PortalSettingCtrl",title:"Admin Dashboard",reloadOnSearch:!1}).when("/authenticate/forgot/:token",{templateUrl:"views/templates/forgot-password.a18a9b4f.html",controller:"ResetPasswordCtrl",title:"Forgot Password"}).when("/account/email/confirm/:token",{templateUrl:"views/templates/confirm-email.a18a9b4f.html",controller:"confirmEmailCtrl",title:"Confirm Email"}).when("/campaign-review/:campaign_id",{templateUrl:"views/templates/campaign-review.a18a9b4f.html",controller:"campaignReviewCtrl",title:"Campaign Review"}).when("/pledge-retry",{templateUrl:"views/templates/retry-card.a18a9b4f.html",controller:"RetryCardCtrl",title:"Retry Card"}).when("/profile/:person_id?",{templateUrl:"views/templates/profile.a18a9b4f.html",controller:"ProfileCtrl",title:"Profile"}).when("/pledge-history",{templateUrl:"views/templates/pledge-history.a18a9b4f.html",controller:"PledgeHistoryCtrl",title:"Pledge History",reloadOnSearch:!1}).when("/campaign-manager",{templateUrl:"views/templates/campaign-management.a18a9b4f.html",controller:"CampaignManagementCtrl",title:"Campaign Management",reloadOnSearch:!1}).when("/profile-setting",{templateUrl:"views/templates/profile-setting.a18a9b4f.html",controller:"ProfileSettingCtrl",title:"Profile Settings",reloadOnSearch:!1}).when("/payment-setting",{templateUrl:"views/templates/payment-setting.a18a9b4f.html",controller:"PaymentSettingCtrl",title:"Payment Settings",reloadOnSearch:!1}).when("/404",{templateUrl:"views/templates/404.a18a9b4f.html",controller:"SiteErrorCtrl",title:"404 Error"}).when("/rewards",{templateUrl:"views/templates/rewards.a18a9b4f.html",controller:"CreateCampaignCtrl",title:"Rewards"}).when("/rewards/:campaign_id",{templateUrl:"views/templates/rewards.a18a9b4f.html",controller:"CreateCampaignCtrl",title:"Rewards"}).when("/complete-funding",{templateUrl:"views/templates/complete-funding.a18a9b4f.html",controller:"CompleteFundingCtrl",title:"Complete Funding"}).when("/complete-funding/:campaign_id",{templateUrl:"views/templates/complete-funding.a18a9b4f.html",controller:"CompleteFundingCtrl",title:"Complete Funding"}).when("/start",{templateUrl:"views/templates/start.a18a9b4f.html",controller:"StartCtrl",title:"Start Your Project"}).when("/campaign-preview/:campaign_id",{templateUrl:"views/templates/campaign-preview.a18a9b4f.html",controller:"CampaignPreviewCtrl",title:"Campaign Preview"}).when("/pledge-campaign",{templateUrl:"views/templates/pledge-campaign.a18a9b4f.html",controller:"PledgeCampaignCtrl",title:"Contribute to Campaign"}).when("/stripe/connect",{templateUrl:"views/templates/stripe-connect.a18a9b4f.html",controller:"StripeConnectCtrl",title:"Stripe Connect"}).when("/message-center",{templateUrl:"views/templates/message-center.a18a9b4f.html",controller:"MessageCenterCtrl",title:"Message Center"}).when("/message-center/:message_id/:person_id_sender",{templateUrl:"views/templates/message-center.a18a9b4f.html",controller:"MessageCenterCtrl",title:"Message Center"}).when("/campaign-manager/stream-management/:campaign_id",{templateUrl:"views/templates/stream-management.a18a9b4f.html",controller:"StreamManageCtrl",title:"Manage Stream"}).when("/campaign-manager/transactions/:campaign_id",{templateUrl:"views/templates/transaction-details.a18a9b4f.html",controller:"TransactionDetailsCtrl",title:"Transactions"}).when("/inline-contribution",{templateUrl:"views/templates/inline-contribution.a18a9b4f.html",controller:"InlineContributionCtrl",title:"Inline Contribution"}).when("/embed/card-view/:campaign_id",{templateUrl:"views/templates/partials/campaign/embed/card_view.a18a9b4f.html",controller:"EmbedViewsCtrl",title:"Card View"}).when("/testings",{templateUrl:"views/templates/api.a18a9b4f.html",controller:"ApiCtrl",resolve:{apiDocs:["$http",function($http){return $http.get("/docs/api_docs.json")}]}}).when("/server-error",{templateUrl:"views/templates/server-not-available.a18a9b4f.html"}).when("/#!",{redirectTo:"/"}).when("/!",{redirectTo:"/"}).when("/#",{redirectTo:"/"}).when("/#",{redirectTo:"/"}).when("/#!1",{redirectTo:"/"}).when("/!1",{redirectTo:"/"}).otherwise({resolve:{valid:function(ValidateURLService){return ValidateURLService.validate()}},templateUrl:"views/templates/custom-page.a18a9b4f.html",controller:"CustomPageCtrl",reloadOnSearch:!1}),flowFactoryProvider.defaults={target:API_URL.url+API_URL.loc+"/photos",query:function(file,chunk){return{mediaType:file.file.type}},singleFile:!0},$sceDelegateProvider.resourceUrlWhitelist(["self",CDN.APP_URL]);var calendar_translation_error=function(){$.get("views/translation/"+LANG.DEFAULT_LANG+"/calendar.json",function(data){var date_translation=data.date_label,time_translation=data.time_label,sunday=data.weekday_short_sun,mon=data.weekday_short_mon,tues=data.weekday_short_tues,weds=data.weekday_short_weds,thurs=data.weekday_short_thurs,fri=data.weekday_short_fri,sat=data.weekday_short_sat,PLURAL_CATEGORY={ZERO:"zero",ONE:"one",TWO:"two",FEW:"few",MANY:"many",OTHER:"other"};$provide.value("$locale",{DATETIME_FORMATS:{AMPMS:[data.am,data.pm],DAY:[data.weekday_sun,data.weekday_mon,data.weekday_tues,data.weekday_weds,data.weekday_thurs,data.weekday_fri,data.weekday_sat],ERANAMES:[data.eraname_BC,data.eraname_AD],ERAS:[data.era_BC,data.era_AD],FIRSTDAYOFWEEK:data.first_day_of_week,MONTH:[data.January,data.February,data.March,data.April,data.May,data.June,data.July,data.August,data.September,data.October,data.November,data.December],SHORTDAY:[data.weekday_short_sun,data.weekday_short_mon,data.weekday_short_tues,data.weekday_short_weds,data.weekday_short_thurs,data.weekday_short_fri,data.weekday_short_sat],SHORTMONTH:[data.short_January,data.short_February,data.short_March,data.short_April,data.short_May,data.short_June,data.short_July,data.short_August,data.short_September,data.short_October,data.short_November,data.short_December],STANDALONEMONTH:[data.January,data.February,data.March,data.April,data.May,data.June,data.July,data.August,data.September,data.October,data.November,data.December],WEEKENDRANGE:[5,6],fullDate:"EEEE, MMMM d, y",longDate:"MMMM d, y",medium:"MMM d, y h:mm:ss a",mediumDate:"MMM d, y",mediumTime:"h:mm:ss a","short":"M/d/yy h:mm a",shortDate:"M/d/yy",shortTime:"h:mm a"},NUMBER_FORMATS:{CURRENCY_SYM:data.currency_sym,DECIMAL_SEP:".",GROUP_SEP:",",PATTERNS:[{gSize:3,lgSize:3,maxFrac:3,minFrac:0,minInt:1,negPre:"-",negSuf:"",posPre:"",posSuf:""},{gSize:3,lgSize:3,maxFrac:2,minFrac:2,minInt:1,negPre:"-¤",negSuf:"",posPre:"¤",posSuf:""}]},pluralCat:function(n,opt_precision){return PLURAL_CATEGORY.OTHER}}),ngQuickDateDefaultsProvider.set({closeButtonHtml:"<i class='fa fa-times'></i>",buttonIconHtml:"<i class='fa fa-calendar'></i> ",nextLinkHtml:"<i class='fa fa-chevron-right'></i>",prevLinkHtml:"<i class='fa fa-chevron-left'></i>",dateLabelHtml:date_translation,timeLabelHtml:time_translation,dayAbbreviations:[sunday,mon,tues,weds,thurs,fri,sat]})})};$.ajax({url:"views/translation/"+LANG.PREFERRED_LANG+"/calendar.json",type:"GET",success:function(data){if(void 0===data.weekday_short_fri)return void calendar_translation_error();var date_translation=data.date_label,time_translation=data.time_label,sunday=data.weekday_short_sun,mon=data.weekday_short_mon,tues=data.weekday_short_tues,weds=data.weekday_short_weds,thurs=data.weekday_short_thurs,fri=data.weekday_short_fri,sat=data.weekday_short_sat,PLURAL_CATEGORY={ZERO:"zero",ONE:"one",TWO:"two",FEW:"few",MANY:"many",OTHER:"other"};$provide.value("$locale",{DATETIME_FORMATS:{AMPMS:[data.am,data.pm],DAY:[data.weekday_sun,data.weekday_mon,data.weekday_tues,data.weekday_weds,data.weekday_thurs,data.weekday_fri,data.weekday_sat],ERANAMES:[data.eraname_BC,data.eraname_AD],ERAS:[data.era_BC,data.era_AD],FIRSTDAYOFWEEK:data.first_day_of_week,MONTH:[data.January,data.February,data.March,data.April,data.May,data.June,data.July,data.August,data.September,data.October,data.November,data.December],SHORTDAY:[data.weekday_short_sun,data.weekday_short_mon,data.weekday_short_tues,data.weekday_short_weds,data.weekday_short_thurs,data.weekday_short_fri,data.weekday_short_sat],SHORTMONTH:[data.short_January,data.short_February,data.short_March,data.short_April,data.short_May,data.short_June,data.short_July,data.short_August,data.short_September,data.short_October,data.short_November,data.short_December],STANDALONEMONTH:[data.January,data.February,data.March,data.April,data.May,data.June,data.July,data.August,data.September,data.October,data.November,data.December],WEEKENDRANGE:[5,6],fullDate:"EEEE, MMMM d, y",longDate:"MMMM d, y",medium:"MMM d, y h:mm:ss a",mediumDate:"MMM d, y",mediumTime:"h:mm:ss a","short":"M/d/yy h:mm a",shortDate:"M/d/yy",shortTime:"h:mm a"},NUMBER_FORMATS:{CURRENCY_SYM:data.currency_sym,DECIMAL_SEP:".",GROUP_SEP:",",PATTERNS:[{gSize:3,lgSize:3,maxFrac:3,minFrac:0,minInt:1,negPre:"-",negSuf:"",posPre:"",posSuf:""},{gSize:3,lgSize:3,maxFrac:2,minFrac:2,minInt:1,negPre:"-¤",negSuf:"",posPre:"¤",posSuf:""}]},pluralCat:function(n,opt_precision){return PLURAL_CATEGORY.OTHER}}),ngQuickDateDefaultsProvider.set({closeButtonHtml:"<i class='fa fa-times'></i>",buttonIconHtml:"<i class='fa fa-calendar'></i> ",nextLinkHtml:"<i class='fa fa-chevron-right'></i>",prevLinkHtml:"<i class='fa fa-chevron-left'></i>",dateLabelHtml:date_translation,timeLabelHtml:time_translation,dayAbbreviations:[sunday,mon,tues,weds,thurs,fri,sat]})},error:calendar_translation_error})}]);