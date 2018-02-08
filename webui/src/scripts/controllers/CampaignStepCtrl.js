app.controller('CampaignStepCtrl', function($location, CampaignSettingsService, Restangular, $routeParams, $scope, CreateCampaignService, PortalSettingsService, UserService, $rootScope) {
  // check the current path and set active class to the current step
  // campaign entry id is used in href
  var paras = $location.$$path.split('/');
  $scope.path = paras[1];
  $scope.campaign_entry_id = $routeParams.campaign_id;

  if ($routeParams.revision_id) {
    $scope.revisionIdParam = '/?revision_id=' + $routeParams.revision_id;
  }
  $scope.uid = UserService.person_type_id;

  if ($rootScope.campaignInEditing && $rootScope.campaignInEditing.id == parseInt($scope.campaign_entry_id)) {
    $scope.campaign = $rootScope.campaignInEditing;
    getSiteSettings();
  } else {
    getSiteSettings();
  }



  // load portal settings to see which mode is allowed for campaign creation
  function getSiteSettings() {
    PortalSettingsService.getSettingsObj().then(function(success) {
      $scope.public_settings = success.public_setting;
      $scope.direct_transaction = success.public_setting.site_campaign_fee_direct_transaction;
      $scope.contributionEnabled = success.public_setting.site_campaign_contributions;
      $scope.reward_show = success.public_setting.site_theme_campaign_show_reward_section;
      $scope.payment_gateway = success.public_setting.site_payment_gateway;
      $scope.isStepFundingDelayed = success.public_setting.site_theme_campaign_delayed_funding_setup;
      $scope.enableCampaignRevisions = success.public_setting.site_campaign_enable_campaign_revisions;
      $scope.isStepRewardDelayed = success.public_setting.site_theme_campaign_delayed_reward_setup;
      if (typeof $scope.public_settings.site_campaign_hide_profile == 'undefined' || $scope.public_settings.site_campaign_hide_profile == null) {
        $scope.public_settings.site_campaign_hide_profile = false;
      }

      //Get Current Campaign Information
      CreateCampaignService.load($scope.campaign_entry_id).then(function(success) {
        $rootScope.campaignInEditing = success;
        $scope.campaign = success;
        CampaignSettingsService.setCampaignId($scope.campaign_entry_id);
        CampaignSettingsService.processSettings(success.settings);
        $scope.campaign.settings = CampaignSettingsService.getSettings();

        Restangular.one('campaign', $scope.campaign.id).one('stripe-account').customGET().then(function(stripe) {
          if (stripe.length)
            $scope.stripe_account_id = stripe[0].id;
        });
        if (hasImage() && $scope.campaign.name && $scope.campaign.raise_mode_id && $scope.campaign.profile_type_id && $scope.campaign.blurb && $scope.campaign.categories && $scope.campaign.funding_goal && $scope.campaign.currency_id && $scope.campaign.description) {
          $scope.isPreviewDone = true;
        } else {
          $scope.isPreviewDone = false;
        }
        $scope.decideStepsNeeded();
      });
    });
  }

  $scope.decideStepsNeeded = function() {

    $scope.profile_show = !$scope.public_settings.site_campaign_hide_profile || $scope.uid == 1;
    $scope.master_reward_show = false;

    if ($scope.reward_show) {
      $scope.master_reward_show = true;
    }
    if ($scope.isStepRewardDelayed && $scope.campaign.entry_status_id != 2) {
      $scope.master_reward_show = false;
    }

    if ($scope.public_settings.site_enable_advanced_widget) {
      if ($scope.payment_gateway == 2) {
        if ($scope.master_reward_show) {
          $scope.step_class = 'six column';
          if (!$scope.profile_show) {
            $scope.step_class = 'five column';
          }
        } else {
          $scope.step_class = 'five column';
          if (!$scope.profile_show) {
            $scope.step_class = 'four column';
          }
        }
      } else if ($scope.direct_transaction && $scope.uid != 1 || !$scope.contributionEnabled || $scope.isStepFundingDelayed && !$scope.campaign.ever_published) {
        if ($scope.master_reward_show) {
          $scope.step_class = 'six column';
          if (!$scope.profile_show) {
            $scope.step_class = 'five column';
          }
        } else {
          $scope.step_class = 'five column';
          if (!$scope.profile_show) {
            $scope.step_class = 'four column';
          }
        }
      } else {
        if ($scope.master_reward_show) {
          $scope.step_class = 'seven column';
          if (!$scope.profile_show) {
            $scope.step_class = 'six column';
          }
        } else {
          $scope.step_class = 'six column';
          if (!$scope.profile_show) {
            $scope.step_class = 'five column';
          }
        }
      }
    } else {
      if ($scope.payment_gateway == 2) {
        if ($scope.master_reward_show) {
          $scope.step_class = 'five column';
          if (!$scope.profile_show) {
            $scope.step_class = 'four column';
          }
        } else {
          $scope.step_class = 'four column';
          if (!$scope.profile_show) {
            $scope.step_class = 'three column';
          }
        }
      } else if ($scope.direct_transaction && $scope.uid != 1 || !$scope.contributionEnabled || $scope.isStepFundingDelayed && !$scope.campaign.ever_published) {
        if ($scope.master_reward_show) {
          $scope.step_class = 'five column';
          if (!$scope.profile_show) {
            $scope.step_class = 'four column';
          }
        } else {
          $scope.step_class = 'four column';
          if (!$scope.profile_show) {
            $scope.step_class = 'three column';
          }
        }
      } else {
        if ($scope.master_reward_show) {
          $scope.step_class = 'six column';
          if (!$scope.profile_show) {
            $scope.step_class = 'five column';
          }
        } else {
          $scope.step_class = 'five column';
          if (!$scope.profile_show) {
            $scope.step_class = 'four column';
          }
        }
      }
    }
  };
  $scope.validateBasicStep = function() {
    return $scope.campaign.name && $scope.campaign.blurb && $scope.campaign.funding_goal && $scope.campaign.starts && $scope.campaign.files;
  };

  $scope.validateDetailStep = function() {
    return $scope.campaign.description;
  };

  $scope.validateRewardStep = function() {
    if ($scope.campaign.pledges) {
      return true;
    } else {
      return false;
    }
  };

  $scope.validateProfileStep = function() {
    // personal profile check
    if ($scope.campaign.profile_type_id === 1) {
      return true;
    } else {
      if ($scope.campaign.business_organizations && $scope.campaign.business_organizations.length) {
        return true;
      }
    }
  };

  $scope.validateFundingStep = function() {
    if ($scope.campaign.settings) {
      if ($scope.campaign.settings.country_bank_form) {
        if ($scope.campaign.settings.bank) {
          return true;
        } else {
          return false;
        }
      } else {
        if ($scope.direct_transaction) {
          return true;
        } else {
          if ($scope.stripe_account_id) {

            return true;
          } else {
            return $scope.campaign.stripe_account_id;
          }
        }
      }
    }
  };

  function hasImage() {
    var bool = false;
    if ($scope.campaign.files) {
      angular.forEach($scope.campaign.files, function(file) {
        if (file.region_id == 3) {
          bool = true;
          return;
        }
      });
    }
    return bool;
  }

});