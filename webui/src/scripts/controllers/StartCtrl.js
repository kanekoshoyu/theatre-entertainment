app.controller('StartCtrl', function($location, CampaignSettingsService, $scope, $rootScope, CreateCampaignService, Restangular, UserService, StripeService, CurrencyService, PortalSettingsService, $translatePartialLoader, $translate) {

  // initiate the campaign
  $scope.campaign = {};
  $scope.campaign_country = "";
  $scope.campaign.profile_type_id = 1;

  var user = UserService;
  //(user);
  var login = user.isLoggedIn();

  // get the stripe client ID 
  StripeService.clientID().then(function(success) {
    if (success) {
      if (!success.client_id) {
        $scope.stripe_not_set = true;
      }
    }
  }, function(failed) {
    $scope.stripe_not_set = true;
  });

  // check if the currency is being set
  CurrencyService.getCurrency(function(success) {
    // if there is only one supported currency
    if (success) {

      //(success);
      if (success.length == 1) {
        $scope.campaign.currency_id = success[0].currency_id;
      }
    } else {
      $scope.stripe_not_set = true;
    }
  });

  // load portal settings to see which mode is allowed for campaign creation
  PortalSettingsService.getSettingsObj().then(function(success) {
    $scope.direct_transaction = success.public_setting.site_campaign_fee_direct_transaction;
    $scope.mode_allowed = success.public_setting.site_campaign_raise_modes.allowed;
    $scope.campaign.raise_mode_id = success.public_setting.site_campaign_raise_modes.default;
    $rootScope.checkstart = $scope.mode_allowed;

    // Set in scope variable
    $scope.public_settings = success.public_setting;
    //site_campaign_country_funding_step
    $scope.$emit("loading_finished");
  });

  $scope.getStripeCountry = function() {
    return Restangular.one('account/stripe/country').customGET().then(function(success) {
      $scope.stripeCountries = success;
    });
  }
  $scope.getStripeCountry();

  $scope.startValidation = function() {
    var translation = $translate.instant(['start_errormessage']);

    $('.start-campaign.ui.form').form({
      title: {
        identifier: 'title',
        rules: [{
          type: 'empty',
          prompt: translation.start_errormessage
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

  $scope.startCountryValidation = function() {
    var translation = $translate.instant(['start_country_errormessage']);

    $('.start-campaign.ui.form').form({
      stripe_country: {
        identifier: 'stripe_country',
        rules: [{
          type: 'empty',
          prompt: translation.start_country_errormessage
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

  $scope.createCampaign = function() {
    $scope.valcheck = true;
    $scope.startValidation();
    if($scope.public_settings.site_campaign_country_funding_step){
      $scope.startCountryValidation();
    }

    if ($scope.valcheck) {
      // cacheIn campaign
      CreateCampaignService.cacheIn($scope.campaign);
      // send POST request to create campaign
      Restangular.one('campaign').customPOST($scope.campaign).then(function(response) {
        var id = response.entry_id;
        //(response.plain());
        // promote user to be campaign manager
        var data = {
          campaign_manager: 1,
        };
        UserService.updateUserData(data);

        // Save country if defined
        if($scope.campaign_country) {
          $scope.campaign.settings ={
            country: $scope.campaign_country
          }
          if($scope.public_settings.site_campaign_country_ids.indexOf($scope.campaign_country.country_id.toString()) > -1){
            $scope.campaign.settings.country_bank_form = true;
          }else{
            $scope.campaign.settings.country_bank_form = false;
          }
          CampaignSettingsService.setCampaignId(id);
          CampaignSettingsService.processSettings(response.settings);
          CampaignSettingsService.saveSettings($scope.campaign.settings);
        }

        //redirect
        $location.path('/getstarted/' + id);
      }, function(error) { // if there is an error
        $scope.errorMsg = error.data.message; // get the error message
      });
    }

  };


  $scope.setStripeCountry = function($event) {
    $scope.campaign_country = $event;
  };

});