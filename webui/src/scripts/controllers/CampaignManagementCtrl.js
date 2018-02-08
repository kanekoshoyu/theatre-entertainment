app.controller('CampaignManagementCtrl', function($location, $scope, $rootScope, RESOURCE_REGIONS, CampaignSettingsService, $translatePartialLoader, $translate, Restangular, $timeout, RestFullResponse, CreateCampaignService, $routeParams, UserService, RequestCacheService) {
  $scope.RESOURCE_REGIONS = RESOURCE_REGIONS;
  $scope.user = UserService;
  window.a = $scope;
  $scope.campaign = {};
  $scope.campaignStatus = {};
  $scope.categories = {};
  $scope.toggle = {};
  $scope.sortOrFiltersCampaign = {
    "sort": '',
    "filters": {
      "category": {},
      "location": '',
      "entry_status_id": '',
      "manager": UserService.person_id,
    },
    "page_entries": 10,
    "page_limit": 100,
    "pagination": {},
    "page": null
  };
  processParams();
  $scope.days_text = "days ago";
  $scope.day_text = "day ago";
  $scope.rdays_text = "days to go";
  $scope.rday_text = "day to go";
  $scope.hours_text = "hours ago";
  $scope.hour_text = "hour ago";
  $scope.rhours_text = "hours to go";
  $scope.rhour_text = "hour to go";
  $scope.minutes_text = "minutes ago";
  $scope.minute_text = "minute ago";
  $scope.rminutes_text = "minutes to go";
  $scope.rminute_text = "minute to go";
  $scope.dateInPast = function(value, sec) {
    if (sec == 0 || sec == "00" || sec < 0) {
      return true;
    } else {
      return false;
    }
  }

  // Get Settings
  Restangular.one('portal/setting/').customGET().then(function(success) {
    $scope.$emit("loading_finished");
    $scope.public_settings = {};
    angular.forEach(success, function(value) {
      if (value.name == "site_campaign_state_hide") {
        $scope.public_settings[value.name] = value.value;
      }
      if (value.name == "site_campaign_progress_bar_hide") {
        $scope.public_settings[value.name] = value.value;
      }
      if (value.name == "site_campaign_exclude_shipping_cost") {
        $scope.public_settings[value.name] = value.value;
        return;
      }
      if (value.name == 'site_campaign_management') {
        $scope.public_settings[value.name] = value.value;
      }
    });
    if (typeof $scope.public_settings.site_campaign_management === 'undefined' || $scope.public_settings.site_campaign_management == null) {
      $scope.public_settings.site_campaign_management = {
        transaction_hide: false,
        pause_hide: false
      }
    }
    filterCampaign($scope.sortOrFiltersCampaign);
  });

  $scope.filterCampaign = function() {
    filterCampaign($scope.sortOrFiltersCampaign);
  }

  //======================== response message ================================
  $scope.successMessage = [];
  $scope.errorMessage = [];
  $scope.totalentry = [10, 25, 40, 55, 70];

  function backToTop() {
    //scroll to top
    $('html,body').animate({
      scrollTop: 0
    });
  }

  RequestCacheService.getCategory().then(function(success) {
    $scope.categories = success;

  });

  getCampaignStatus();

  function getCampaignStatus() {
    Restangular.one('campaign').all('status').getList().then(function(success) {
      $scope.campaignStatus = success;

    });
  }

  //================================
  //      CAMPAIGN MANAGEMENT
  //================================
  $scope.campaignManagerTransactionHide = function(campaign) {
    if ($scope.public_settings.site_campaign_management.transaction_hide) {
      return ($scope.user.person_type_id == 1 && campaign.funded_amount) ? true : false;
    }
    if (!campaign.funded_amount) {
      return false;
    }
    return true;
  }
  $scope.campaignManagerPauseHide = function(campaign) {
    if ($scope.public_settings.site_campaign_management.pause_hide) {
      return ($scope.user.person_type_id == 1 && campaign.entry_status_id == 2) ? true : false;
    }
    if (campaign.entry_status_id != 2) {
      return false;
    }
    return true;
  }

  $scope.getTransecStats = function(campaignID) {
    $location.path('campaign-manager/transactions/' + campaignID);
    Restangular.one('campaign/' + campaignID + '/stats').customGET(null, {
      summary: 1
    }).then(function(success) {});
    Restangular.one('campaign/' + campaignID + '/stats').customGET(null, {
      summary: 0
    }).then(function(success) {});
  }

  /* this function changes the campaign status */
  $scope.changeCampaignStatus = function(campaign, statusID) {
    msg = {
      'loading': true,
      'loading_message': 'in_progress'
    }
    $rootScope.floatingMessage = msg;
    var changes = {
      entry_status_id: statusID,
    };

    Restangular.one('campaign', campaign.id).customPUT(changes).then(function(success) {
      $scope.delayUpdate(); // delay refresh
    }, function(failed) {});
  };

  $scope.delayUpdate = function() {
    $timeout(function() {
      filterCampaign($scope.sortOrFiltersCampaign);
      getCampaignStatus();
      msg = {
        'header': "action_success"
      }
      $rootScope.floatingMessage = msg;
      $scope.hideFloatingMessage();
    }, 800);
  };

  $scope.updateSortCampaign = function(sort) {
    $scope.sortOrFiltersCampaign.sort = sort ? sort : "";
    filterCampaign($scope.sortOrFiltersCampaign);
  }

  $scope.updateFiltersCampaignCategory = function(category) {
    $scope.sortOrFiltersCampaign.filters.category = category
    filterCampaign($scope.sortOrFiltersCampaign);

  }

  $scope.updateFiltersCampaignStatus = function(statusID) {
    $scope.sortOrFiltersCampaign.filters.entry_status_id = statusID;
    filterCampaign($scope.sortOrFiltersCampaign);
  };

  $scope.updateFiltersCampaignOrder = function(order) {
    $scope.sortOrFiltersCampaign.sort = order;
    filterCampaign($scope.sortOrFiltersCampaign);
  };
  $scope.checkentry = function() {
    $scope.entries = $('#searchbtn').dropdown('get value');
    $scope.sortOrFiltersCampaign.page_entries = $scope.entries;
    filterCampaign($scope.sortOrFiltersCampaign);
  }

  function filterCampaign(filter) {
    if (filter.campaign_id) {
      return RestFullResponse.one('campaign', filter.campaign_id).customGET().then(function(success) {
        // update url with the filters
        updateURL();
        $scope.campaigns = [success.data.plain()];
        var headers = success.headers();
        $scope.sortOrFiltersCampaign.pagination.entriesperpage = 1;
        // Disable capture button if needed
        angular.forEach($scope.campaigns, function(campaign) {
          //Minus total_shipping_cost from funded amount if setting is toggled.
          if (typeof $scope.public_settings.site_campaign_exclude_shipping_cost !== 'undefined' && $scope.public_settings.site_campaign_exclude_shipping_cost) {
            campaign.funded_amount = campaign.funded_amount - campaign.total_shipping_cost;
          }
          $scope.tooLateForCapture(campaign);
        });
      });
    } else {
      return RestFullResponse.all('campaign').getList(filter).then(function(success) {
        // update url with the filters
        updateURL();
        $scope.campaigns = success.data;
        $rootScope.checkstart = true;
        var headers = success.headers();
        $scope.sortOrFiltersCampaign.pagination.currentpage = headers['x-pager-current-page'];
        $scope.sortOrFiltersCampaign.pagination.numpages = headers['x-pager-last-page'];
        $scope.sortOrFiltersCampaign.pagination.nextpage = headers['x-pager-next-page'];
        $scope.sortOrFiltersCampaign.pagination.pagesinset = headers['x-pager-pages-in-set'];
        $scope.sortOrFiltersCampaign.pagination.totalentries = headers['x-pager-total-entries'];
        $scope.sortOrFiltersCampaign.pagination.entriesperpage = headers['x-pager-entries-per-page'];
        // Disable capture button if needed
        angular.forEach($scope.campaigns, function(campaign) {
          // Process campaign setting
          CampaignSettingsService.processSettings(campaign.settings);
          campaign.settings = CampaignSettingsService.getSettings();
          $scope.tooLateForCapture(campaign);
          //Minus total_shipping_cost from funded amount if setting is toggled.
          if (typeof $scope.public_settings.site_campaign_exclude_shipping_cost !== 'undefined' && $scope.public_settings.site_campaign_exclude_shipping_cost) {
            campaign.funded_amount = campaign.funded_amount - campaign.total_shipping_cost;
          }
          $scope.progressHide = $scope.public_settings.site_campaign_progress_bar_hide;
          campaign.settings.master_progress_bar_hide = false;
          if ($scope.progressHide) {
            campaign.settings.master_progress_bar_hide = true;
          } else {
            campaign.settings.master_progress_bar_hide = false;
          }
          if (typeof campaign.settings.progress_bar_hide !== 'undefined') {
            campaign.settings.master_progress_bar_hide = campaign.settings.progress_bar_hide;
          }
        });
        // reset 'check all'
        $('.campaign-table thead tr .check-all input').prop('checked', false);
      });
    }
  }

  $scope.tooLateForCapture = function(campaign) {
    //Today's date and formatting
    var today_date = new Date();
    var offset = today_date.getTimezoneOffset();
    today_date.setMinutes(today_date.getMinutes() - offset);
    today_date = today_date.toISOString().substring(0, 19).replace("T", " ");

    //End Time's date and formatting
    var end_date = new Date(campaign.ends_date_time);
    end_date.setDate(end_date.getDate() + 5);
    end_date = end_date.toISOString().substring(0, 19).replace("T", " ");
    if (today_date > end_date) {
      campaign.too_late_capture = true;
    } else {
      campaign.too_late_capture = false;
    }
    return campaign.too_late_capture;
  }

  $scope.editCampaign = function(campaign) {
    $location.path('getstarted/' + campaign.entry_id);
  };
  // search campaign by name
  $scope.searchCampaign = function(word) {
    $scope.sortOrFiltersCampaign.filters.name = word;
    filterCampaign($scope.sortOrFiltersCampaign);
  };

  $scope.cancelCampaign = function(campaign) {
    if (campaign) {
      $scope.cancellingCampaign = campaign;
      $('.cancel-multi-campaign-modal').modal('show');
    } else {
      $('.not-select-modal').modal('show');
    }
  };
  $scope.confirmCancelCampaign = function(campaign) {
    $scope.changeCampaignStatus(campaign, 11);
  }

  /* table sorting */
  $scope.sortByDate = function() {
    $scope.toggle.created = !$scope.toggle.created;

    if ($scope.toggle.created) {
      // sort ascending
      $scope.sortOrFiltersCampaign.sort = 'created';
    } else {
      // sort desending
      $scope.sortOrFiltersCampaign.sort = '-created';
    }
    filterCampaign($scope.sortOrFiltersCampaign);
  };

  function updateURL() {
    var firstpage = ($routeParams.page == 1 || $scope.sortOrFiltersCampaign.page == 1); // Is this the first page?
    var pageparam = firstpage ? null : $scope.sortOrFiltersCampaign.page; // Clear the page param or set page param

    // if it is object
    if (typeof($scope.sortOrFiltersCampaign.filters.category) == 'object') {
      $location.search('category', null);
    } else {
      $location.search('category', $scope.sortOrFiltersCampaign.filters.category);
    }
    $location.search('name', $scope.sortOrFiltersCampaign.filters.name || null);
    $location.search('page', pageparam);
    $location.search('order', $scope.sortOrFiltersCampaign.sort || null);
    $location.search('status', $scope.sortOrFiltersCampaign.filters.entry_status_id || null);
  }

  // Process any filter/sort parameters when the page loads
  function processParams() {
    $scope.sortOrFiltersCampaign.filters.category = $routeParams.category || $scope.sortOrFiltersCampaign.filters.category;
    $scope.sortOrFiltersCampaign.filters.entry_status_id = $routeParams.status || $scope.sortOrFiltersCampaign.filters.entry_status_id;
    $scope.sortOrFiltersCampaign.filters.name = $routeParams.name || $scope.sortOrFiltersCampaign.filters.name;
    $timeout(function() {
      $scope.sortOrFiltersCampaign.page = $routeParams.page || 1;
    });
    $scope.sortOrFiltersCampaign.campaign_id = $routeParams.campaign_id || null;
    $scope.sortOrFiltersCampaign.sort = $routeParams.order || null;
  }

  $scope.manageStream = function(campaign) {
    $location.path('campaign-manager/stream-management/' + campaign.id);
  }

  function clearMessage() {
    $scope.successMessage = [];
    $scope.errorMessage = [];
  }

});