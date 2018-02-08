app.controller('TransactionDetailsCtrl', function($scope, $q, $routeParams, $timeout, Restangular, RestFullResponse, $translatePartialLoader, $translate, RESOURCE_REGIONS, LANG) {
  $scope.RESOURCE_REGIONS = RESOURCE_REGIONS;
  var campaign_id = $routeParams.campaign_id;
  var globalPhoneNumberType = {};
  var globalStripeStatus = [];
  var globalStripeType = [];

  $translate(["Landline Phone Number", "Mobile Phone Number", "Fax Phone Number"]).then(function(phoneNumberType) {
    globalPhoneNumberType = phoneNumberType;
  });

  $translate(["stripe_status_status_new_ready_process", "stripe_status_status_new_being_processed", "stripe_status_status_processed_success", "stripe_status_status_processed_failure", "stripe_status_type_pledge_preauth", "stripe_status_type_pledge_capture"]).then(function(stripeTranslation) {
    for (var stripeResp in stripeTranslation) {
      if (stripeTranslation.hasOwnProperty(stripeResp)) {
        if (globalStripeStatus.length < 4) {
          globalStripeStatus.push(stripeTranslation[stripeResp]);
        } else {
          globalStripeType.push(stripeTranslation[stripeResp]);
        }
      }
    }
  });

  if (campaign_id) {
    Restangular.one('campaign').customGET(campaign_id).then(function(success) {
      $scope.campaign = success;
      $scope.$emit("loading_finished");
      //($scope.campaign);
    });
  } else {
    $scope.$emit("loading_finished");
  }
  $scope.filename = "detail";
  $scope.data = [];
  $scope.showContact = function(index) {
    var nativeLookup = $scope.public_settings.site_theme_shipping_native_lookup;
    if ($scope.transaction_detail[index].backer[0].person[0].person_shipping_phone_number != null) {
      var phoneNumber = $scope.transaction_detail[index].backer[0].person[0].person_shipping_phone_number[0].number;
      var phoneType = $scope.transaction_detail[index].backer[0].person[0].person_shipping_phone_number[0].phone_number_type;

      $scope.shippingPhoneNumber = phoneNumber;
      $scope.shippingPhoneType = phoneType;
    }

    $scope.address = $scope.transaction_detail[index].backer[0].person[0].person_shipping_address;
    if (!$scope.alt_shipping) {
      var name = $scope.transaction_detail[index].backer[0].person[0].first_name + " " + $scope.transaction_detail[index].backer[0].person[0].last_name;
      var city = ($scope.address[0].city_native_name != null && nativeLookup) ? $scope.address[0].city_native_name : $scope.address[0].city;
      var country = ($scope.address[0].country_native_name != null && nativeLookup) ? $scope.address[0].country_native_name : $scope.address[0].country;
      var street = $scope.address[0].street1;
      var mailcode = $scope.address[0].mail_code;
      var subcountry = ($scope.address[0].subcountry_native_name != null && nativeLookup) ? $scope.address[0].subcountry_native_name : $scope.address[0].subcountry;
      var address = city + ', ' + subcountry + " " + mailcode;
      $('#backername').text(name);
      $('#street').text(street);
      $('#main_address').text(address);
      $('#country_name').text(country);
    }
    else if ($scope.alt_shipping) {
      var name = $scope.transaction_detail[index].backer[0].person[0].first_name + " " + $scope.transaction_detail[index].backer[0].person[0].last_name;
      var city = ($scope.address[0].city_native_name != null && nativeLookup) ? $scope.address[0].city_native_name : $scope.address[0].city;
      var country = ($scope.address[0].country_native_name != null && nativeLookup) ? $scope.address[0].country_native_name : $scope.address[0].country;
      var street = $scope.address[0].street1;
      var mailcode = $scope.address[0].mail_code;
      var subcountry = ($scope.address[0].subcountry_native_name != null && nativeLookup) ? $scope.address[0].subcountry_native_name : $scope.address[0].subcountry;
      var address = subcountry + ", " + city ;
      $('#backername').text(name);
      $("#postcode").text(mailcode);
      $('#street').text(street);
      $('#main_address').text(address);
      $('#country_name').text(country);
    }

    $('.small.test.modal').modal('show');
  }

  Restangular.one('portal/setting').getList().then(
    function(success) {
      $scope.public_settings = {};
      angular.forEach(success, function(value) {
        if (value.setting_type_id == 3) {
          $scope.public_settings[value.name] = value.value;
          $scope.payment_gateway = $scope.public_settings.site_payment_gateway;
        }
      });
      $scope.alt_shipping = $scope.public_settings.site_theme_alt_shipping_layout;
      if ($scope.payment_gateway == 1) {
        Restangular.one('campaign/' + campaign_id + '/stats').customGET(null, {
          summary: 1
        }).then(function(success) {
          $scope.transaction_summary = success;
          renderSummaryChart();
        });
        RestFullResponse.all('campaign/' + campaign_id + '/stats').getList($scope.transaction_pagination).then(function(success) {
          $scope.transaction_detail = success.data;
          $scope.na = "";
          var headers = success.headers();
          if (!headers['x-pager-total-entries']) {
            $scope.transaction_length = "0";
          } else {
            $scope.transaction_length = headers['x-pager-total-entries'];
          }
          $scope.transaction_pagination.currentpage = headers['x-pager-current-page'];
          $scope.transaction_pagination.numpages = headers['x-pager-last-page'];
          $scope.transaction_pagination.nextpage = headers['x-pager-next-page'];
          $scope.transaction_pagination.pagesinset = headers['x-pager-pages-in-set'];
          $scope.transaction_pagination.totalentries = headers['x-pager-total-entries'];
          $scope.transaction_pagination.entriesperpage = headers['x-pager-entries-per-page'];
        });


      } else {
        Restangular.one('campaign/' + campaign_id + '/stats').customGET(null, {
          summary: 1,
          use_widgetmakr: 1
        }).then(function(success) {
          $scope.transaction_summary = success;
          renderSummaryChart();
        });


        Restangular.one('campaign/' + campaign_id + '/stats').customGET(null, {
          summary: 0,
          use_widgetmakr: 1
        }).then(function(success) {
          $scope.transaction_detail = success;
          $scope.na = "";
          // ($scope.transaction_detail);
        });
      }

    },
    function(failure) {
      $msg = {
        'header': failure.data.message,
      }
      $scope.errorMessage.push($msg);
    });

  // Create transaction csv based on all transaction data 
  $scope.createTransactionCSV = function(campaign_id){
    var transactionRequestArray = [];
    var totalNumTransaction = $scope.transaction_pagination.totalentries;
    var requiredNumCalls = 0;
    $scope.allTransactionArray = [];
    var reqArg = {
      "page": 1
    }
    requiredNumCalls = parseInt(parseInt(totalNumTransaction) / 100);
    if (totalNumTransaction % 100 != 0) {
      requiredNumCalls += 1;
    }
    // Transaction pagination CSV, needs to be different from original transaction_pagination to avoid conflict
    $scope.transaction_pagination_csv = {
      "sort": '-created',
      "page_entries": 100,
      "page_limit": 150,
      "page": 1,
      "pagination": {},
      "summary": 0
    };
    for (var curNumCall = 0; curNumCall < requiredNumCalls; curNumCall++) {
      var request = RestFullResponse.all('campaign/' + campaign_id + '/stats').getList($scope.transaction_pagination_csv);
      transactionRequestArray.push(request);
      $scope.transaction_pagination_csv.page += 1;
    }
    return $q.all(transactionRequestArray).then(function(success) {
      $scope.allTransactioncsv = [];
      success.forEach(function(resArr) {
        $scope.allTransactionArray = $scope.allTransactionArray.concat(resArr.data);
      });
      var nativeLookup = $scope.public_settings.site_theme_shipping_native_lookup;
      var value = $translate.instant(['transaction_details_withdrawn', 'transaction_details_card_number', 'transaction_details_Manual_Transaction', 'transaction_details_na', 'transaction_details_transaction_id', 'transaction_details_contributors_first', 'transaction_details_contributors_last', 'transaction_details_reward', 'transaction_details_amount', 'transaction_details_status', 'transaction_details_date', 'transaction_details_contributors_email', 'transaction_details_shipping_address', 'transaction_details_phone_number','transaction_details_reward_attribute',"transaction_details_charity_UK_taxpayer","transaction_details_charity_giftaid","transaction_details_charity_fullname", "transaction_details_charity_fulladdress","transaction_details_charity_postcode","transaction_details_charity_amount"]);
        $scope.cardnum = value.transaction_details_card_number;
        $scope.noreward = value.transaction_details_na;
        $scope.tid = value.transaction_details_transaction_id;
        $scope.treward = value.transaction_details_reward;
        $scope.tamount = value.transaction_details_amount;
        $scope.tstatus = value.transaction_details_status;
        $scope.tnamef = value.transaction_details_contributors_first;
        $scope.tnamel = value.transaction_details_contributors_last;
        $scope.temail = value.transaction_details_contributors_email;
        $scope.tdate = value.transaction_details_date;
        $scope.taddress = value.transaction_details_shipping_address;
        $scope.tphone = value.transaction_details_phone_number;
        $scope.twithdraw = value.transaction_details_withdrawn;
        $scope.manual = value.transaction_details_Manual_Transaction;
        $scope.attributes = value.transaction_details_reward_attribute;
        $scope.csvHeaders = {
          'ID': $scope.tid,
          'Reward': $scope.treward,
          'Amount': $scope.tamount,
          'Status': $scope.tstatus,
          'First Name': $scope.tnamef,
          'Last Name': $scope.tnamel,
          'Email': $scope.temail,
          'Card': $scope.cardnum,
          'Date': $scope.tdate,
          'Address': $scope.taddress,
          'Phone': $scope.tphone,
          'Attribute': $scope.attributes
        };

        // if charity is enabled site_campaign_charity_helper_enable
        if($scope.public_settings.site_campaign_charity_helper_enable){
          $scope.csvHeaders["UK Tax Payer"] = value.transaction_details_charity_UK_taxpayer;
          $scope.csvHeaders["Gift Aid"] = value.transaction_details_charity_giftaid;
          $scope.csvHeaders["Full name"] = value.transaction_details_charity_fullname;
          $scope.csvHeaders["Full Address"] = value.transaction_details_charity_fulladdress;
          $scope.csvHeaders["Postcode"] = value.transaction_details_charity_postcode;
          $scope.csvHeaders["Gift Amount"] = value.transaction_details_charity_amount;
        }
        $scope.allTransactioncsv.push($scope.csvHeaders);
        angular.forEach($scope.allTransactionArray, function(value) {
          // ($scope.twithdraw);
          var data1 = {};
          if (value.card) {
            $scope.cardn = '****' + ' ' + '****' + ' ' + '****' + value.card[0].last4;
            $scope.tstatus = globalStripeStatus[value.stripe_transaction_status_id - 1];
          } else {
            $scope.cardn = value.reference_no;
            $scope.tstatus = $scope.manual;
          }
          if (value.backer) {
            if (value.backer[0].disabled) {
              $scope.tstatus = $scope.twithdraw;
            }

            if (value.backer[0].person) {
              $scope.addbacker = value.backer[0].person[0];
              if (value.backer[0].pledge_level) {
                $scope.rewardname = value.backer[0].pledge_level[0].name;
              } else {
                $scope.rewardname = $scope.noreward;
              }
              var phoneNumberObj = value.backer[0].person[0].person_shipping_phone_number;
              var phoneType;
              if (phoneNumberObj != null) {
                phoneType = globalPhoneNumberType[phoneNumberObj[0].phone_number_type];
              }
              $scope.dataPhoneNumber = phoneNumberObj != null ? phoneNumberObj[0].number + " " + phoneType : "";
              var parsedEmail = $scope.addbacker.email.split("|||")[0];
              if ($scope.addbacker.person_shipping_address) {
                $scope.shipadd = $scope.addbacker.person_shipping_address[0];
                if (nativeLookup) {
                  $scope.shipadd.city = $scope.shipadd.city_native_name != null ? $scope.shipadd.city_native_name : $scope.shipadd.city;
                  $scope.shipadd.subcountry = $scope.shipadd.subcountry_native_name != null ? $scope.shipadd.subcountry_native_name : $scope.shipadd.subcountry;
                  $scope.shipadd.country = $scope.shipadd.country_native_name != null ? $scope.shipadd.country_native_name : $scope.shipadd.country;
                  $scope.completeaddress = $scope.shipadd.country + ", " + $scope.shipadd.mail_code + ", " + $scope.shipadd.subcountry + ", " + $scope.shipadd.city + ", " + $scope.shipadd.street1;
                } else {
                  $scope.completeaddress = $scope.shipadd.street1 + " , " + $scope.shipadd.city + " " + $scope.shipadd.subcountry + " " + $scope.shipadd.mail_code + " , " + $scope.shipadd.country;
                }
                // data1 = {'$scope.personname': $scope.addbacker.first_name, '$scope.personemail':$scope.addbacker.email,'$scope.personaddress':$scope.completeaddress};
                data1 = {
                  'ID': value.stripe_transaction_id,
                  'Reward': $scope.rewardname,
                  'Amount': value.backer[0].amount,
                  'Status': $scope.tstatus,
                  'First Name': $scope.addbacker.first_name,
                  'Last Name': $scope.addbacker.last_name,
                  'Email': parsedEmail,
                  'Card': $scope.cardn,
                  'Date': value.created.slice(0, 19),
                  'Address': $scope.completeaddress,
                  'Phone': $scope.dataPhoneNumber,
                  'Attributes': JSON.stringify(value.backer[0].attributes)
                };
              } else {
                data1 = {
                  'ID': value.stripe_transaction_id,
                  'Reward': $scope.rewardname,
                  'Amount': value.backer[0].amount,
                  'Status': $scope.tstatus,
                  'First Name': $scope.addbacker.first_name,
                  'Last Name': $scope.addbacker.last_name,
                  'Email': parsedEmail,
                  'Card': $scope.cardn,
                  'Date': value.created.slice(0, 19),
                  'Address': $scope.na,
                  'Phone': $scope.dataPhoneNumber,
                  'Attributes': JSON.stringify(value.backer[0].attributes)
                };
              }

              // if charity is enabled site_campaign_charity_helper_enable
              if($scope.public_settings.site_campaign_charity_helper_enable){
                if(value.backer[0].attributes){
                  if(value.backer[0].attributes.charity){
                    data1["UK Tax Payer"] = value.backer[0].attributes.charity.is_a_tax_payer;
                    data1["Gift Aid"] = value.backer[0].attributes.charity.is_a_gift;
                    data1["Full name"] = value.backer[0].attributes.charity.fullname;
                    data1["Full Address"] = value.backer[0].attributes.charity.address;
                    data1["Postcode"] = value.backer[0].attributes.charity.postcode;
                    data1["Gift Amount"] = value.backer[0].charity_helper_amount;
                  }
                }
              }
              $scope.allTransactioncsv.push(data1);
            }
          }
        });
      return $scope.allTransactioncsv;
    });
  }  


  // render chart
  function renderSummaryChart() {
    var ctx = $('#campaign-transaction-chart').get(0).getContext("2d");
    var transaction_chart = new Chart(ctx);
    //($scope.transaction_summary.total_pre_auth_new);
    var data = {
      labels: ["Total new pre auth", "Total pre auth success", "Total pre auth failure", "Total new captures", "Total capture success", "Total capture failure"],
      datasets: [{
        data: [parseInt($scope.transaction_summary.total_pre_auth_new), parseInt($scope.transaction_summary.total_pre_auth_success), parseInt($scope.transaction_summary.total_pre_auth_failure), parseInt($scope.transaction_summary.total_capture_new), parseInt($scope.transaction_summary.total_capture_success), parseInt($scope.transaction_summary.total_capture_failure)],
        fillColor: "rgba(151,187,205,0.5)",
        strokeColor: "rgba(151,187,205,0.8)",
        highlightFill: "rgba(151,187,205,0.75)",
        highlightStroke: "rgba(151,187,205,1)",
      }]
    };

    return transaction_chart.Bar(data);
  }

  //Transaction pagination
  $scope.transaction_pagination = {
    "sort": '-created',
    "page_entries": 100,
    "page_limit": 100,
    "page": 1,
    "pagination": {},
    "summary": 0
  };

  $scope.getTransactions = function(index) {
    RestFullResponse.all('campaign/' + index + '/stats').getList($scope.transaction_pagination).then(function(success) {
      $scope.transaction_detail = success.data;
      $scope.na = "";
      var headers = success.headers();
      if (!headers['x-pager-total-entries']) {
        $scope.transaction_length = "0";
      } else {
        $scope.transaction_length = headers['x-pager-total-entries'];
      }
      $scope.transaction_pagination.currentpage = headers['x-pager-current-page'];
      $scope.transaction_pagination.numpages = headers['x-pager-last-page'];
      $scope.transaction_pagination.nextpage = headers['x-pager-next-page'];
      $scope.transaction_pagination.pagesinset = headers['x-pager-pages-in-set'];
      $scope.transaction_pagination.totalentries = headers['x-pager-total-entries'];
      $scope.transaction_pagination.entriesperpage = headers['x-pager-entries-per-page'];
    });

    // Get all transaction for csv
  }
});

app.filter('dateconv', function($filter) {
  return function(input) {
    if (input == null) {
      return "";
    }

    //var _date = $filter('date')(new Date(input), 'MMM dd yyyy');
    //	(input);
    var year = input.substring(0, 4);
    var month = input.substring(5, 7);
    var day = input.substring(8, 10);
    var hr = input.substring(11, 13);
    var min = input.substring(14, 16);

    // do a pure convertion
    var d = year + "-" + month + "-" + day + "   " + hr + ":" + min;
    //(d);
    return d;
  };

});
