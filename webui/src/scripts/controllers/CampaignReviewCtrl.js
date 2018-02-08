app.controller('campaignReviewCtrl', function($location, $scope, $rootScope, $routeParams, CreateCampaignService, Restangular, RESOURCE_REGIONS, API_URL, $translate, $translatePartialLoader, CampaignSettingsService, VideoLinkService, PortalSettingsService) {
  $scope.RESOURCE_REGIONS = RESOURCE_REGIONS;
  var id = $routeParams.campaign_id;
  $scope.duration = "";
  $scope.campaign = {};
  var msg;

  // load portal settings
  PortalSettingsService.getSettingsObj().then(function(success) {
    $scope.public_settings = success.public_setting;
  });

  CreateCampaignService.load(id).then(function(success) {
    $scope.campaign = success;
    checkTime();
    CampaignSettingsService.setCampaignId($routeParams.campaign_id);
    CampaignSettingsService.processSettings(success.settings);
    $scope.campaign.settings = CampaignSettingsService.getSettings();
    if ($.trim($scope.campaign.settings.top_header_link)) {
      if ($scope.campaign.settings.top_header_link.length <= 0) {
        $scope.campaign.settings.top_header_link = "#";
      }
    }
    if ($scope.campaign.settings.top_header_link == "#") {
      delete $scope.campaign.settings.top_header_link;
    }

    $scope.faqs = success.faqs;
    $scope.remaining_time = $scope.campaign.time_remaining;
    $scope.days_rem = $scope.campaign.days_remaining_inclusive;
    $scope.campaign.timezoneText = moment().tz($scope.campaign.timezone).zoneAbbr();
    $translate(['seconds_to_go', 'second_to_go', 'seconds_ago', 'second_ago', 'minutes_to_go', 'minute_to_go', 'minutes_ago', 'minute_ago', 'hours_to_go', 'hour_to_go', 'hours_ago', 'hour_ago']).then(function(values) {
      if ($scope.days_rem == 0) {
        $scope.days_rem = $scope.campaign.hours_remaining_inclusive;
        if ($scope.days_rem == 0) {
          $scope.days_rem = $scope.campaign.minutes_remaining_inclusive;
          if ($scope.days_rem == 0) {
            $scope.days_rem = $scope.campaign.seconds_remaining_inclusive;
            if ($scope.days_rem >= 1) {
              if ($scope.days_rem > 1) {
                $scope.day_text = values.seconds_to_go;
              } else {
                $scope.day_text = values.second_to_go;
              }
            } else {
              $scope.days_rem = $scope.days_rem * -1;
              if ($scope.days_rem > 1) {
                $scope.day_text = values.seconds_ago;
              } else {
                $scope.day_text = values.second_ago;
              }
            }
          } else {
            if ($scope.days_rem >= 1) {
              if ($scope.days_rem > 1) {
                $scope.day_text = values.minutes_to_go;
              } else {
                $scope.day_text = values.minute_to_go;
              }

            } else {
              $scope.days_rem = $scope.days_rem * -1;
              if ($scope.days_rem > 1) {
                $scope.day_text = values.minutes_ago;
              } else {
                $scope.day_text = values.minute_ago;
              }
            }
          }
        } else {
          if ($scope.days_rem >= 1) {
            if ($scope.days_rem > 1) {
              $scope.day_text = values.hours_to_go;
            } else {
              $scope.day_text = values.hour_to_go;
            }

          } else {
            $scope.days_rem = $scope.days_rem * -1;
            if ($scope.days_rem > 1) {
              $scope.day_text = values.hours_ago;
            } else {
              $scope.day_text = values.hour_ago;
            }
          }
        }

      } else {
        if ($scope.days_rem >= 1) {
          if ($scope.days_rem > 1) {
            $scope.day_text = " days to go";
          } else {

            $scope.day_text = " day to go";
          }

        } else {
          $scope.days_rem = $scope.days_rem * -1;
          if ($scope.days_rem > 1) {
            $scope.day_text = "days ago";
          } else {
            $scope.day_text = "day ago";
          }
        }
      }
    });
  });
  $scope.note = {};

  // call getNote function
  getNote();
  $scope.$emit("loading_finished");
  $translatePartialLoader.addPart('error');
  $translatePartialLoader.addPart('campaign-review');
  $translate.refresh();

  //pre-load video link
  $scope.$watch('campaign.links', function(value) {
    if (value) {
      angular.forEach(value, function(link) {
        if (link.region_id == 1 && link.resource_content_type_id == 1 && link.resource_type == "link") {
          $scope.campaign.video = link.uri.replace(/https?:\/\//gi, $location.protocol() + '://');
          VideoLinkService.processVideoLink($scope.campaign.video, "");
          $scope.campaign.video_type = VideoLinkService.get_video_type();
          if ($scope.campaign.video_type == "custom") {
            $scope.campaign.video = VideoLinkService.get_video_link();
          }
        }
      });
    }
  });

  /* this will open a modal for the admin to type in the note */
  $scope.addNotes = function(fieldName) {
    $scope.noteFieldName = fieldName;
    $('.ui.modal.admin-notes').modal('show');
  };

  function getNote() {
    // server request to get admin note
    Restangular.one('campaign', id).one('note').customGET().then(function(success) {

      if (success && success.length) {
        $scope.note = success[0].value;
        $scope.note.id = success[0].id;
      }
    });
  }

  /* this function is called when admin wants to save the note */
  $scope.saveNote = function() {
    var data = {
      value: $scope.note,
    };
    if ($scope.note.id) {
      // if note id exists, use PUT request
      Restangular.one('campaign', id).one('note', $scope.note.id).customPUT(data);
    } else {
      Restangular.one('campaign', id).one('note', $scope.note.id).customPOST(data);
    }
  };

  $scope.action = function(actionName) {
    var data = {
      entry_status_id: '',
    }
    msg = {
      'loading': true,
      'loading_message': 'updating_campaign_status'
    }
    $rootScope.floatingMessage = msg;
    if (actionName == 'approve') {
      data.entry_status_id = 2;
      Restangular.one('campaign', id).customPUT(data).then(function(success) {
        msg = {
          'header': "approve_campaign"
        };
        $rootScope.floatingMessage = msg;
        $scope.hideFloatingMessage();
        //$location.path('/admin/dashboard');sure
        //
      }, function(failure) {
        msg = {
          'header': failure.data.message,
        }
        $rootScope.floatingMessage = msg;
        $scope.hideFloatingMessage();
      });
    } else if (actionName == 'disapprove') {
      data.entry_status_id = 3;
      Restangular.one('campaign', id).customPUT(data).then(function(success) {
        msg = {
          'header': "disapprove_campaign"
        };
        $rootScope.floatingMessage = msg;
        //$location.path('/admin/dashboard');
      }, function(failure) {
        msg = {
          'header': failure.data.message,
        }
        $rootScope.floatingMessage = msg;
        $scope.hideFloatingMessage();
      });
    }
  };

  $scope.removeNote = function(fieldName) {
    $scope.note[fieldName] = "";
    $scope.saveNote();
  }

  $scope.dateInPast = function(value, sec) {
    //return moment(value) < moment(new Date());
    if (sec == 0 || sec == "00" || sec < 0) {
      return true;
    } else {
      return false;
    }
  }

  function checkTime() {
    var date = moment();
    var end = moment($scope.campaign.ends);
    var d1 = moment($scope.campaign.starts);
    var d2 = moment();
    var check = moment.duration(d2.diff(end)).asMinutes();
    if (moment($scope.campaign.ends) < moment(new Date())) {
      $scope.min = Math.abs(moment.duration(end.diff(d1)).asMinutes());
      $scope.days = Math.abs(moment.duration(end.diff(d1)).asDays());
      $scope.hours = Math.abs(moment.duration(end.diff(d1)).asHours());
      $scope.week = Math.abs(moment.duration(end.diff(d1)).asWeeks());
      $scope.month = Math.abs(moment.duration(end.diff(d1)).asMonths());
    } else {
      $scope.min = moment.duration(d2.diff(d1)).asMinutes();
      $scope.days = moment.duration(d2.diff(d1)).asDays();
      $scope.hours = moment.duration(d2.diff(d1)).asHours();
      $scope.week = moment.duration(d2.diff(d1)).asWeeks();
      $scope.month = moment.duration(d2.diff(d1)).asMonths();
    }
    if ($scope.month > 1) {
      $scope.duration = parseInt($scope.month);
      if ($scope.month > 1 && $scope.month < 2) {
        $scope.dtype = "month";
      } else {
        $scope.dtype = "months";
      }
    } else if ($scope.week > 1) {
      $scope.duration = parseInt($scope.week);
      if ($scope.week > 1 && $scope.week < 2) {
        $scope.dtype = "week";
      } else {
        $scope.dtype = "weeks";
      }
    } else if ($scope.days > 1) {
      $scope.duration = parseInt($scope.days);
      if ($scope.days > 1 && $scope.days < 2) {
        $scope.dtype = "day";
      } else {
        $scope.dtype = "days";
      }
    } else if ($scope.hours > 1) {
      $scope.duration = parseInt($scope.hours);
      if ($scope.hours > 1 && $scope.hours < 2) {
        $scope.dtype = "hour";
      } else {
        $scope.dtype = "hours";
      }
    } else if ($scope.min > 1) {
      $scope.duration = parseInt($scope.min);
      if ($scope.min > 1 && $scope.min < 2) {
        $scope.dtype = "min";
      } else {
        $scope.dtype = "mins";
      }
    }
  }

});