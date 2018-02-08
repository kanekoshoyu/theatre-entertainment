app.controller('CampaignPreviewCtrl', function($timeout, $interval, $location, $scope, $filter, $browser, $translatePartialLoader, $translate, $routeParams, CreateCampaignService, Restangular, RESOURCE_REGIONS, API_URL, PortalSettingsService, $rootScope, CampaignSettingsService, UserService, RestFullResponse, DisqusShortnameService, VideoLinkService, SOCIAL_SHARING_OPTIONS) {
  $scope.campaignSettings = {};
  $scope.urlHost = $location.protocol() + "://" + $location.host() + $browser.baseHref();

  $scope.clearMessage = function() {
    $rootScope.floatingMessage = [];
  };
  var msg = [];

  $scope.RESOURCE_REGIONS = RESOURCE_REGIONS;
  var id = $routeParams.campaign_id;
  $scope.campaign_id = $routeParams.campaign_id;
  $scope.widgetURL = $location.protocol() + "://" + $location.host() + $browser.baseHref() + "widget/production/getwidget.js";
  $scope.campaign = {};
  $translatePartialLoader.addPart('campaign-page');
  $scope.showCampaign = 0;
  $scope.showFaq = 0;
  $scope.showBacker = 0;
  $scope.showComment = 0;
  $scope.showStream = 0;
  $scope.duration = "";
  $scope.stream_pagination = {};
  $scope.stream_filter = {
    'page_entries': 10,
    'page_limit': 100,
    "pagination": {},
    "page": 1
  }
  $translate.refresh();
  $scope.user = UserService;

  var intervalChecking;
  $scope.in_revision = false;

  $timeout(function() {
    $("#myloader").fadeOut(4000, function() {
      $('body').removeClass("loading");
    });
  });

  $scope.dateInPast = function(value, sec) {
    //return moment(value) < moment(new Date());
    if (sec == 0 || sec == 00 || sec < 0) {
      return true;
    } else {
      return false;
    }
  };

  var isStepFundingDelayed;

  // Animated scroll to rewards section
  $scope.scrollToRewards = function(){
    $timeout(function () {
      $('html, body').animate({
        scrollTop: $('#rewards-list').offset().top - 15
      }, 500);
    }, 1000);
  }

  $('.tabular.menu .item').tab();
  $scope.campaignlink = $location.protocol() + "://" + $location.host() + "/campaign/" + id;
  PortalSettingsService.getSettingsObj().then(function(success) {
    $scope.public_settings = success.public_setting;
    $scope.reward_html_editor = success.public_setting.site_theme_campaign_reward_html_editor;
    $scope.payment_gateway = success.public_setting.site_payment_gateway;
    $scope.direct_transaction = success.public_setting.site_campaign_fee_direct_transaction;
    $scope.contributionEnabled = success.public_setting.site_campaign_contributions;
    isStepFundingDelayed = success.public_setting.site_theme_campaign_delayed_funding_setup;
    $scope.removeContactUser = success.public_setting.site_campaign_contact_user;
    $scope.isRemoveCampaignFaq = success.public_setting.site_campaign_remove_campaign_faq;
    $scope.isCreatorNameOnly = success.public_setting.site_campaign_display_creator_info_name_only;
    $scope.isCreatorInfoOnMainBlock = success.public_setting.site_campaign_creator_info_display;
    $scope.isBackersOnSidebar = success.public_setting.site_campaign_backers_list_display;
    $scope.isCommentsOnMainBlock = success.public_setting.site_campaign_comments_display;
    $scope.isUpdatesOnMainBlock = success.public_setting.site_campaign_updates_display;
    $scope.isHideBackerProfileLink = success.public_setting.site_campaign_backer_hide_profile_link;
    $scope.isHideBackedCampaignsAmount = success.public_setting.site_campaign_backer_hide_backed_campaigns;
    $scope.isBlurbInSidebar = success.public_setting.site_campaign_move_blurb_sidebar;
    $scope.enableCampaignRevisions = success.public_setting.site_campaign_enable_campaign_revisions;
    $scope.isCreatorInfoTopBottomOfCampaign = success.public_setting.site_campaign_creator_info_display_top_bottom;
    $scope.isExplainerTextEnabled = success.public_setting.site_campaign_enable_explainer_text;
    $scope.moveEmbedBelowCommentsAccordionMobile = success.public_setting.site_campaign_move_embed_below_comments_accordion;
    $scope.moveBackersBelowCreatorAccordionMobile = success.public_setting.site_campaign_move_backers_accordion_below_creator_accordion;

    if (typeof success.public_setting.site_tos_campaign_submit == 'undefined') {
      $scope.create = false;
    } else {
      $scope.create = success.public_setting.site_tos_campaign_submit;
    }
    $scope.approve_campaign = $scope.public_settings.site_auto_approve_new_campaigns;
    if ($scope.public_settings.site_theme_campaign_min_button_show) {
      $scope.minamount = $scope.public_settings.site_theme_campaign_min_contribute_amount;
    } else {
      $scope.minamount = 1;
    }
    if (typeof $scope.public_settings.site_theme_campaign_faq_option != "undefined") {
      if ($scope.public_settings.site_theme_campaign_faq_option == '2') {
        $scope.hidef = true;
        $scope.showFaq = 0;
      }
      if ($scope.public_settings.site_theme_campaign_faq_option == '1') {

        $scope.showFaq = 1;
      }
      if ($scope.public_settings.site_theme_campaign_faq_option == '0') {

        $scope.showFaq = 0;
      }
    } else {
      $scope.showFaq = 1;
    }

    if ($scope.public_settings.site_theme_campaign_backer_option != null) {
      if ($scope.public_settings.site_theme_campaign_backer_option == '2') {
        $scope.hideb = true;
        $scope.showBacker = 0;
      }
      if ($scope.public_settings.site_theme_campaign_backer_option == '1') {
        $scope.showBacker = 1;
      }
      if ($scope.public_settings.site_theme_campaign_backer_option == '0') {
        $scope.showBacker = 0;
      }
    } else {
      $scope.showBacker = 1;
    }

    if ($scope.public_settings.site_theme_campaign_comment_option != null) {
      if ($scope.public_settings.site_theme_campaign_comment_option == '2') {
        $scope.hidec = true;
        $scope.showComment = 0;
      }
      if ($scope.public_settings.site_theme_campaign_comment_option == '1') {
        $scope.showComment = 1;
      }
    } else {
      $scope.showComment = 1;
    }

    if ($scope.public_settings.site_theme_campaign_stream_option != null) {
      if ($scope.public_settings.site_theme_campaign_stream_option == '2') {
        $scope.hides = true;
        $scope.showStream = 0;
      }
      if ($scope.public_settings.site_theme_campaign_stream_option == '1') {
        $scope.showStream = 1;
      }
      if ($scope.public_settings.site_theme_campaign_stream_option == '0') {
        $scope.showStream = 0;
      }
    } else {
      $scope.showStream = 1;
    }

    Restangular.one("campaign", $scope.campaign_id).customGET("setting")
      .then(function(success) {
        if (success && success.length) {
          for (var index in success.plain()) {
            $scope.campaignSettings[success.plain()[index].name] = success.plain()[index].value;
          }
          setDefaultWidgetSettings();
        }
      })
      .then(function(failed) {
        setDefaultWidgetSettings();
      });

    CreateCampaignService.load(id).then(function(success) {

      // Emit event for hiding loader.
      $scope.$emit("loading_finished");

      $scope.campaign = success;
      //   Restangular.one('campaign', campaign_id).one('ever_published').customGET().then(function(success) {});
      if (typeof $scope.public_settings.site_campaign_custom_button == 'undefined' || $scope.public_settings.site_campaign_custom_button == null) {
        $scope.public_settings.site_campaign_custom_button = {
          toggle: false,
          reward: "Choose Reward",
          contribution: "Contribution"
        };
      }
      $scope.customText = $scope.public_settings.site_campaign_custom_button;
      $scope.contribution = $scope.customText.contribution;
      $scope.reward = $scope.customText.reward;
      var shortCode = "[min]";
      var test = $filter('formatCurrency')($scope.public_settings.site_theme_campaign_min_contribute_amount, $scope.campaign.currencies[0].code_iso4217_alpha, $scope.public_setting.site_campaign_decimal_option);
      if ($scope.customText.toggle == true) {
        var rewardShortCode = $scope.reward.indexOf(shortCode) > -1;
        if (rewardShortCode) {
          $scope.reward = $scope.reward.replace(shortCode, test);
        }
        var contributionShortCode = $scope.contribution.indexOf(shortCode) > -1;
        if (contributionShortCode) {
          $scope.contribution = $scope.contribution.replace(shortCode, test);
        }
      }


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

      CampaignSettingsService.processSettings($scope.campaign.settings);
      var campaignSettings = CampaignSettingsService.getSettings();
      $scope.campaign.settings = campaignSettings;

      $scope.progressHide = false;
      if ($scope.public_settings.site_campaign_progress_bar_hide) {
        $scope.progressHide = $scope.public_settings.site_campaign_progress_bar_hide;
      } else {
        $scope.progressHide = $scope.public_settings.site_campaign_progress_bar_hide;
      }
      if (typeof $scope.campaign.settings.progress_bar_hide !== 'undefined') {
        $scope.progressHide = $scope.campaign.settings.progress_bar_hide;
      }

      if (campaignSettings != null && (campaignSettings.enable_rewards_pagination || !campaignSettings.hasOwnProperty("enable_rewards_pagination"))) {
        //Reward pagination
        $scope.rewardPagination = {
          "page": 1,
          "page_entries": 5,
          "pagination": {
            numpages: 1
          }
        }
      } else {
        //Reward pagination
        $scope.rewardPagination = {
          "page": 1,
          "page_entries": 9999,
          "pagination": {
            numpages: 1
          }
        }
      }

      if ($scope.enableCampaignRevisions && $scope.campaign.entry_status_id == 2 && $routeParams.revision_id) {
        Restangular.one('campaign', $scope.campaign.entry_id).one('revision').customGET().then(function(success) {
          $scope.revision = success[0];
          if ($scope.revision) {
            $scope.in_revision = true;
          }
        });
      }

      $scope.filterRewards = function() {
        var startindex = ($scope.rewardPagination.page - 1) * $scope.rewardPagination.page_entries;
        var endindex = startindex + $scope.rewardPagination.page_entries;
        $scope.campaign.pledges_to_show = angular.copy($scope.campaign.pledges);
        $scope.campaign.pledges_to_show = $scope.campaign.pledges_to_show.slice(startindex, endindex);
      }

      if ($scope.campaign.pledges) {
        var requiredNumCalls = parseInt($scope.campaign.pledges.length / $scope.rewardPagination.page_entries);
        if ($scope.campaign.pledges.length % $scope.rewardPagination.page_entries != 0) {
          requiredNumCalls += 1;
        }
        $scope.rewardPagination.pagination.numpages = requiredNumCalls;
        $scope.filterRewards();
      }

      switch ($scope.public_settings.site_campaign_sharing_options) {
        case SOCIAL_SHARING_OPTIONS.sharing_users:
          $scope.is_sharing_available = true;
          break;
        case SOCIAL_SHARING_OPTIONS.sharing_backers:
          $scope.is_sharing_available = false;
          if ($scope.campaign.managers[0].id == $scope.user.id || $scope.user.person_type_id == 1) {
            $scope.is_sharing_available = true;
          }
          break;
        case SOCIAL_SHARING_OPTIONS.sharing_disabled:
          $scope.is_sharing_available = false;
          break;
        default:
          $scope.is_sharing_available = true;
      }

      // Default comment parameters
      $scope.sortOrFiltersComments = {
        "sort": '-created',
        "page_entries": 5,
        "page_limit": 100,
        "page": 1,
        "pagination": {}
      };

      // Retrieve all comments, or a comment if comment_id is passed.
      $scope.getComments = function(comment_id, sort_order) {
        // Only change order after user changes it using dropdown
        if (sort_order) {
          $scope.sortOrFiltersComments.sort = sort_order;
        }
        if (!comment_id) {
          //("retrieving all campaign comments");
          RestFullResponse.one('campaign/' + $scope.campaign_id).customGET("comment", $scope.sortOrFiltersComments).then(function(success) {
            $scope.comments = success.data;
            var headers = success.headers();
            $scope.sortOrFiltersComments.pagination.currentpage = headers['x-pager-current-page'];
            $scope.sortOrFiltersComments.pagination.numpages = headers['x-pager-last-page'];
            $scope.sortOrFiltersComments.pagination.nextpage = headers['x-pager-next-page'];
            $scope.sortOrFiltersComments.pagination.pagesinset = headers['x-pager-pages-in-set'];
            if (!headers['x-pager-total-entries']) {
              $scope.sortOrFiltersComments.pagination.totalentries = 0;
            } else {
              $scope.sortOrFiltersComments.pagination.totalentries = headers['x-pager-total-entries'];
            }
            $scope.sortOrFiltersComments.pagination.entriesperpage = headers['x-pager-entries-per-page'];
          });
        } else {
          //Grab only 1 comment
          var req = Restangular.one('campaign/' + $scope.campaign_id + '/comment/' + comment_id).customGET();
          return req;
        }
      }

      if ($scope.public_settings.comment_system != null) {
        $scope.comment_system = $scope.public_settings.comment_system;
      } else {
        // default = disqus
        // $scope.comment_system = "disqus";
      }

      // If comment system == disqus, get disqus shortname
      if ($scope.comment_system == "disqus") {
        DisqusShortnameService.getDisqusShortname().then(function(shortname) {
          var disqus_shortname;
          angular.forEach(shortname, function(value) {
            if (value.setting_type_id == 3) {
              disqus_shortname = value.value; // required: replace example with your forum shortname
            }
          });
          var disqus_identifier = $scope.campaign_id;
          $scope.identifier = $scope.campaign_id;
          var disqus_url = $location.absUrl();

          // if embed.js is already inserted. call reset function
          if (window.DISQUS) {
            $('<div id="disqus_thread"></div>').insertAfter('#insert_disqus');
            DISQUS.reset({
              reload: true,
              config: function() {
                this.page.identifier = disqus_identifier;
                this.page.url = disqus_url;
              }
            });
          } else {
            if (disqus_shortname) {
              $('<div id="disqus_thread"></div>').insertAfter('#insert_disqus');
              $scope.disqus_shortname = shortname.value;
              window.disqus_identifier = disqus_identifier;
              window.disqus_url = disqus_url;
              var dsq = document.createElement('script');
              dsq.type = 'text/javascript';
              dsq.async = true;
              dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';
              $('head').append(dsq);
            }
          }
        })
      } else if ($scope.comment_system == "custom") {
        // If comment system == custom
        $scope.comments_show_comment_picture = $scope.public_settings.custom_comment_show_comment_picture;
        $scope.getComments();

        // Custom Comment styles
        $scope.comments_background_style = {
          "background-color": '#' + $scope.public_settings.custom_comment_comment_background_color,
          'font-family': $scope.public_settings.custom_comment_font_family
        };

        $scope.comments_font_color = {
          "color": '#' + $scope.public_settings.custom_comment_font_color
        };

        if ($scope.public_settings.custom_comment_auto_refresh) {
          //retrieve comments every minute
          setInterval(function() {
            $scope.getComments();
          }, 60000);
        }
      }

      checkTime();
      // Grab Campaign Settings to use
      angular.forEach($scope.campaign.settings, function(value, index) {
        var setting_name = value.name;
        var setting_value = value.value;
        $scope.campaign[setting_name] = setting_value;
        if (!$scope.campaign['profile_type_view_id']) {
          $scope.campaign['profile_type_view_id'] = 0;
        }
      });

      // CampaignSettingsService.setCampaignId($routeParams.campaign_id);
      // CampaignSettingsService.processSettings(success.settings);
      // $scope.campaign.settings = CampaignSettingsService.getSettings();
      if ($.trim($scope.campaign.settings.top_header_link)) {
        if ($scope.campaign.settings.top_header_link.length <= 0) {
          $scope.campaign.settings.top_header_link = "#";
        }
      }

      if ($scope.campaign.settings.top_header_link == "#") {
        delete $scope.campaign.settings.top_header_link;
      }

      $scope.campaign.timezoneText = moment().tz($scope.campaign.timezone).zoneAbbr();
      $scope.faqs = success.faqs;
      $scope.FAQ = success.faqs;
      if (success.faqs) {
        $scope.faqs = success.faqs.length;
      }
      $scope.cpath = $scope.campaign.uri_paths[0].path;
      $scope.fullUriPath = $scope.urlHost + $scope.cpath;
      $scope.campaign.campaign_links = [];
      // if links are not null
      if ($scope.campaign.links) {
        //pre-load video link
        angular.forEach($scope.campaign.links, function(value) {
          if (value.region_id == 1 && value.resource_content_type_id == 1 && value.resource_type == "link") {
            // video links
            $scope.campaign.video = value.uri.replace(/https?:\/\//gi, $location.protocol() + '://');
            VideoLinkService.processVideoLink($scope.campaign.video, "");
            $scope.campaign.video_type = VideoLinkService.get_video_type();

            if ($scope.campaign.video_type == "custom") {
              $scope.campaign.video = VideoLinkService.get_video_link();
            }
          }
          if (value.region_id == 2) {
            // campaign links
            $scope.campaign.campaign_links.push(value);
          }
        });
      }

      if (!$scope.direct_transaction) {
        // check if the campaign has stripe account
        Restangular.one('campaign', id).one('stripe-account').customGET().then(function(success) {
          if (success && success.length) {
            $scope.campaign.stripe_account_id = success[0].id;
          }
        });
      }
      if (hasImage() && $scope.campaign.name && $scope.campaign.raise_mode_id && $scope.campaign.profile_type_id && $scope.campaign.blurb && $scope.campaign.categories && $scope.campaign.funding_goal && $scope.campaign.currency_id && $scope.campaign.description && $scope.public_settings.site_enable_advanced_widget) {
        $scope.shouldLoadWidget = true;
        setWidget();
      } else {
        $scope.shouldLoadWidget = false;
      }
      $scope.backers_pagination = {
        "sort": '-created',
        "page_entries": 10,
        "page_limit": 100,
        "page": 1,
        "pagination": {}
      };
      $scope.campaign['backers'] = [];

      $scope.getBackers = function() {
        RestFullResponse.all('campaign/' + success.entry_id + '/backer').getList($scope.backers_pagination).then(
          function(success) {
            $scope.campaign.backers = success.data;
            var headers = success.headers();
            if (!headers['x-pager-total-entries']) {
              $scope.backer_length = '0'
            } else {
              if ($scope.campaign.backer_offset) {
                $scope.backer_length = parseInt(headers['x-pager-total-entries']) + parseInt($scope.campaign.backer_offset)
              } else {
                $scope.backer_length = parseInt(headers['x-pager-total-entries']);
              }
            }
            $scope.backers_pagination.currentpage = headers['x-pager-current-page'];
            $scope.backers_pagination.numpages = headers['x-pager-last-page'];
            $scope.backers_pagination.nextpage = headers['x-pager-next-page'];
            $scope.backers_pagination.pagesinset = headers['x-pager-pages-in-set'];
            $scope.backers_pagination.totalentries = headers['x-pager-total-entries'];
            $scope.backers_pagination.entriesperpage = headers['x-pager-entries-per-page'];
          }
        );
      }
      $scope.getBackers();

      $scope.campaign['streams'] = [];
      RestFullResponse.all('campaign/' + success.entry_id + '/stream').getList($scope.stream_filter).then(
        function(success) {
          $scope.campaign.streams = success.data;
          var headers = success.headers();
          $scope.stream_pagination.currentpage = headers['x-pager-current-page'];
          $scope.stream_pagination.numpages = headers['x-pager-last-page'];
          $scope.stream_pagination.nextpage = headers['x-pager-next-page'];
          $scope.stream_pagination.pagesinset = headers['x-pager-pages-in-set'];
          $scope.stream_pagination.totalentries = headers['x-pager-total-entries'];
          $scope.stream_pagination.entriesperpage = headers['x-pager-entries-per-page'];
        });

        if ($location.search().scroll_to_reward == 1) {
          $scope.scrollToRewards();
        }
    });
  });
  // $scope.campaign['backers'] = [];
  // Restangular.one('campaign/' + id + '/backer').customGET().then(
  //     function (success) {
  //         $scope.campaign.backers = success;
  //         $scope.backer_length = $scope.campaign.backers.length;
  //     }
  // );


  // semantic ui tabs initiation
  $('#campaign-tabs .menu .item').tab({
    context: $('#campaign-tabs')
  });

  $scope.missingFields = {};
  // check for phone number
  Restangular.one('account/phone-number').customGET().then(function(success) {
    if (success.business) {
      $scope.bnumber = success.business[0].number;
    } else if (success.personal) {
      $scope.pnumber = success.personal[0].number;
    }
  });

  $scope.completionCheck = function() {
    //$scope.clearMessage();
    if ($scope.create) {
      if (!$('#creationCheck').checkbox('is checked')) {
        $scope.tos_not_checked = true;
        return;
      } else {
        $scope.tos_not_checked = false;
      }
    }

    var campaign = $scope.campaign;
    if ($scope.direct_transaction || ($scope.payment_gateway == 2) || ($scope.public_settings.site_campaign_country_funding_step && $scope.campaign.settings.country_bank_form)) {
      campaign.stripe_account_id = -1;
    }

    // Check if rewards is required and if it is empty or not
    if ($scope.public_settings.site_theme_campaign_show_reward_required) {
      // if rewards is required
      if (campaign.pledges) {
        $scope.rewardsCheck = true;
      } else {
        $scope.rewardsCheck = false;
      }
    } else {
      //rewads is not required
      $scope.rewardsCheck = true;
    }
    if ($scope.in_revision) {
      $scope.confirmNotice = true;
      $scope.loadingText = false;
      return;
    }
    if (hasImage() && campaign.name && campaign.raise_mode_id && campaign.profile_type_id && campaign.blurb && campaign.categories && campaign.funding_goal && campaign.currency_id && campaign.description && $scope.rewardsCheck && checkFunding()) {
      $scope.loadingText = true;

      CreateCampaignService.sendForReview().then(function(success) {
        $scope.confirmNotice = true;
        $scope.loadingText = false;
      }, function(failed) {
        $scope.errorNotice = failed.data.message;
        msg = {
          'header': failed.data.message
        };
        $rootScope.floatingMessage = msg;
        $scope.hideFloatingMessage();
      });
    } else {
      var steps = [];

      $timeout(function() {
        $translate(['basics', 'details', 'rewards', 'funding', 'uprofile']).then(function(value) {

          if (!(hasImage() && campaign.name && campaign.raise_mode_id && campaign.profile_type_id && campaign.blurb && campaign.categories && campaign.funding_goal && campaign.currency_id)) {

            $scope.basic = value.basics;
            steps.push($scope.basic);
          }
          if (!(campaign.description)) {

            $scope.detail = value.details;
            steps.push($scope.detail);
          }
          if (!(campaign.pledges) && $scope.public_settings.site_theme_campaign_show_reward_required) {
            // set error message if no rewards
            $scope.rewards = value.rewards;
            steps.push($scope.rewards);
          }
          if (!(campaign.stripe_account_id)) {
            $scope.funding = value.funding;
            steps.push($scope.funding);
          }
          missingText(steps);
        });
      });
    }
  };

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

  function missingText(array) {
    $translate(['steps', 'stepsmessage', 'step', 'stepmessage']).then(function(value) {
      if (array.length > 1) {
        $scope.steps = value.steps;
        $scope.stepsmessage = value.stepsmessage;
        $scope.missingFieldsText = $scope.steps + "\"" + array.toString() + "\"" + $scope.stepsmessage;
      } else {
        $scope.step = value.step;
        $scope.stepmessage = value.stepmessage;
        $scope.missingFieldsText = $scope.step + "\"" + array.toString() + "\"" + $scope.stepmessage;
      }
      msg = {
        'header': $scope.missingFieldsText,
      };
      $rootScope.floatingMessage = msg;
      $scope.hideFloatingMessage();

    });
  }

  $scope.requiredFields = [
    "name", "raise_mode_id", "profile_type_id", "cities", "categories",
    "funding_goal", "currency_id", "description", "stripe_account_id"
  ];

  $scope.showStreamDeail = function(stream, index) {
    $scope.stream = stream;
    //$('#streamfull').empty();
    $scope.stream.sindex = index;
    $location.search('stream', stream.id).replace();
  }
  check_path();

  function check_path() {
    var params = $location.search();
    if (params.stream) {
      $('#campaign-tabs .ui.menu .item').tab('change tab', 'streams');
      $scope.show_section.streamDetail = true;
      Restangular.one('campaign', $scope.campaign_id).one('stream', params.stream).customGET().then(function(success) {
        $scope.stream = success;
      });
    }
  }

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

  function checkFunding() {
    if ($scope.public_settings.site_campaign_country_funding_step && $scope.campaign.settings.country_bank_form) {
      if ($scope.campaign.settings.bank) {
        return "StripePlaceHolder";
      } else {
        return false;
      }
    }

    if ($scope.contributionEnabled) {
      if (isStepFundingDelayed) {
        if ($scope.campaign.ever_published) {
          return $scope.campaign.stripe_account_id;
        }
      } else {
        return $scope.campaign.stripe_account_id;
      }
    }
    return "StripePlaceHolder";
  }

  function setDefaultWidgetSettings() {
    if (!$scope.campaignSettings.widget_settings) {
      $scope.campaignSettings.widget_settings = {
        "themecolor": "00B5AD",
        "fontcolor": "313131",
        "fontfamily": "Helvetica"
      };
    }
    if (!$scope.campaignSettings.widget_settings.backersfontcolor) {
      $scope.campaignSettings.widget_settings.backersfontcolor = "000000"
    }
    if (!$scope.campaignSettings.widget_settings.blurbfontcolor) {
      $scope.campaignSettings.widget_settings.blurbfontcolor = "000000"
    }
    if (!$scope.campaignSettings.widget_settings.campaignfontcolor) {
      $scope.campaignSettings.widget_settings.campaignfontcolor = "000000"
    }
    if (!$scope.campaignSettings.widget_settings.commentsfontcolor) {
      $scope.campaignSettings.widget_settings.commentsfontcolor = "000000"
    }
    if (!$scope.campaignSettings.widget_settings.contactfontcolor) {
      $scope.campaignSettings.widget_settings.contactfontcolor = "000000"
    }
    if (!$scope.campaignSettings.widget_settings.creatorfontcolor) {
      $scope.campaignSettings.widget_settings.creatorfontcolor = "000000"
    }
    if (!$scope.campaignSettings.widget_settings.faqfontcolor) {
      $scope.campaignSettings.widget_settings.faqfontcolor = "000000"
    }
    if (!$scope.campaignSettings.widget_settings.fundingfontcolor) {
      $scope.campaignSettings.widget_settings.fundingfontcolor = "000000"
    }
    if (!$scope.campaignSettings.widget_settings.paymentfontcolor) {
      $scope.campaignSettings.widget_settings.paymentfontcolor = "000000"
    }
    if (!$scope.campaignSettings.widget_settings.profilefontcolor) {
      $scope.campaignSettings.widget_settings.profilefontcolor = "000000"
    }
    if (!$scope.campaignSettings.widget_settings.rewardsfontcolor) {
      $scope.campaignSettings.widget_settings.rewardsfontcolor = "000000"
    }
    if (!$scope.campaignSettings.widget_settings.streamsfontcolor) {
      $scope.campaignSettings.widget_settings.streamsfontcolor = "000000"
    }
    if (!$scope.campaignSettings.widget_settings.tabbackgroundcolor) {
      $scope.campaignSettings.widget_settings.tabbackgroundcolor = "FFFFFF"
    }
    if (!$scope.campaignSettings.widget_settings.tabselectedfontcolor) {
      $scope.campaignSettings.widget_settings.tabselectedfontcolor = "000000"
    }
    if (!$scope.campaignSettings.widget_settings.tabunselectedfontcolor) {
      $scope.campaignSettings.widget_settings.tabunselectedfontcolor = "000000"
    }
    if (!$scope.campaignSettings.widget_settings.topfontcolor) {
      $scope.campaignSettings.widget_settings.topfontcolor = "000000"
    }
  }

  function setWidget() {
    var widgetSettings = $scope.campaign.settings.widget_settings;
    $("sedra-widget").attr("campaignid", $routeParams.campaign_id);
    for (var prop in widgetSettings) {
      if (prop != "fontfamily") {
        widgetSettings[prop] = "#" + widgetSettings[prop];
      }
      $("sedra-widget").attr(prop, widgetSettings[prop]);
    }
    setIframeWidget();
  }

  var widgetiframe;

  function setIframeWidget() {
    window.widgetHost = API_URL.url;

    widgetiframe = document.createElement('iframe');
    widgetiframe.setAttribute("id", "sedra-widget-container");
    widgetiframe.setAttribute("frameborder", "0");
    widgetiframe.setAttribute("seamless", "seamless");
    widgetiframe.setAttribute("width", "100%");
    widgetiframe.setAttribute("scrolling", "no");

    var host = $location.protocol() + "://" + $location.host() + "/";

    var srcString = API_URL.url + "/service/restv1/campaign/" + $scope.campaign_id + "/widget";
    srcString += "?src=" + $scope.widgetURL;
    srcString += "&themecolor=%23" + $scope.campaignSettings.widget_settings.themecolor;
    srcString += "&backersfontcolor=%23" + $scope.campaignSettings.widget_settings.backersfontcolor;
    srcString += "&blurbfontcolor=%23" + $scope.campaignSettings.widget_settings.blurbfontcolor;
    srcString += "&campaignfontcolor=%23" + $scope.campaignSettings.widget_settings.campaignfontcolor;
    srcString += "&commentsfontcolor=%23" + $scope.campaignSettings.widget_settings.commentsfontcolor;
    srcString += "&contactfontcolor=%23" + $scope.campaignSettings.widget_settings.contactfontcolor;
    srcString += "&creatorfontcolor=%23" + $scope.campaignSettings.widget_settings.creatorfontcolor;
    srcString += "&faqfontcolor=%23" + $scope.campaignSettings.widget_settings.faqfontcolor;
    srcString += "&fundingfontcolor=%23" + $scope.campaignSettings.widget_settings.fundingfontcolor;
    srcString += "&paymentfontcolor=%23" + $scope.campaignSettings.widget_settings.paymentfontcolor;
    srcString += "&profilefontcolor=%23" + $scope.campaignSettings.widget_settings.profilefontcolor;
    srcString += "&rewardsfontcolor=%23" + $scope.campaignSettings.widget_settings.rewardsfontcolor;
    srcString += "&streamsfontcolor=%23" + $scope.campaignSettings.widget_settings.streamsfontcolor;
    srcString += "&tabbackgroundcolor=%23" + $scope.campaignSettings.widget_settings.tabbackgroundcolor;
    srcString += "&tabselectedfontcolor=%23" + $scope.campaignSettings.widget_settings.tabselectedfontcolor;
    srcString += "&tabunselectedfontcolor=%23" + $scope.campaignSettings.widget_settings.tabunselectedfontcolor;
    srcString += "&topfontcolor=%23" + $scope.campaignSettings.widget_settings.topfontcolor;
    srcString += "&fontfamily=Helvetica";
    srcString += "&preview=yes";
    widgetiframe.src = srcString;

    $("#sedra-widget-container-area").append(widgetiframe);

  }

  function getScriptTagWithoutClass(url) {
    var scriptString = "<script src='" + url + "' type='text/javascript'></script>";
    return scriptString;
  }

  function getScriptTag(url) {
    var scriptString = "<script src='" + url + "' type='text/javascript' class = 'sedra-js'></script>";
    return scriptString;
  }

  function setIframeWidgetHeight() {
    if ($(widgetiframe).contents().find("body").height() > 0) {
      $(widgetiframe).height($(widgetiframe).contents().find("body").height());
    }
  }

  $scope.$on("$routeChangeStart", function() {
    if (intervalChecking != undefined) {
      $interval.cancel(intervalChecking);
    }
  });

  $scope.setIframeWidgetHeight = function() {
    intervalChecking = $interval(setIframeWidgetHeight, 1000);

    $timeout(function() {
      $interval.cancel(intervalChecking);
    }, 10000);
  }
  
});