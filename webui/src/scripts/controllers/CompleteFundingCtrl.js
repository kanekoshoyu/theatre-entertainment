app.controller('CompleteFundingCtrl', function($translate, CampaignSettingsService, $routeParams, $scope, $rootScope, $timeout, Restangular, CreateCampaignService, $location, StripeService, UserService, PortalSettingsService) {
  $scope.clearMessage = function() {
    $rootScope.floatingMessage = [];
  }
  var msg = [];

  //Funding page setup
  $scope.campaign = {};
  $scope.campaignID = $routeParams.campaign_id;
  $scope.nextStepUrl = "campaign-preview/" + $routeParams.campaign_id;
  $scope.backUrl = "profile-setup/" + $routeParams.campaign_id;
  $scope.saddress = {
    street: "",
    mail: "",
    city: "",
    country: ""
  };
  $scope.clientID = null;
  // get the stripe client ID
  StripeService.clientID().then(function(success) {
    if (success) {
      $scope.clientID = success;
    }
  });
  $scope.user = UserService;
  $scope.useremail = $scope.user.email;

  // load portal settings to see which mode is allowed for campaign creation
  PortalSettingsService.getSettingsObj().then(function(success) {
    $scope.$emit("loading_finished");
    $scope.portalsetting = success.public_setting;
    $scope.direct_transaction = success.public_setting.site_campaign_fee_direct_transaction;
    $scope.reward_show = success.public_setting.site_theme_campaign_show_reward_section;

    if (typeof $scope.portalsetting.site_campaign_hide_profile === 'undefined' || $scope.portalsetting.site_campaign_hide_profile === null) {
      $scope.portalsetting.site_campaign_hide_profile = false;
    }
    $scope.showProfile = !$scope.portalsetting.site_campaign_hide_profile;
    if (!$scope.showProfile) {
      $scope.backUrl = "rewards/" + $routeParams.campaign_id;
    } else if (!$scope.showProfile && $scope.reward_show) {
      $scope.backUrl = "campaign-setup/" + $routeParams.campaign_id;
    } else {
      $scope.backUrl = "profile-setup/" + $routeParams.campaign_id;
    }
    if (!$scope.showProfile && !$scope.reward_show) {
      $scope.backUrl = "campaign-setup/" + $routeParams.campaign_id;
    }
    // if (!$scope.reward_show) {
    //   $scope.backUrl = "campaign-setup/" + $routeParams.campaign_id;
    // }
    if ($scope.portalsetting.site_enable_advanced_widget) {
      $scope.nextStepUrl = "campaign-widget/" + $routeParams.campaign_id;
    }
    // If using country direct transaction
    if ($scope.portalsetting.site_campaign_country_funding_step) {
      $scope.bank = {};
    }

    if ($scope.direct_transaction && UserService.person_type_id !== 1) {
      $location.path('/404');
    }
  });

  //Client details
  CreateCampaignService.load($routeParams.campaign_id).then(function(success) {
    $scope.campaign = success;
    CampaignSettingsService.setCampaignId($routeParams.campaign_id);
    CampaignSettingsService.processSettings(success.settings);
    $scope.campaign.settings = CampaignSettingsService.getSettings();
    if ($scope.campaign.settings.bank) {
      $scope.bank = $scope.campaign.settings.bank;
    }
    $scope.campaigndesc = $scope.name + " " + "-" + $scope.campaign.blurb;
    Restangular.one('account/business').customGET().then(function(success) {
      $scope.companies = success;
      if (typeof $scope.portalsetting.site_theme_portal_company_name == 'undefined' || typeof $scope.portalsetting.site_theme_portal_company_number == 'undefined') {
        if ($scope.companies.length > 0) {
          $scope.campaignName = $scope.companies[0].name;
        } else {
          $scope.campaignName = $scope.campaign.name;
          $scope.number = "xxxxxxxxxx";
        }
      } else {
        $scope.campaignName = $scope.portalsetting.site_theme_portal_company_name;
        $scope.number = $scope.portalsetting.site_theme_portal_company_number;
      }
    });

  });
  $scope.website = $location.protocol() + "://" + $location.host() + "/campaign/" + $scope.campaignID;
  Restangular.one('account/address').customGET().then(function(success) {
    $scope.address = success;
    if ($scope.address.business) {
      if ($scope.address.business.length > 0) {
        $scope.paddress = $scope.address.business;
      } else {
        $scope.paddress = $scope.address.personal;
      }
    } else {
      $scope.paddress = $scope.address.personal;
    }
    if ($scope.paddress) {

      $scope.saddress = {
        street: $scope.paddress[0].street1,
        mail: $scope.paddress[0].mail_code,
        city: $scope.paddress[0].city,
        country: $scope.paddress[0].code_iso3166_1
      };
    }
  });

  function fundingValidation() {
    var translation = $translate.instant(['complete_funding_bank_errormessage']);

    $('.startfunding-form.ui.form').form({
      stripe_account: {
        identifier: 'stripe_account',
        rules: [{
          type: 'empty',
          prompt: translation.complete_funding_bank_errormessage
        }]
      }
    }, {
      inline: true,
      onSuccess: function() {
        $scope.valcheck = $scope.valcheck && true;
      },
      onFailure: function() {
        $scope.valcheck = $scope.valcheck && false;
      }
    }).form('validate form');
  }

  $scope.bankValidation = function() {
    var translation = $translate.instant(['complete_funding_bank_errormessage', 'complete_funding_bank_account_confirm_errormessage']);

    $('.startfunding-form.ui.form').form({
      bank_beneficiary: {
        identifier: 'bank_beneficiary',
        rules: [{
          type: 'empty',
          prompt: translation.complete_funding_bank_errormessage
        }]
      },
      bank_cpf: {
        identifier: 'bank_cpf',
        rules: [{
          type: 'empty',
          prompt: translation.complete_funding_bank_errormessage
        }]
      },
      bank_code: {
        identifier: 'bank_code',
        rules: [{
          type: 'empty',
          prompt: translation.complete_funding_bank_errormessage
        }]
      },
      bank_name: {
        identifier: 'bank_name',
        rules: [{
          type: 'empty',
          prompt: translation.complete_funding_bank_errormessage
        }]
      },
      bank_branch: {
        identifier: 'bank_branch',
        rules: [{
          type: 'empty',
          prompt: translation.complete_funding_bank_errormessage
        }]
      },
      bank_account: {
        identifier: 'bank_account',
        rules: [{
          type: 'empty',
          prompt: translation.complete_funding_bank_errormessage
        }]
      },
      bank_account_confirm: {
        identifier: 'bank_account_confirm',
        rules: [{
          type: 'match[bank_account]',
          prompt: translation.complete_funding_bank_account_confirm_errormessage
        }]
      }
    }, {
      inline: true,
      onSuccess: function() {
        $scope.valcheck = $scope.valcheck && true;
      },
      onFailure: function() {
        $scope.valcheck = $scope.valcheck && false;
      }
    }).form('validate form');
  }

  $scope.saveData = function($event) {
    $scope.valcheck = true;
    if ($scope.portalsetting.site_campaign_country_funding_step) {
      //validation for bank form
      $scope.bankValidation();
    } else {
      fundingValidation();
    }
    // Check for error on the .field element
    if ($('.field').hasClass('error')) {
      $('html, body').animate({
        scrollTop: $('.field.error').offset().top + 15
      }, 'fast');
    }

    var currentEle = $event.currentTarget;
    var navigating = $(currentEle).hasClass("save-campaign-button") ? false : true;

    if ($scope.valcheck) {
      msg = {
        'loading': true,
        'loading_message': 'in_progress'
      }
      $rootScope.floatingMessage = msg;
      if ($scope.portalsetting.site_campaign_country_funding_step && $scope.campaign.settings.country_bank_form) {
        $scope.campaign.settings.bank = $scope.bank;
        var data = {
          force_direct_transaction: 1
        };
        Restangular.one('campaign', $scope.campaignID).customPUT(data).then(function(success) {
          CampaignSettingsService.saveSettings($scope.campaign.settings);
          // Checking if user is navigating or not
          msg = {
            'header': "success_message_save_changes_button",
          }
          $rootScope.floatingMessage = msg;
          $scope.hideFloatingMessage();
        });
      } else {
        var data = {
          stripe_account_id: $scope.campaign.stripe_account_id
        };

        Restangular.one('campaign', $scope.campaignID).customPUT(data).then(function(success) {
          CampaignSettingsService.saveSettings($scope.campaign.settings);
          CreateCampaignService.cacheIn(success.plain());
          // Checking if user is navigating or not
          msg = {
            'header': "success_message_save_changes_button",
          }
          $rootScope.floatingMessage = msg;
          $scope.hideFloatingMessage();
        });
      }
    } else {
      // Need to fill out required fields before moving on
      $event.preventDefault();
      msg = {
        'header': 'fail_message_save_changes_button'
      };
      $rootScope.floatingMessage = msg;
      $scope.hideFloatingMessage();
      return false;
    }
  };

  $scope.selectStripeId = function(id) {
    $scope.campaign.stripe_account_id = id;
  }

  // -------------------------------------------------------------
  // Stripe
  // -------------------------------------------------------------
  // load in campaign
  CreateCampaignService.load($routeParams.campaign_id).then(function(success) {
    $scope.campaign = success; // assign it to the scope variable
    $scope.campaign.settings = CampaignSettingsService.getSettings();
    // load stripe account
    Restangular.one('campaign', $routeParams.campaign_id).one('stripe-account').customGET().then(function(success) {
      var stripe_accounts = success.plain();
      if (UserService.id == $scope.campaign.managers[0].id) {
        // if current user is the campaign manager
        StripeService.getAccount().then(function(success) {
          // get array of connected stripe accounts
          if (success.length) {
            // assign data if it exists
            $scope.stripeAccounts = success;
            $scope.stripeConnected = true;
            if (!stripe_accounts.length && $scope.stripeAccounts.length) {
              $scope.campaign.stripe_account_id = $scope.stripeAccounts[0].id;
            } else if (stripe_accounts.length) {
              $scope.campaign.stripe_account_id = stripe_accounts[0].id;
            }
            if ($rootScope.isConnectWithStripe) {
              $timeout(function() {
                $("button.save-campaign-button").click();
              }, 100);
            }
          }
        });
      } else {
        // if there are accounts but current user is not creator
        $scope.stripeAccounts = stripe_accounts;
        if (stripe_accounts.length) {
          $scope.stripeConnected = true;
          $scope.campaign.stripe_account_id = stripe_accounts[0].id;
          if ($rootScope.isConnectWithStripe) {
            $timeout(function() {
              $("button.save-campaign-button").click();
            }, 100);
          }
        }
      }
    });
  });
  // check for phone number
  Restangular.one('account/phone-number').customGET().then(function(success) {
    if (success.business) {
      $scope.number = success.business[0].number;
    } else if (success.personal) {
      $scope.number = success.personal[0].number;
    }
  });

  $scope.stateParam = StripeService.generateStateParam('/complete-funding/' + $scope.campaignID);
  $scope.stripeRedirect = StripeService.redirectURL();

  $scope.setRedirectUrl = function() {
    var baseUrl = "https://connect.stripe.com/oauth/authorize?";
    var params = {
      "response_type": "code",
      "client_id": $scope.clientID.client_id,
      "account": $scope.clientID.client_id,
      "stripe_user": {
        "product_description": $scope.campaigndesc,
        "business_name": $scope.campaignName,
        "first_name": $scope.user.first_name,
        "last_name": $scope.user.last_name,
        "country": $scope.saddress.country,
        "phone_number": $scope.number,
        "url": $scope.website,
        "email": $scope.useremail,
        "street_address": $scope.saddress.street,
        "city": $scope.saddress.city,
        "zip": $scope.saddress.mail
      },
      "scope": "read_write",
      "redirect_uri": $scope.stripeRedirect,
      "state": $scope.stateParam
    }
    var finalUrl = baseUrl + $.param(params);
    window.location.href = finalUrl;
  }
});