app.controller('InlineContributionCtrl', function($rootScope, $q, $location, $scope, $filter, $translatePartialLoader, $translate, UserService, StripeService, $routeParams, Restangular, Geolocator, RESOURCE_REGIONS, PortalSettingsService, $timeout, $sce, PHONE_TYPE, LANG) {

  var msg;

  //Contribution page
  $scope.RESOURCE_REGIONS = RESOURCE_REGIONS;
  window.a = $scope;

  $scope.pledgeLevel = $routeParams.plid;
  $scope.pledgeAmount = parseInt($routeParams.m);
  $scope.displayAmount = $scope.pledgeAmount;
  $scope.campaign_id = $routeParams.eid;
  $scope.selectedCity = {};
  $scope.selectedSubcountry = {};
  $scope.selectedCountry = {};
  $scope.campaign_loc = $rootScope.currentLoc;
  $scope.chosenPhoneNumberId = "";
  $scope.failed_submit = false;
  $scope.accountInfo = {};
  $scope.charity = {};
  // $scope.rdm_pw = $scope.randomPasswordGenerator();
  // grab rewards variation choice if set
  if ($routeParams.attr) {
    $scope.selectedRewardAttrs = $routeParams.attr;
  }

  $scope.phonetype = PHONE_TYPE;

  $scope.phoneInfo = {
    number: '',
    phone_number_type_id: '',
    business_organization_id: '',
    person_id: ''
  }

  $scope.newNumberCreated = {
    number: '',
    phonetype: ''
  }

  $scope.$watch('displayAmount', function(value) {
    if (value) {
      value = String(value).replace(/,/g, "");
      $scope.pledgeAmount = value;
    }
  });
  $scope.cardselected = "Visa";
  $scope.cardID = 1;
  $scope.cardtype = [{
    name: 'Visa',
    id: 1
  }, {
    name: 'American Express',
    id: 2
  }, {
    name: 'Master Card',
    id: 3
  }, {
    name: 'Discover',
    id: 4
  }];

  // set toggle object
  $scope.toggle = {
    newCard: false,
    newAddress: false,
    selectedCard: false,
    selectedAddress: false
  };

  $scope.campaignFundingGoal = {
    "value": $scope.pledgeAmount
  };

  $scope.stripeExtraDetails = {
    address_city: '',
    address_country: '',
    address_line1: '',
    name: ''
  };

  var portal_settings;

  $('i').popup();
  Restangular.one('portal/setting').getList().then(
    function(success) {
      $scope.public_settings = {};
      angular.forEach(success, function(value) {
        if (value.setting_type_id == 3) {
          $scope.public_settings[value.name] = value.value;
          $scope.payment_gateway = $scope.public_settings.site_payment_gateway;
          if ($scope.public_settings.site_theme_campaign_min_contribute_amount) {
            $scope.public_settings.site_theme_campaign_min_contribute_amount = parseInt($scope.public_settings.site_theme_campaign_min_contribute_amount);
            $scope.pledgeAmount = parseInt($scope.pledgeAmount);
            if ($scope.pledgeAmount < $scope.public_settings.site_theme_campaign_min_contribute_amount) {
              $scope.pledgeAmount = $scope.public_settings.site_theme_campaign_min_contribute_amount;
            }
          }
        }
      });

      // maximum amount pledge
      $scope.max_amoumt = parseInt($scope.public_settings.site_theme_campaign_max_contribute_amount);
      if ($scope.public_settings.site_theme_campaign_max_pledge_enabled) {
        if (typeof $scope.pledgeLevel === 'undefined') {
          $scope.allow_max = true;
        }
      }
    },
    function(failed) {
      msg = {
        'header': failed.data.message,
      }
      $rootScope.floatingMessage = msg;
    }
  );

  // These are the required shipping variables for alternative layout and native_lookup
  function setShippingVar() {
    $scope.alt_shipping = portal_settings.site_theme_alt_shipping_layout;
    $scope.native_lookup = portal_settings.site_theme_shipping_native_lookup;
    if ($scope.native_lookup) {
      portal_settings.site_theme_default_shipping_country.name = portal_settings.site_theme_default_shipping_country.native_name;
    }
    $scope.default_country = portal_settings.site_theme_default_shipping_country;
    $scope.selectedCountry.selected = portal_settings.site_theme_default_shipping_country;
    $scope.setCountry($scope.selectedCountry.selected);
    if ($scope.selectedCountry.selected) {
      getSubcountries($scope.selectedCountry.selected.id);
    }
    if ($scope.selectedReward && $scope.selectedReward.shipping) {
      getCountries().then(function(countries) {
        var newCountries = [];
        var worldShippingExist = false;
        var countryShippingList = [];
        angular.forEach($scope.selectedReward.shipping, function(value, key) {
          if (value.shipping_option_type_id == 1 || value.shipping_option_type_id == 3) {
            worldShippingExist = true;
          }
          if (value.shipping_option_type_id == 2) {
            countryShippingList.push(value);
          }
        });
        // If world shipping does not exist,then get new shipping list
        if (!worldShippingExist) {
          angular.forEach(countryShippingList, function(item, key) {
            angular.forEach(countries, function(country, key) {
              if (item.country_id == country.id) {
                newCountries.push(country);
              }
            });
          });
          $scope.countries = newCountries;
        }
      });
    } else {
      getCountries();
    }
  }

  $scope.lowestAmount;
  $scope.tipInfo;
  Restangular.one('account/stripe/charge-amount').customGET().then(function(success) {
    if (success[0]) {
      $scope.lowestAmount = parseFloat(success[0].minimum_charge_amount);
      $scope.tipInfo = success[0];
      if ($scope.tippingOptions.toggle) {
        setUpTipping();
      }
    } else {
      $scope.lowestAmount = 0.5;
      if ($scope.campaign) {
        $scope.tipInfo = $scope.campaign.currencies[0]
      }
    }
  });

  $scope.tip = { value: null, dollar_amount: 0, type: 'Dollar', name: '' };
  $scope.tipTypeError = false;

  // get portal settings guest options
  PortalSettingsService.getSettingsObj().then(function(success) {
    portal_settings = success.public_setting;
    $scope.allowDecimalNotation = portal_settings.site_campaign_decimal_option;
    $scope.contributionTypeRadio = portal_settings.site_theme_campaign_contribution_type_radio;
    $scope.anonymousContributionTypeOnly = portal_settings.site_campaign_anonymous_contribution_type_only;
    $scope.enableRewardVariation = portal_settings.site_theme_campaign_show_reward_enable_variation;
    $scope.tippingOptions = portal_settings.site_tipping;
    $scope.charity_percentage_fee = portal_settings.site_campaign_charity_helper_percentage;
    $scope.isEnableContributionMessage = portal_settings.site_campaign_allow_contribution_message;
    $scope.isContributionLayout1 = portal_settings.site_campaign_contribution_layout_toggle_1;
    $scope.isExpressCheckout = portal_settings.site_campaign_express_toggle;
    $scope.site_stripe_tokenization_settings = portal_settings.site_stripe_tokenization;

    if (typeof $scope.site_stripe_tokenization_settings === 'undefined' || $scope.site_stripe_tokenization_settings == null) {
      $scope.site_stripe_tokenization_settings = {
        public_stripe_key: '',
        toggle: false
      };
    }

    if ($scope.anonymousContributionTypeOnly) {
      $scope.selecteContribution = false;
    } else {
      $scope.selecteContribution = "contribution_type_regular";
    }

    if (typeof $scope.tippingOptions === 'undefined' || $scope.tippingOptions == null) {
      $scope.tippingOptions = { toggle: false };
    } else {
      if ($scope.tippingOptions.toggle) {
        setUpTipping();
      }
    }

    $scope.guest_contrib_option = success.public_setting.site_contribute_behaviour.default;
    if ($scope.guest_contrib_option == 1 || $scope.guest_contrib_option == 3) {
      // set default inline option to existing user
      $scope.guestOption = 1;
    } else if ($scope.guest_contrib_option == 2) {
      // set default inline option to be guest
      $scope.guestOption = 3;
    }
    if (portal_settings.site_campaign_always_anonymous_contribution) {
      $scope.contribution = $scope.contribution.slice($scope.contribution.length - 1);
      $scope.anonymous_contribution = 1;
      $scope.partial_anonymous_contribution = 0;
    }
    if ($scope.isExpressCheckout) {
      $scope.guestOption = 4;
    }

  });

  function setUpTipping() {
    if (!$scope.tippingOptions.selectedTipDefault) {
      $scope.tippingOptions.selectedTipDefault = 'tiers';
    }
    if ($scope.tippingOptions.toggle_dynamic && !$scope.tippingOptions.toggle_tiers || $scope.tippingOptions.selectedTipDefault == 'dynamic') {
      $scope.tip = { value: null, dollar_amount: 0, type: 'Dollar', name: '' };
      if ($scope.tippingOptions.toggle_dynamic_min_max && $scope.tippingOptions.dynamic_min) {
        $scope.tip.value = $scope.tippingOptions.dynamic_min;
        $scope.tip.dollar_amount = $scope.tippingOptions.dynamic_min;
      }
      $scope.selectedTipType = 'dynamic';
      $scope.tip = { value: null, dollar_amount: 0, type: 'Dollar' };
      if ($scope.tippingOptions.toggle_dynamic_min_max && $scope.tippingOptions.dynamic_min) {
        $scope.tip.value = $scope.tippingOptions.dynamic_min;
        $scope.tip.dollar_amount = $scope.tippingOptions.dynamic_min;
      }
    } else if ($scope.tippingOptions.toggle_tiers || $scope.tippingOptions.selectedTipDefault == 'tiers' || $scope.tippingOptions.selectedTipDefault == 'tiers') {
      $scope.tip = { value: null, dollar_amount: 0, type: 'Dollar', name: '' };
      if ($scope.tippingOptions.tiers[0]) {
        $scope.updateTierValues();
        var dollarAmount = $scope.tippingOptions.tiers[0].value;
        if ($scope.tippingOptions.tiers[0].type == "Percent") {
          dollarAmount = ($scope.tippingOptions.tiers[0].value / 100) * $scope.pledgeAmount;
          if (dollarAmount < $scope.lowestAmount) {
            dollarAmount = $scope.lowestAmount;
          }
        }
        $scope.tip = { value: $scope.tippingOptions.tiers[0].value, dollar_amount: dollarAmount, type: $scope.tippingOptions.tiers[0].type, name: $scope.tippingOptions.tiers[0].name };
      }
      $scope.selectedTipType = 'tiers';
    } else if (!$scope.tippingOptions.toggle_dynamic && !$scope.tippingOptions.toggle_tiers && $scope.tippingOptions.toggle_no_tip) {
      $scope.selectedTipType = 'no_tip';
      $scope.tip = { value: null, dollar_amount: 0, type: 'Dollar' };
    }

    if ($scope.tippingOptions.toggle_no_tip && $scope.tippingOptions.selectedTipDefault == 'no_tip') {
      $scope.selectedTipType = 'no_tip';
      $scope.tip = { value: null, dollar_amount: 0, type: 'Dollar' };
    }
  }

  //get the campaign
  Restangular.one('campaign').customGET($scope.campaign_id, {
    use_path_lookup: $routeParams.privatepath ? 1 : 0,
    path: $routeParams.privatepath
  }).then(function(success) {
    $scope.$emit("loading_finished");
    $scope.campaign = success;
    // change page title
    $rootScope.page_title = $scope.campaign.name ? $scope.campaign.name + ' - Inline Contribution' : 'Inline Contribution';
    $scope.campaign_loc = $scope.campaign.uri_paths[0].path;
    angular.forEach($scope.campaign.pledges, function(value, key) {
      if ($scope.pledgeLevel == value.pledge_level_id) {
        $scope.pledgeindex = key;
        $scope.selectedReward = value;
        $scope.rname = $scope.campaign.pledges[$scope.pledgeindex].name;
      }
    });

    // Grab Campaign Settings to use
    angular.forEach($scope.campaign.settings, function(value, index) {
      var setting_name = value.name;
      var setting_value = value.value;
      if (setting_name == "name") {
        return;
      }
      $scope.campaign[setting_name] = setting_value;
    });

    if (typeof $scope.public_settings.site_theme_campaign_per_min != 'undefined' && $scope.public_settings.site_theme_campaign_per_min) {
      if (typeof $scope.campaign.min_contribution != 'undefined') {
        $scope.public_settings.site_theme_campaign_min_contribute_amount = parseFloat($scope.campaign.min_contribution);
        $scope.pledgeAmount = parseFloat($scope.pledgeAmount);
        if ($scope.pledgeAmount < $scope.public_settings.site_theme_campaign_min_contribute_amount) {
          $scope.pledgeAmount = $scope.public_settings.site_theme_campaign_min_contribute_amount;
          $scope.campaignFundingGoal = {
            "value": $scope.pledgeAmount
          };
        }
      }
    }
    if (typeof $scope.public_settings.site_theme_campaign_per_max != 'undefined' && $scope.public_settings.site_theme_campaign_per_max) {
      if (typeof $scope.campaign.max_contribution != 'undefined') {
        $scope.max_amoumt = parseFloat($scope.campaign.max_contribution);
        $scope.allow_max = true;
      }
    }

    $rootScope.campaign_path = $scope.campaign.uri_paths[0].path;
    setShippingVar();
  });

  //The types of contribution
  $scope.contribution = [{
    name: 'contribution_type_regular',
    type: 1
  }, {
    name: 'contribution_type_partiallyanon',
    type: 3
  }, {
    name: 'contribution_type_fullyanon',
    type: 2
  }];

  $scope.cardTypeSelected = function(type) {
    $scope.cardselected = type.name;
    $scope.cardID = type.id;
  }
  $scope.contributionSelectionHelp = "Contribution Selection 1 is selected";
  $scope.contributionSelected = function(type) {
    $scope.selecteContribution = type.type;

    // Defining the help text according to the selected item
    if ($scope.selecteContribution == 1) {
      $scope.contributionSelectionHelp = "Contribution Selection 1 is selected";
    } else if ($scope.selecteContribution == 2) {
      $scope.contributionSelectionHelp = "Contribution Selection 2 is selected";
    } else if ($scope.selecteContribution == 3) {
      $scope.contributionSelectionHelp = "Contribution Selection 3 is selected";
    }

    // Changes - Popup behavior for help circle icon for contribution selection
    $('.help-popup').popup({
      content: $scope.contributionSelectionHelp,
      on: 'click'
    })
  }

  $scope.initStripeElement = function() {

    var translation = $translate.instant(['pledge_campaign_stripe_elements_cardExpirey', 'pledge_campaign_stripe_elements_cardNumber', 'pledge_campaign_creditcard_cvc_placeholder']);

    $scope.stripe = Stripe($scope.site_stripe_tokenization_settings.public_stripe_key);
    $scope.elements = $scope.stripe.elements();

    var cardBrandToPfClass = {
      'visa': 'pf-visa',
      'mastercard': 'pf-mastercard',
      'amex': 'pf-american-express',
      'discover': 'pf-discover',
      'diners': 'pf-diners',
      'jcb': 'pf-jcb',
      'unknown': 'pf-credit-card',
    }

    //Styles 
    var style = {
      base: {
        iconColor: '#A3A3A3',
        color: '#000000',
        lineHeight: '16px',
        fontWeight: 400,
        fontFamily: 'Lato,"Helvetica Neue0",Arial,Helvetica,sans-serif',
        fontSize: '14px',
        '::placeholder': {
          color: '#A3A3A3',
        },
      },
      invalid: {
        color: '#d95c5c',
        ':focus': {
          color: '#d95c5c',
        },
      },
    };
    $scope.cardNumberElement = $scope.elements.create('cardNumber', {
      placeholder: translation.pledge_campaign_stripe_elements_cardNumber,
      iconStyle: 'solid',
      style: style
    });
    $scope.cardNumberElement.mount('#card-number-element');

    $scope.cardExpiryElement = $scope.elements.create('cardExpiry', {
      placeholder: translation.pledge_campaign_stripe_elements_cardExpirey,
      iconStyle: 'solid',
      style: style
    });
    $scope.cardExpiryElement.mount('#card-expiry-element');

    $scope.cardCvcElement = $scope.elements.create('cardCvc', {
      placeholder: translation.pledge_campaign_creditcard_cvc_placeholder,
      iconStyle: 'solid',
      style: style
    });
    $scope.cardCvcElement.mount('#card-cvc-element');

    $scope.cardNumberElement.addEventListener('change', function(event) {
      var displayError = angular.element('#card-errors');
      if (event.error) {
        displayError.textContent = event.error.message;
      } else {
        displayError.textContent = '';
      }
      // Switch brand logo
      if (event.brand) {
        setBrandIcon(event.brand, cardBrandToPfClass);
      }
    });
  }

  function setBrandIcon(brand, cardBrandToPfClass) {
    var brandIconElement = document.getElementById('brand-icon');
    var pfClass = 'pf-credit-card';
    if (brand in cardBrandToPfClass) {
      pfClass = cardBrandToPfClass[brand];
      switch (brand) {
        case "visa":
          $('#brand-icon').css("background-image", "url(images/cards/Visa.png)");
          break;
        case "mastercard":
          $('#brand-icon').css("background-image", "url(images/cards/MasterCard.png)");
          break;
        case "amex":
          $('#brand-icon').css("background-image", "url(images/cards/American%20Express.png)");
          break;
        case "dinersclub":
          $('#brand-icon').css("background-image", "url(images/cards/diners.png)");
          break;
        case "discover":
          $('#brand-icon').css("background-image", "url(images/cards/Discover.png)");
          break;
        case "jcb":
          $('#brand-icon').css("background-image", "url(images/cards/jcb.png)");
          break;
        default:
          $('#brand-icon').css("background-image", "url(images/cards/default-credit-card-icon.png)");
      }
    }
    for (var i = brandIconElement.classList.length - 1; i >= 0; i--) {
      brandIconElement.classList.remove(brandIconElement.classList[i]);
    }
    brandIconElement.classList.add('pf');
    brandIconElement.classList.add(pfClass);
  }

  $scope.isAGift = function(type) {
    $scope.selecteContribution = type.type;

    // Defining the help text according to the selected item
    if ($scope.selecteContribution == 1) {
      $scope.contributionSelectionHelp = "Contribution Selection 1 is selected";
    } else if ($scope.selecteContribution == 2) {
      $scope.contributionSelectionHelp = "Contribution Selection 2 is selected";
    } else if ($scope.selecteContribution == 3) {
      $scope.contributionSelectionHelp = "Contribution Selection 3 is selected";
    }

    // Changes - Popup behavior for help circle icon for contribution selection
    $('.help-popup').popup({
      content: $scope.contributionSelectionHelp,
      on: 'click'
    })
  }

  $scope.checkContribution = function() {

    if ($scope.selecteContribution == 2) {
      $scope.anonymous_contribution = true;

    } else {
      $scope.anonymous_contribution = false;
    }

    if ($scope.selecteContribution == 3) {
      $scope.partial_anonymous_contribution = 1;

    } else {
      $scope.partial_anonymous_contribution = 0;
    }
    if ($scope.selecteContribution == 1) {
      $scope.anonymous_contribution = false;
      $scope.partial_anonymous_contribution = 0;
    }
  };

  // reset select box dropdown to default
  $scope.dropdownReset = function(selector) {
    if (selector == '.address-select') {
      $scope.selectedAddress = null;
    } else {
      $scope.selectedCardID = null;
    }
    // restore dropdown
    $(selector).dropdown('restore defaults');
  };

  // set up objects to send through POST
  $scope.address = {
    city_id: '',
    mail_code: '',
    street1: '',
    street2: '',
    country_id: ''
  };
  $scope.creditCard = {
    number: '',
    exp_month: '',
    exp_year: '',
    cvc: '',
    name: '',
    inline_token: '',
    card_token: ''
  };
  $scope.person = {
    fname: '',
    lname: '',
    address1: '',
    zip: '',
    number: '',
    occupation: '',
    email: '',
    employer: ''
  };
  $scope.express = {
    fname: '',
    lname: '',
    email: ''
  };
  $scope.guestinfo = {};

  // Check card type when card number changes
  $scope.checkCardType = function() {
    var cardNumber = $scope.creditCard.number;
    var isCardValid = $.payment.validateCardNumber(cardNumber);
    var cardType = $.payment.cardType(cardNumber);

    var $card = $("input.creditCardNumber");

    switch (cardType) {
      case "visa":
        $card.css("background", "#fff url(images/cards/Visa.png) no-repeat right 10px center");
        break;
      case "mastercard":
        $card.css("background", "#fff url(images/cards/MasterCard.png) no-repeat right 10px center");
        break;
      case "amex":
        $card.css("background", "#fff url(images/cards/American%20Express.png) no-repeat right 10px center");
        break;
      case "dinersclub":
        $card.css("background", "#fff url(images/cards/diners.png) no-repeat right 10px center");
        break;
      case "discover":
        $card.css("background", "#fff url(images/cards/Discover.png) no-repeat right 10px center");
        break;
      case "jcb":
        $card.css("background", "#fff url(images/cards/jcb.png) no-repeat right 10px center");
        break;
      default:
        $card.css("background-image", "none");
    }
  }

  $scope.initStripePayment = function() {
    $("input.creditCardNumber").payment("formatCardNumber");
    $("input.cardCVC").payment("formatCardCVC");
  }

  // Start up - Popup behavior for help circle icon for contribution selection
  $('.help-popup').popup({
    content: $scope.contributionSelectionHelp,
    on: 'click'
  });
  $scope.createNewAccExpressValidation = function() {
    var translation = $translate.instant(['guest_contribution_new_first_name_error', 'guest_contribution_new_last_name_error', 'guest_contribution_new_email_error', 'guest_contribution_new_email_error2']);
    $('.express-form.ui.form').form({
      first_name: {
        identifier: 'first_name',
        rules: [{
          type: 'empty',
          prompt: translation.guest_contribution_new_first_name_error
        }]
      },
      last_name: {
        identifier: 'last_name',
        rules: [{
          type: 'empty',
          prompt: translation.guest_contribution_new_last_name_error
        }]
      },
      email: {
        identifier: 'email',
        rules: [{
          type: 'empty',
          prompt: translation.guest_contribution_new_email_error
        }, {
          type: 'email',
          prompt: translation.guest_contribution_new_email_error2
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
  $scope.createNewAccValidation = function() {
    var translation = $translate.instant(['guest_contribution_new_first_name_error', 'guest_contribution_new_last_name_error', 'guest_contribution_new_email_error', 'guest_contribution_new_password_error', 'guest_contribution_new_confirm_password_error', 'guest_contribution_new_match_password_error', 'login_page_password_length', 'guest_contribution_new_email_error2']);

    $('.create-new-account-info-form.ui.form').form({
      first_name: {
        identifier: 'first_name',
        rules: [{
          type: 'empty',
          prompt: translation.guest_contribution_new_first_name_error
        }]
      },
      last_name: {
        identifier: 'last_name',
        rules: [{
          type: 'empty',
          prompt: translation.guest_contribution_new_last_name_error
        }]
      },
      email: {
        identifier: 'email',
        rules: [{
          type: 'empty',
          prompt: translation.guest_contribution_new_email_error
        }, {
          type: 'email',
          prompt: translation.guest_contribution_new_email_error2
        }]
      },
      password: {
        identifier: 'password',
        rules: [{
          type: 'empty',
          prompt: translation.guest_contribution_new_password_error
        }, {
          type: 'length[6]',
          prompt: translation.login_page_password_length
        }]
      },
      confirm_password: {
        identifier: 'confirm_password',
        rules: [{
          type: 'empty',
          prompt: translation.guest_contribution_new_confirm_password_error
        }, {
          type: 'match[password]',
          prompt: translation.guest_contribution_new_match_password_error
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

  $scope.guestCheckoutValidation = function() {
    var translation = $translate.instant(['guest_contribution_email_error', 'guest_contribution_password_error']);

    $('.guest-info-form.ui.form').form({
      email: {
        identifier: 'email',
        rules: [{
          type: 'empty',
          prompt: translation.guest_contribution_email_error
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

  $scope.createNewCardValidation = function() {
    var translation = $translate.instant(['guest_contribution_new_card_number_error', 'guest_contribution_new_exp_month_error', 'guest_contribution_new_exp_year_error', 'guest_contribution_new_cvc_error']);

    $('.credit-card-form.ui.form').form({
      card_number: {
        identifier: 'card_number',
        rules: [{
          type: 'empty',
          prompt: translation.guest_contribution_new_card_number_error
        }]
      },
      card_exp_month: {
        identifier: 'card_exp_month',
        rules: [{
          type: 'empty',
          prompt: translation.guest_contribution_new_exp_month_error
        }]
      },
      card_exp_year: {
        identifier: 'card_exp_year',
        rules: [{
          type: 'empty',
          prompt: translation.guest_contribution_new_exp_year_error
        }]
      },
      card_cvc: {
        identifier: 'cvc',
        rules: [{
          type: 'empty',
          prompt: translation.guest_contribution_new_cvc_error
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

  $scope.newAddressFormValidation = function() {

    var translation = $translate.instant(['guest_contribution_shipping_country_error', 'guest_contribution_shipping_subcountry_error', 'guest_contribution_shipping_city_error', 'guest_contribution_shipping_mailcode_error', 'guest_contribution_shipping_streetaddress_error']);

    $('.new-shipping-address-form.ui.form').form({
      country: {
        identifier: 'country',
        rules: [{
          type: 'empty',
          prompt: translation.guest_contribution_shipping_country_error
        }]
      },
      mail_code: {
        identifier: 'mail_code',
        rules: [{
          type: 'empty',
          prompt: translation.guest_contribution_shipping_mailcode_error
        }]
      },
      street_address: {
        identifier: 'street_address',
        rules: [{
          type: 'empty',
          prompt: translation.guest_contribution_shipping_streetaddress_error
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

  $scope.contributeAmountValidation = function() {
    $.fn.form.settings.rules.under_minimum = function(value) {
      if ($scope.pledgeAmount < $scope.public_settings.site_theme_campaign_min_contribute_amount) {
        return false;
      } else {
        return true;
      }
    }

    $.fn.form.settings.rules.over_maximum = function(value) {
      if ($scope.pledgeAmount > $scope.max_amoumt && $scope.allow_max) {
        return false;
      } else {
        return true;
      }
    }
    var translation = $translate.instant(['pledge_campaign_contribution_empty', 'pledge_campaign_contribution_under_minimum', 'pledge_campaign_contribution_over_maximum']);
    if ($scope.allowDecimalNotation == 2 || $scope.allowDecimalNotation == 3) {
      $('.contribution-form.ui.form').form({
        contribution_amount: {
          identifier: 'contribution_amount',
          rules: [{
            type: 'empty',
            prompt: translation.pledge_campaign_contribution_empty
          }, {
            type: 'under_minimum',
            prompt: translation.pledge_campaign_contribution_under_minimum
          }, {
            type: 'over_maximum',
            prompt: translation.pledge_campaign_contribution_over_maximum
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
    } else {
      $('.contribution-form.ui.form').form({
        contribution_amount: {
          identifier: 'contribution_amount_decimal',
          rules: [{
            type: 'empty',
            prompt: translation.pledge_campaign_contribution_empty
          }, {
            type: 'under_minimum',
            prompt: translation.pledge_campaign_contribution_under_minimum
          }, {
            type: 'over_maximum',
            prompt: translation.pledge_campaign_contribution_over_maximum
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
  }

  $scope.tipValidation = function() {
    if (!$scope.selectedTipType) {
      $scope.tipTypeError = true;
      $scope.valcheck = $scope.valcheck && false;
      return;
    }
    $.fn.form.settings.rules.tip_zero = function(value) {
      if ($scope.tip.dollar_amount == 0) {
        return false;
      } else {
        return true;
      }
    }

    $.fn.form.settings.rules.tip_number = function(value) {
      if ($scope.tip.dollar_amount) {
        if ($scope.tip.dollar_amount.match(/^[0-9]\d*(((,\d{3}){1})?(\.\d{0,2})?)$/)) {
          return true;
        } else {
          return false;
        }
      }
    }

    $.fn.form.settings.rules.tip_under_minimum = function(value) {
      if (!$scope.tippingOptions.dynamic_min) {
        return true;
      }
      if ($scope.tip.dollar_amount < $scope.tippingOptions.dynamic_min) {
        return false;
      } else {
        return true;
      }
    }

    $.fn.form.settings.rules.tip_over_maximum = function(value) {
      if (!$scope.tippingOptions.dynamic_max) {
        return true;
      }
      if ($scope.tip.dollar_amount > $scope.tippingOptions.dynamic_max) {
        return false;
      } else {
        return true;
      }
    }
    if ($scope.selectedTipType == "dynamic") {
      var translation = $translate.instant(['pledge_campaign_tip_empty', 'pledge_campaign_tip_invalid', 'pledge_campaign_tip_under_minimum', 'pledge_campaign_tip_over_maximum']);
      if ($scope.tippingOptions.toggle_dynamic_min_max) {
        $('.dynamic-tipping-form.ui.form').form({
          dynamic_tip: {
            identifier: 'dynamic_tip',
            rules: [{
              type: 'empty',
              prompt: translation.pledge_campaign_tip_empty
            }, {
              type: 'tip_zero',
              prompt: translation.pledge_campaign_tip_empty
            }, {
              type: 'tip_number',
              prompt: translation.pledge_campaign_tip_invalid
            }, {
              type: 'tip_under_minimum',
              prompt: translation.pledge_campaign_tip_under_minimum
            }, {
              type: 'tip_over_maximum',
              prompt: translation.pledge_campaign_tip_over_maximum
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
      } else {
        $('.dynamic-tipping-form.ui.form').form({
          dynamic_tip: {
            identifier: 'dynamic_tip',
            rules: [{
              type: 'empty',
              prompt: translation.pledge_campaign_tip_empty
            }, {
              type: 'tip_zero',
              prompt: translation.pledge_campaign_tip_empty
            }, {
              type: 'tip_number',
              prompt: translation.pledge_campaign_tip_invalid
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
    }
  }

  function attributesValidation() {
    var translation = $translate.instant(['pledge_campaign_attribute_required_error']);

    // Choose card
    $('#reward-variation').find('input[name="variation_value"]').each(function() {
      if (!$(this).val()) {
        $scope.valcheck = $scope.valcheck && false;
        $(this).parent().parent('.field').addClass('error');
        $(this).parent().parent('.field').append('<div class="error-text ui red pointing prompt label">' + translation.pledge_campaign_attribute_required_error + '</div>');
      } else {
        $scope.valcheck = $scope.valcheck && true;
        $(this).parent().parent('.field').removeClass('error');
        $(this).parent().parent('.field').find('.error-text').remove();
      }
    });
    $('#reward-variation').find('input[name="variation_value"]').change(function() {
      $scope.valcheck = $scope.valcheck && true;
      $(this).parent().parent('.field').removeClass('error');
      $(this).parent().parent('.field').find('.error-text').remove();
    });
  }

  function phoneNumberValidation() {
    var translation = $translate.instant(['pledge_campaign_phone_required_error']);

    $('#phone-number-form').form({
      phone_value: {
        identifier: 'phone_value',
        rules: [{
          type: 'empty',
          prompt: translation.pledge_campaign_phone_required_error
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

  function newPhoneNumberValidation() {
    var translation = $translate.instant(['pledge_campaign_new_phone_value_required_error', 'pledge_campaign_new_phone_type_required_error']);

    $('#new-phone-number-form').form({
      new_phone_number: {
        identifier: 'new_phone_number',
        rules: [{
          type: 'empty',
          prompt: translation.pledge_campaign_new_phone_value_required_error
        }]
      },
      new_phone_type: {
        identifier: 'new_phone_type',
        rules: [{
          type: 'empty',
          prompt: translation.pledge_campaign_new_phone_type_required_error
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

  $scope.clearForm = function() {
    $('.personal-info-fields .ui.form:not(".contribution-form")').form('clear').removeClass('error');
    $scope.tos_not_checked = false;
  }

  $scope.submitWidgetPledge = function() {
    var invalid_elements = $('form, ng-form').find('.ng-invalid,.has-error');
    if (invalid_elements.length > 0) {
      return;
    }
    $scope.responseMsg = '';
    $scope.checkContribution();

    $scope.response = false;
    if ($scope.totalAmount <= 1) {
      $scope.responseMsg = 'Donation Amount must be a number and  atleast greater than 1 dollar';
    } else {

      $("div.loader").addClass("active");
      var promises = [];
      $('#finalpledge').addClass('disabled');

      if ($scope.guestOption == 2) {
        // anonymous pledge with account create
        if (!$scope.registering_user) {
          // create new account
          var data = {
            first_name: $scope.accountInfo.first_name,
            last_name: $scope.accountInfo.last_name,
            email: $scope.accountInfo.email,
            password: $scope.accountInfo.password,
            password_confirm: $scope.accountInfo.password_confirm,
            inline_registration: true, // do not send cofirmation email
          };
          // anonymous personal details
          Restangular.one('register').customPOST(data).then(function(success) {
            $scope.registering_user = success;
            $scope.creditCard['inline_token'] = $scope.registering_user.inline_token;
            var pledgeInfo = {
              entry_id: $scope.campaign_id,
              number: $scope.creditCard.number,
              cvc: $scope.creditCard.cvc,
              exp_month: $scope.creditCard.exp_month,
              exp_year: $scope.creditCard.exp_year,
              amount: $scope.totalAmount,
              first_name: $scope.accountInfo.first_name,
              last_name: $scope.accountInfo.last_name,
              email: $scope.accountInfo.email,
              personal_address_line1: $scope.person.address1,
              personal_address_zip: $scope.person.zip,
              personal_city_id: $scope.city_id,
              personal_phone_number: $scope.person.number,
              occupation: $scope.person.occupation || '',
              employer: $scope.person.employer || '',
              inline_token: $scope.registering_user.inline_token
            };

            if ($scope.tippingOptions.toggle) {
              if ($scope.tip.dollar_amount && $scope.tip.dollar_amount != 0) {
                pledgeInfo.amount_tip = parseFloat($scope.tip.dollar_amount).toFixed(2);
                if ($scope.tippingOptions.toggle_process_tips_immediately) {
                  pledgeInfo.force_tip_processing = true;
                }
              }
            }

            Restangular.one('account/widgetmakr').customPOST(pledgeInfo).then(function(success) {
              $scope.wcardID = success.cards[0].widgetmakr_account_card_id;
              $scope.ctype = success.cards[0].widgetmakr_account_card_type;
              var infoPledge = {
                widgetmakr_account_card_id: $scope.wcardID,
                amount: $scope.totalAmount,
                inline_token: $scope.registering_user.inline_token,
                anonymous_contribution: $scope.anonymous_contribution,
                anonymous_contribution_partial: $scope.partial_anonymous_contribution
              };
              Restangular.one('campaign', $scope.campaign_id).one('pledge').customPOST(infoPledge).then(function(success) {
                // $scope.responseMsg = "Pledge Successful";
                // $translate('Pledge_Success').then(function(value) {
                //   $scope.responseMsg = value;
                // });

                $('.pledge-thank-you')
                  .modal({
                    selector: {
                      close: '.actions .button',
                      deny: '.actions .negative, .actions .deny, .actions .cancel, .close'
                    },
                    closable: false
                  }).modal('show');
                //put campaign_backer in User
                var data = {
                  campaign_backer: 1,
                };
                UserService.updateUserData(data);

                if ($scope.public_settings.site_campaign_ecommerce_analytics && $scope.public_settings.site_campaign_ecommerce_analytics.toggle) {
                  sendGATransaction(success, $scope.public_settings.site_campaign_ecommerce_analytics.code);
                }

              }, function(failed) {
                $('#finalpledge').removeClass('disabled');
              });

            }, function(failed) {
              $('#finalpledge').removeClass('disabled');

              // Checks credit cards validity
              if (failed.data.message == "Provided credit card number appears to be invalid.") {

                $scope.responseMsg = 'Provided credit card number appears to be invalid';
              }
              if (failed.data.message === 'Invalid Card Expiration Date.') {
                $scope.responseMsg = 'Invalid Card Expiration Date';
              }
              if (failed.data.message === 'Donation Amount must be a number and at least 1 dollar') {
                $scope.responseMsg = 'Donation Amount must be a number and  atleast greater than 1 dollar';
              }
              if (failed.data.message === 'Ccv can only contain numbers.') {
                $scope.responseMsg = 'Ccv can only contain numbers';
              }
              if (failed.data.message === "Validation failed for one or more entities. See 'EntityValidationErrors' property for more details.") {
                $scope.responseMsg = 'Pledge failed';
              }

            });
          }, function(failed) {
            $('#finalpledge').removeClass('disabled');
            if (failed.data.errors.password_verification) {
              if (failed.data.errors.password_verification[0].code === 'register_invalid_password_mismatch') {
                $scope.responseMsg = 'Provided passwords do not match'
              }
            }
            if (failed.data.errors.email) {
              if (failed.data.errors.email[0].code === 'account_campaign_invalid_email') {
                $scope.responseMsg = "Email filed is not valid";
              }
              if (failed.data.errors.email[0].code === 'register_invalid_email_exists') {
                $scope.responseMsg = "Provided email address has already been registered";
              }
            }
          });
        }
      }
      // Guest personal details
      if ($scope.guestOption == 3) {
        var pledgeInfo = {
          entry_id: $scope.campaign_id,
          number: $scope.creditCard.number,
          cvc: $scope.creditCard.cvc,
          exp_month: $scope.creditCard.exp_month,
          exp_year: $scope.creditCard.exp_year,
          amount: $scope.totalAmount,
          first_name: $scope.accountInfo.first_name,
          last_name: $scope.accountInfo.last_name,
          email: $scope.accountInfo.email,
          personal_address_line1: $scope.person.address1,
          personal_address_zip: $scope.person.zip,
          personal_city_id: $scope.city_id,
          personal_phone_number: $scope.person.number,
          occupation: $scope.person.occupation || '',
          employer: $scope.person.employer || ''
        };
        if ($scope.tippingOptions.toggle) {
          if ($scope.tip.dollar_amount && $scope.tip.dollar_amount != 0) {
            pledgeInfo.amount_tip = parseFloat($scope.tip.dollar_amount).toFixed(2);
            if ($scope.tippingOptions.toggle_process_tips_immediately) {
              pledgeInfo.force_tip_processing = true;
            }
          }
        }

        $scope.infoPledge = {
          amount: '',
          card_id: '',
          email: '',
          fingerprint: '',
          use_widgetmakr: ''
        };

        Restangular.one('account/widgetmakr/guest').customPOST(pledgeInfo).then(function(success) {
          if (success.card_id) {
            $scope.wcardID = success.card_id;
            $scope.fingerprint = success.fingerprint;
            $scope.infoPledge = {
              amount: $scope.totalAmount,
              card_id: $scope.wcardID,
              email: $scope.accountInfo.email,
              fingerprint: $scope.fingerprint,
              use_widgetmakr: 1
            };
          }


          Restangular.one('campaign', $scope.campaign_id).one('pledge/guest').customPOST($scope.infoPledge).then(function(success) {
            // $scope.responseMsg = "Pledge Successful";
            $translate('Pledge_Success').then(function(value) {
              $scope.responseMsg = value;
            });

            $('.pledge-thank-you')
              .modal({
                selector: {
                  close: '.actions .button',
                  deny: '.actions .negative, .actions .deny, .actions .cancel, .close'
                }
              }).modal('show');
            //put campaign_backer in User
            var data = {
              campaign_backer: 1,
            };
            UserService.updateUserData(data);
          }, function(failed) {
            $('#finalpledge').removeClass('disabled');
            if (failed.data.errors.email) {
              if (failed.data.errors.email[0].code === 'account_campaign_invalid_email') {
                $scope.responseMsg = "Email filed is not valid";
              }
              if (failed.data.errors.email[0].code === 'register_invalid_email_exists') {
                $scope.responseMsg = "Provided email address has already been registered";
              }
            }
          });

        }, function(failed) {
          $('#finalpledge').removeClass('disabled');
          if (failed.data.message == "Provided credit card number appears to be invalid.") {
            $scope.responseMsg = 'Provided credit card number appears to be invalid';
          }
          if (failed.data.message === 'Invalid Card Expiration Date.') {
            $scope.responseMsg = 'Invalid Card Expiration Date';
          }
          if (failed.data.message === 'Donation Amount must be a number and at least 1 dollar') {
            $scope.responseMsg = 'Donation Amount must be a number and  atleast greater than 1 dollar';
          }
          if (failed.data.message === 'Ccv can only contain numbers.') {
            $scope.responseMsg = 'Ccv can only contain numbers';
          }
          if (failed.data.message === 'Provided credit card number is too large.') {
            $scope.responseMsg = 'Provided credit card number is too large';
          }
          if (failed.data.message === "Validation failed for one or more entities. See 'EntityValidationErrors' property for more details.") {
            $scope.responseMsg = 'Pledge failed';
          }
          if (failed.data.message === "Invalid Credit Card Number.") {
            $scope.responseMsg = 'Invalid Credit Card Number';
          }

        });
      }
      if ($scope.guestOption == 4) {
        var rdm_pw = $scope.randomPasswordGenerator();
        // anonymous pledge with account create
        if (!$scope.registering_user) {
          // create new account
          var data = {
            first_name: $scope.express.fname,
            last_name: $scope.express.lname,
            email: $scope.express.email,
            password: rdm_pw,
            password_confirm: rdm_pw,
            inline_registration: true, // do not send cofirmation email
          };
          // anonymous personal details
          Restangular.one('register').customPOST(data).then(function(success) {
            $scope.registering_user = success;
            $scope.creditCard['inline_token'] = $scope.registering_user.inline_token;

            var pledgeInfo = {
              entry_id: $scope.campaign_id,
              number: $scope.creditCard.number,
              cvc: $scope.creditCard.cvc,
              exp_month: $scope.creditCard.exp_month,
              exp_year: $scope.creditCard.exp_year,
              amount: $scope.totalAmount,
              first_name: $scope.express.fname,
              last_name: $scope.express.lname,
              email: $scope.express.email,
              personal_address_line1: $scope.person.address1,
              personal_address_zip: $scope.person.zip,
              personal_city_id: $scope.city_id,
              personal_phone_number: $scope.person.number,
              occupation: $scope.person.occupation || '',
              employer: $scope.person.employer || '',
              inline_token: $scope.registering_user.inline_token
            };

            if ($scope.tippingOptions.toggle) {
              if ($scope.tip.dollar_amount && $scope.tip.dollar_amount != 0) {
                pledgeInfo.amount_tip = parseFloat($scope.tip.dollar_amount).toFixed(2);
                if ($scope.tippingOptions.toggle_process_tips_immediately) {
                  pledgeInfo.force_tip_processing = true;
                }
              }
            }

            Restangular.one('account/widgetmakr').customPOST(pledgeInfo).then(function(success) {
              $scope.wcardID = success.cards[0].widgetmakr_account_card_id;
              $scope.ctype = success.cards[0].widgetmakr_account_card_type;
              var infoPledge = {
                widgetmakr_account_card_id: $scope.wcardID,
                amount: $scope.totalAmount,
                inline_token: $scope.registering_user.inline_token,
                anonymous_contribution: $scope.anonymous_contribution,
                anonymous_contribution_partial: $scope.partial_anonymous_contribution
              };
              Restangular.one('campaign', $scope.campaign_id).one('pledge').customPOST(infoPledge).then(function(success) {
                // $scope.responseMsg = "Pledge Successful";
                // $translate('Pledge_Success').then(function(value) {
                //   $scope.responseMsg = value;
                // });

                $('.pledge-thank-you')
                  .modal({
                    selector: {
                      close: '.actions .button',
                      deny: '.actions .negative, .actions .deny, .actions .cancel, .close'
                    },
                    closable: false
                  }).modal('show');
                //put campaign_backer in User
                var data = {
                  campaign_backer: 1,
                };
                UserService.updateUserData(data);

                if ($scope.public_settings.site_campaign_ecommerce_analytics && $scope.public_settings.site_campaign_ecommerce_analytics.toggle) {
                  sendGATransaction(success, $scope.public_settings.site_campaign_ecommerce_analytics.code);
                }

              }, function(failed) {
                $('#finalpledge').removeClass('disabled');
              });

            }, function(failed) {
              $('#finalpledge').removeClass('disabled');

              // Checks credit cards validity
              if (failed.data.message == "Provided credit card number appears to be invalid.") {

                $scope.responseMsg = 'Provided credit card number appears to be invalid';
              }
              if (failed.data.message === 'Invalid Card Expiration Date.') {
                $scope.responseMsg = 'Invalid Card Expiration Date';
              }
              if (failed.data.message === 'Donation Amount must be a number and at least 1 dollar') {
                $scope.responseMsg = 'Donation Amount must be a number and  atleast greater than 1 dollar';
              }
              if (failed.data.message === 'Ccv can only contain numbers.') {
                $scope.responseMsg = 'Ccv can only contain numbers';
              }
              if (failed.data.message === "Validation failed for one or more entities. See 'EntityValidationErrors' property for more details.") {
                $scope.responseMsg = 'Pledge failed';
              }

            });
          }, function(failed) {
            $('#finalpledge').removeClass('disabled');
            if (failed.data.errors.password_verification) {
              if (failed.data.errors.password_verification[0].code === 'register_invalid_password_mismatch') {
                $scope.responseMsg = 'Provided passwords do not match'
              }
            }
            if (failed.data.errors.email) {
              if (failed.data.errors.email[0].code === 'account_campaign_invalid_email') {
                $scope.responseMsg = "Email filed is not valid";
              }
              if (failed.data.errors.email[0].code === 'register_invalid_email_exists') {
                $scope.responseMsg = "Provided email address has already been registered";
              }
            }
          });
        }
      }
    }
  }

  $scope.phoneTypeSelected = function(type) {
    $scope.newNumberCreated.phonetype = type;
  }

  // Handling error requests
  function errorHandling(failed) {
    var msg = {
      'header': ""
    }
    if (failed.data) {
      if (failed.data.errors) {
        for (var prop in failed.data.errors) {
          msg.header = failed.data.errors[prop][0].code;
          break;
        }
      } else if (failed.data.type) {
        msg.header = failed.data.message;
      } else {
        msg.header = failed.data.code;
      }

      msg.header = $translate.instant(msg.header);
      if (failed.hasOwnProperty("config")) {
        if (failed.config.url.match(/\account\/stripe/) && failed.config.url.match(/\account\/stripe/).length || failed.config.url.match(/pledge/) && failed.config.url.match(/pledge/).length) {
          msg.header = $translate.instant("guest_account_registered_payment_failed").concat(" " + msg.header);
        }
      }
      $rootScope.floatingMessage = msg;
      $scope.hideFloatingMessage();
    }
  }


  //submit form
  $scope.submit = function() {


    // if toggle is set so anon is a checkbox
    if ($scope.anonymousContributionTypeOnly) {
      if ($scope.selecteContributionAnon == true) {
        $scope.selecteContribution = 2;
      } else {
        $scope.selecteContribution = 1;
      }
    }
    // variable to store all attribute values
    var pledgeAttributes = {};

    if ($scope.selectedReward) {
      if ($scope.selectedReward.attributes) {
        if (typeof $scope.selectedReward.attributes.variation != 'undefined') {
          var variation_choice = angular.copy($scope.selectedReward.attributes.variation);
          $('input[name="variation_value"]').each(function(key) {
            if ($(this).val() != "") {
              variation_choice[key].choice = variation_choice[key].choice[$(this).val()].value;
            } else {
              variation_choice[key].choice = null;
            }
          });
          pledgeAttributes['variation'] = variation_choice;
        }
      }
    }

    // if ($scope.contributionMessage) {
    //     pledgeAttributes['contribution_message'] = $scope.contributionMessage
    // }

    // if charity helper is enabled
    if ($scope.public_settings.site_campaign_charity_helper_enable) {
      if ($scope.charity.country) {
        $scope.charity.country_name = $scope.countries[$scope.charity.country - 1].name;
      }
      pledgeAttributes['charity'] = $scope.charity;
    }

    var translation = $translate.instant(['guest_contribution_selectcity_error']);
    if (!$('#select-city .select2-container').hasClass('select2-container-disabled')) {
      if (!$scope.selectedCity.selected) {
        $('#select .select-error').remove();
        $('#select-city').append('<div class="select-error ui red pointing prompt label transition visible">' + translation.guest_contribution_selectcity_error + '</div>');
        $('#select-city').addClass('error');
      }
    }

    $scope.valcheck = true;
    $scope.guestOption = parseInt($scope.guestOption);
    switch ($scope.guestOption) {
      case 2:
        $scope.createNewAccValidation();
        $scope.createNewCardValidation();
        $scope.newAddressFormValidation();
        break;
      case 3:
        $scope.guestCheckoutValidation();
        $scope.createNewCardValidation();
        $scope.stripeExtraDetailsValidation();
        break;
      case 4:
        $scope.createNewAccExpressValidation();
        $scope.createNewCardValidation();
        $scope.newAddressFormValidation();
        break;
    }

    if ($scope.tippingOptions.toggle) {
      $scope.tipValidation();
    }

    if ($scope.public_settings.site_campaign_reward_attributes_required) {
      attributesValidation();
    }

    if (typeof $scope.pledgeindex == "number" && $scope.public_settings.site_campaign_reward_phone_required && $scope.campaign.pledges[$scope.pledgeindex].shipping && $scope.guestOption != 1) {
      if ($scope.toggle.newNumber) {
        phoneNumberValidation();
      } else {
        newPhoneNumberValidation();
      }
    }
    $scope.contributeAmountValidation();
    if (!$scope.isContributionLayout1) {
      if ($scope.public_settings.site_tos_contribution_ui) {
        if (!$('.agreement input[type="checkbox"]').is(':checked')) {
          $scope.tos_not_checked = true;
          $rootScope.scrollToError();
          return;
        } else {
          $scope.tos_not_checked = false;
        }
      }
    }
    if ($scope.valcheck) {
      msg = {
        'loading': true,
        'loading_message': 'in_progress'
      }
      $rootScope.floatingMessage = msg;

      $scope.checkContribution();
      $('#pledgebutton').addClass('disabled');
      // $("div.loader").addClass("active");
      var promises = [];

      if ($scope.guestOption == 2) {
        // anonymous pledge with account create
        if (!$scope.registering_user) {
          // create new account
          var data = {
            first_name: $scope.accountInfo.first_name,
            last_name: $scope.accountInfo.last_name,
            email: $scope.accountInfo.email,
            password: $scope.accountInfo.password,
            password_confirm: $scope.accountInfo.password_confirm,
            inline_registration: true, // do not send cofirmation email
          };
          Restangular.one('register').customPOST(data).then(function(success) {
            $scope.registering_user = success;
            $scope.creditCard['inline_token'] = $scope.registering_user.inline_token;
            if ($scope.pledgeLevel) {
              // check if this is a pledge level
              if ($scope.campaign.pledges[$scope.pledgeindex].shipping) {
                // check if it has shipping
                $scope.address['inline_token'] = $scope.registering_user.inline_token;
                promises.push(Restangular.one('account/address').customPOST($scope.address));
              }
              if ($scope.newNumberCreated.number.length > 0 && $scope.newNumberCreated.phonetype) {
                $scope.phoneInfo.number = $scope.newNumberCreated.number;
                $scope.phoneInfo.phone_number_type_id = $scope.newNumberCreated.phonetype.id;
                $scope.phoneInfo.person_id = $scope.registering_user.id;
                $scope.phoneInfo['inline_token'] = $scope.registering_user.inline_token;
                var phoneRequest = Restangular.one('account/phone-number').customPOST($scope.phoneInfo);
                phoneRequest.then(function(success) {
                  $scope.chosenPhoneNumberId = success.id;
                });
                promises.push(phoneRequest);
              }
            }
            //If toggle on, create a credit card token
            if ($scope.site_stripe_tokenization_settings.toggle) {

              $scope.stripeExtraDetails.name = data.first_name + ' ' + data.last_name;
              if ($scope.pledgeLevel && $scope.campaign.pledges[$scope.pledgeindex].shipping) {
                $scope.stripeExtraDetails.address_line1 = $scope.address.street1;
              }

              $scope.stripe.createToken($scope.cardNumberElement, $scope.stripeExtraDetails).then(function(result) {
                if (result.error) {
                  $timeout(function() {
                    $rootScope.removeFloatingMessage();
                    // Inform the user if there was an error
                    var errorElement = angular.element(document.querySelector('#card-errors')).html(result.error.message);
                    msg = {
                      'header': 'pledge_campaign_stripe_elements_error'
                    }
                    $rootScope.floatingMessage = msg;
                    $('#pledgebutton').removeClass('disabled');
                  }, 500);
                } else {
                  // Append token to $scope.creditCard and make request
                  $scope.creditCard.card_token = result.token.id;
                  promises.push(StripeService.newPledgerAccount($scope.creditCard));
                  $scope.resolvePromiseChain(promises, pledgeAttributes);
                }
              });
            } else {
              //Create credit card without credit card token
              //Create new pledger account for the new user
              promises.push(StripeService.newPledgerAccount($scope.creditCard));
              $scope.resolvePromiseChain(promises, pledgeAttributes);
            }
          }, function(failed) {
            $('#pledgebutton').removeClass('disabled');
            errorHandling(failed);
          });

        } else {
          // if user tries the second time, check if he has existing stripe account
          // need to create the address again for the retries
          var data = {
            inline_token: $scope.registering_user.inline_token,
          };

          Restangular.one('account/stripe').customGET(null, data).then(function(success) {
            var stripe_account_id = null;
            if (success.length) {
              stripe_account_id = success[0].id;
            }
            $scope.creditCard['inline_token'] = $scope.registering_user.inline_token;
            //If toggle on, create a credit card token
            if ($scope.site_stripe_tokenization_settings.toggle) {

              // $scope.stripeExtraDetails.name = data.first_name + ' ' + data.last_name;
              // if ($scope.pledgeLevel && $scope.campaign.pledges[$scope.pledgeindex].shipping) {
              //   $scope.stripeExtraDetails.address_line1 = $scope.address.street1;
              // }

              $scope.stripe.createToken($scope.cardNumberElement, $scope.stripeExtraDetails).then(function(result) {
                if (result.error) {
                  $timeout(function() {
                    $rootScope.removeFloatingMessage();
                    // Inform the user if there was an error
                    var errorElement = angular.element(document.querySelector('#card-errors')).html(result.error.message);
                    msg = {
                      'header': 'pledge_campaign_stripe_elements_error'
                    }
                    $rootScope.floatingMessage = msg;
                    $('#pledgebutton').removeClass('disabled');
                  }, 500);
                } else {
                  // Append token to $scope.creditCard and make request
                  $scope.creditCard.card_token = result.token.id;
                  $scope.createTokenForRetryPledge(stripe_account_id, pledgeAttributes, $scope.creditCard);
                }
              });
            } else {
              //Create credit card without credit card token
              //Create new pledger account for the new user
              $scope.createTokenForRetryPledge(stripe_account_id, pledgeAttributes, $scope.creditCard);
            }
          }, function(failed) {
            $('#pledgebutton').removeClass('disabled');
            errorHandling(failed);
          });
        }
      } else if ($scope.guestOption == 4) { //Express Checkout
        var rdm_pw = $scope.randomPasswordGenerator();
        // anonymous pledge with account create
        if (!$scope.registering_user) {
          //Generate a random password 
          // create new account
          var data = {
            first_name: $scope.express.fname,
            last_name: $scope.express.lname,
            email: $scope.express.email,
            password: rdm_pw,
            password_confirm: rdm_pw,
            inline_registration: true, // do not send cofirmation email
          };
          Restangular.one('register').customPOST(data).then(function(success) {
            $scope.registering_user = success;
            $scope.creditCard['inline_token'] = $scope.registering_user.inline_token;
            if ($scope.pledgeLevel) {
              // check if this is a pledge level
              if ($scope.campaign.pledges[$scope.pledgeindex].shipping) {
                // check if it has shipping
                $scope.address['inline_token'] = $scope.registering_user.inline_token;
                promises.push(Restangular.one('account/address').customPOST($scope.address));
              }
              if ($scope.newNumberCreated.number.length > 0 && $scope.newNumberCreated.phonetype) {
                $scope.phoneInfo.number = $scope.newNumberCreated.number;
                $scope.phoneInfo.phone_number_type_id = $scope.newNumberCreated.phonetype.id;
                $scope.phoneInfo.person_id = $scope.registering_user.id;
                $scope.phoneInfo['inline_token'] = $scope.registering_user.inline_token;
                var phoneRequest = Restangular.one('account/phone-number').customPOST($scope.phoneInfo);
                phoneRequest.then(function(success) {
                  $scope.chosenPhoneNumberId = success.id;
                });
                promises.push(phoneRequest);
              }
            }
            //If toggle on, create a credit card token
            if ($scope.site_stripe_tokenization_settings.toggle) {

              $scope.stripeExtraDetails.name = data.first_name + ' ' + data.last_name;
              if ($scope.pledgeLevel && $scope.campaign.pledges[$scope.pledgeindex].shipping) {
                $scope.stripeExtraDetails.address_line1 = $scope.address.street1;
              }

              $scope.stripe.createToken($scope.cardNumberElement, $scope.stripeExtraDetails).then(function(result) {
                if (result.error) {
                  $timeout(function() {
                    $rootScope.removeFloatingMessage();
                    // Inform the user if there was an error
                    var errorElement = angular.element(document.querySelector('#card-errors')).html(result.error.message);
                    msg = {
                      'header': 'pledge_campaign_stripe_elements_error'
                    }
                    $rootScope.floatingMessage = msg;
                    $('#pledgebutton').removeClass('disabled');
                  }, 500);
                } else {
                  // Append token to $scope.creditCard and make request
                  $scope.creditCard.card_token = result.token.id;
                  promises.push(StripeService.newPledgerAccount($scope.creditCard));
                  $scope.resolvePromiseChain(promises, pledgeAttributes);
                }
              });
            } else {
              //Create credit card without credit card token
              //Create new pledger account for the new user
              promises.push(StripeService.newPledgerAccount($scope.creditCard));
              $scope.resolvePromiseChain(promises, pledgeAttributes);
            }
          }, function(failed) {
            $('#pledgebutton').removeClass('disabled');
            errorHandling(failed);
          });

        } else {
          // if user tries the second time, check if he has existing stripe account
          // need to create the address again for the retries
          var data = {
            inline_token: $scope.registering_user.inline_token,
            first_name: $scope.express.fname,
            last_name: $scope.express.lname
          };

          Restangular.one('account/stripe').customGET(null, data).then(function(success) {
            var stripe_account_id = null;
            if (success.length) {
              stripe_account_id = success[0].id;
            }
            $scope.creditCard['inline_token'] = $scope.registering_user.inline_token;
            //If toggle on, create a credit card token
            if ($scope.site_stripe_tokenization_settings.toggle) {

              $scope.stripeExtraDetails.name = data.first_name + ' ' + data.last_name;
              if ($scope.pledgeLevel && $scope.campaign.pledges[$scope.pledgeindex].shipping) {
                $scope.stripeExtraDetails.address_line1 = $scope.address.street1;
              }

              $scope.stripe.createToken($scope.cardNumberElement, $scope.stripeExtraDetails).then(function(result) {
                if (result.error) {
                  $timeout(function() {
                    $rootScope.removeFloatingMessage();
                    // Inform the user if there was an error
                    var errorElement = angular.element(document.querySelector('#card-errors')).html(result.error.message);
                    msg = {
                      'header': 'pledge_campaign_stripe_elements_error'
                    }
                    $rootScope.floatingMessage = msg;
                    $('#pledgebutton').removeClass('disabled');
                  }, 500);
                } else {
                  // Append token to $scope.creditCard and make request
                  $scope.creditCard.card_token = result.token.id;
                  $scope.createTokenForRetryPledge(stripe_account_id, pledgeAttributes, $scope.creditCard);
                }
              });
            } else {
              //Create credit card without credit card token
              //Create new pledger account for the new user
              $scope.createTokenForRetryPledge(stripe_account_id, pledgeAttributes, $scope.creditCard);
            }
          }, function(failed) {
            $('#pledgebutton').removeClass('disabled');
            errorHandling(failed);
          });
        }
      } else {
        //GUEST CHECKOUT 

        //if there is shipping
        if ($scope.pledgeLevel) {
          if ($scope.campaign.pledges[$scope.pledgeindex].shipping) {
            promises.push(Restangular.one('account/address/guest').customPOST($scope.address));
          }
        }

        //If toggle on, create a credit card token
        if ($scope.site_stripe_tokenization_settings.toggle) {

          if ($scope.stripeExtraDetails.name.length == 0) {
            $scope.stripeExtraDetails.name = 'guest';
          }

          $scope.stripe.createToken($scope.cardNumberElement, $scope.stripeExtraDetails).then(function(result) {
            if (result.error) {
              $timeout(function() {
                $rootScope.removeFloatingMessage();
                // Inform the user if there was an error
                var errorElement = angular.element(document.querySelector('#card-errors')).html(result.error.message);
                msg = {
                  'header': 'pledge_campaign_stripe_elements_error'
                }
                $rootScope.floatingMessage = msg;
                $('#pledgebutton').removeClass('disabled');
              }, 500);
            } else {
              // Append token to $scope.creditCard and make request
              $scope.creditCard.card_token = result.token.id;
              promises.push(StripeService.newGuestPledgerAccount($scope.creditCard));
              $scope.resolveGuestPromiseChain(promises, pledgeAttributes);
            }
          });
        } else {
          //Create credit card without credit card token
          //Create new pledger account for the new user
          promises.push(StripeService.newGuestPledgerAccount($scope.creditCard));
          $scope.resolveGuestPromiseChain(promises, pledgeAttributes);
        }

      }
    } else {
      $rootScope.scrollToError();
    }
  };

  $scope.createTokenForRetryPledge = function(stripe_account_id, pledgeAttributes, creditCard) {
    StripeService.createCard(stripe_account_id, creditCard).then(function(success) {
      // new card index
      // var card_index = success.cards.length - 1;
      // setup the object for POST request
      var pledgeInfo = {
        stripe_account_card_id: success.id,
        pledge_level_id: $scope.pledgeLevel,
        amount: $scope.totalAmount,
        shipping_address_id: $scope.selectedAddressID || '',
        attributes: JSON.stringify(pledgeAttributes)
      };

      if ($scope.tippingOptions.toggle) {
        if ($scope.tip.dollar_amount && $scope.tip.dollar_amount != 0) {
          pledgeInfo.amount_tip = parseFloat($scope.tip.dollar_amount).toFixed(2);
          if ($scope.tippingOptions.toggle_process_tips_immediately) {
            pledgeInfo.force_tip_processing = true;
          }
        }
      }

      if ($scope.contributionMessage) {
        pledgeInfo.note = $scope.contributionMessage;
      }
      // submit pledge
      Restangular.one('campaign', $scope.campaign_id).one('pledge').customPOST(pledgeInfo).then(function(success) {
        // thank you message
        $translate('Pledge_Success').then(function(value) {
          msg = {
            'header': value
          }
          $rootScope.floatingMessage = msg;
          $scope.hideFloatingMessage();
        });

        $('.pledge-thank-you')
          .modal({
            selector: {
              close: '.actions .button',
              deny: '.actions .negative, .actions .deny, .actions .cancel, .close'
            },
            closable: false
          }).modal('show');
        // log user in
        var data = {
          email: $scope.accountInfo.email,
          password: $scope.accountInfo.password,
        };
        Restangular.one('authenticate').customPOST(data).then(function(success) {
          UserService.setLoggedIn(success);
        });

        if ($scope.public_settings.site_campaign_ecommerce_analytics && $scope.public_settings.site_campaign_ecommerce_analytics.toggle) {
          sendGATransaction(success, $scope.public_settings.site_campaign_ecommerce_analytics.code);
        }

      }, function(failed) {
        $('#pledgebutton').removeClass('disabled');
        errorHandling(failed);
      });

    }, function(failed) {
      $('#pledgebutton').removeClass('disabled');
      errorHandling(failed);
    });
  }

  $scope.resolveGuestPromiseChain = function(promises, pledgeAttributes) {
    // wait until all the above requests return promises and got resolved
    $q.all(promises).then(function(resolved) {
      if ($scope.site_stripe_tokenization_settings.toggle) {
        $scope.cardNumberElement.clear();
        $scope.cardExpiryElement.clear();
        $scope.cardCvcElement.clear();
      }
      // loop through the results and find value
      angular.forEach(resolved, function(value) {
        if (value.card_id) {
          $scope.guest_card_id = value.card_id;
          $scope.guest_fingerprint = value.fingerprint;
        }
        if (value.address_id) {
          $scope.selectedAddressID = value.address_id;
        }
      });

      // setup the object for POST request
      var pledgeInfo = {
        pledge_level_id: $scope.pledgeLevel,
        amount: $scope.totalAmount,
        shipping_address_id: $scope.selectedAddressID || '',
        card_id: $scope.guest_card_id,
        fingerprint: $scope.guest_fingerprint,
        email: $scope.creditCard.email,
        last_name: $scope.creditCard.last_name,
        first_name: $scope.creditCard.first_name,
        attributes: JSON.stringify(pledgeAttributes)
      };

      if ($scope.contributionMessage) {
        pledgeInfo.note = $scope.contributionMessage;
      }

      if ($scope.tippingOptions.toggle) {
        if ($scope.tip.dollar_amount && $scope.tip.dollar_amount != 0) {
          pledgeInfo.amount_tip = parseFloat($scope.tip.dollar_amount).toFixed(2);
          if ($scope.tippingOptions.toggle_process_tips_immediately) {
            pledgeInfo.force_tip_processing = true;
          }
        }
      }

      // submit pledge
      Restangular.one('campaign', $scope.campaign_id).one('pledge/guest').customPOST(pledgeInfo).then(function(success) {
        $translate('Pledge_Success').then(function(value) {
          msg = {
            'header': value
          }
          $rootScope.floatingMessage = msg;
          $scope.hideFloatingMessage();
        });

        $('.pledge-thank-you')
          .modal({
            selector: {
              close: '.actions .button',
              deny: '.actions .negative, .actions .deny, .actions .cancel, .close'
            },
            closable: false
          }).modal('show');
      }, function(failed) {
        $('#pledgebutton').removeClass('disabled');

        msg = {
          'header': 'Card_is_invalid'
        }
        $rootScope.floatingMessage = msg;

      });

    }, function(failed) {
      $('#pledgebutton').removeClass('disabled');
      errorHandling(failed);
    });
  }
  $scope.resolvePromiseChain = function(promises, pledgeAttributes) {
    $q.all(promises).then(function(resolved) {
      if ($scope.site_stripe_tokenization_settings.toggle) {
        $scope.cardNumberElement.clear();
        $scope.cardExpiryElement.clear();
        $scope.cardCvcElement.clear();
      }
      var stripe_card_id = null;
      angular.forEach(resolved, function(value) {
        if (value.stripe_account_id) {
          // get the first card, because this must be the first card that the account has
          stripe_card_id = value.cards[0].id;
        }

        if (value.address_id) {
          $scope.selectedAddressID = value.address_id;
        }
      });
      var data = {
        stripe_account_card_id: stripe_card_id,
        pledge_level_id: $scope.pledgeLevel,
        amount: $scope.totalAmount,
        shipping_address_id: $scope.selectedAddressID || '',
        phone_number_id: $scope.chosenPhoneNumberId,
        inline_token: $scope.registering_user.inline_token,
        anonymous_contribution: $scope.anonymous_contribution,
        anonymous_contribution_partial: $scope.partial_anonymous_contribution,
        attributes: JSON.stringify(pledgeAttributes)
      };

      if ($scope.contributionMessage) {
        data.note = $scope.contributionMessage;
      }

      if ($scope.tippingOptions.toggle) {
        if ($scope.tip.dollar_amount && $scope.tip.dollar_amount != 0) {
          data.amount_tip = parseFloat($scope.tip.dollar_amount).toFixed(2);
          if ($scope.tippingOptions.toggle_process_tips_immediately) {
            data.force_tip_processing = true;
          }
        }
      }

      Restangular.one('campaign', $scope.campaign_id).one('pledge').customPOST(data).then(function(success) {
        // thank you message
        $translate(['guest_contribution_thankyou_message']).then(function(value) {
          msg = {
            'header': value.guest_contribution_thankyou_message
          }
          $rootScope.floatingMessage = msg;
          $scope.hideFloatingMessage();
        });
        $('.pledge-thank-you')
          .modal({
            selector: {
              close: '.actions .button',
              deny: '.actions .negative, .actions .deny, .actions .cancel, .close'
            },
            closable: false
          }).modal('show');
        // log user in
        if ($scope.public_settings.site_campaign_ecommerce_analytics && $scope.public_settings.site_campaign_ecommerce_analytics.toggle) {
          sendGATransaction(success, $scope.public_settings.site_campaign_ecommerce_analytics.code);
        }
      }, function(failed) {
        // when failed to create campaign pledge record
        $('#pledgebutton').removeClass('disabled');
        errorHandling(failed);
        $timeout(function() {
          var accountEmail = $scope.accountInfo.email;
          var accountPassword = $scope.accountInfo.password;
          $("#optionlogin").checkbox("toggle");
          $scope.accountInfo.email = accountEmail;
          $scope.accountInfo.password = accountPassword;
        });
      });
    }, function(failed) {
      // when stripe failed to create new pledger account
      $('#pledgebutton').removeClass('disabled');
      errorHandling(failed);
      $timeout(function() {
        var accountEmail = $scope.accountInfo.email;
        var accountPassword = $scope.accountInfo.password;
        $("#optionlogin").checkbox("toggle");
        $scope.accountInfo.email = accountEmail;
        $scope.accountInfo.password = accountPassword;
      });
    });
  }
  $scope.stripeExtraDetailsValidation = function() {
    var translation = $translate.instant(['guest_contribution_name_on_card_required']);
    $('.stripe-credit-card-form.ui.form').form({
      name_card: {
        identifier: 'namecard',
        rules: [{
          type: 'empty',
          prompt: translation.guest_contribution_name_on_card_required
        }]
      }
    }, {
      inline: true,
      onSuccess: function() {
        $scope.valcheck = true;
      },
      onFailure: function() {
        $scope.valcheck = false;
      }
    }).form('validate form');
  }
  $scope.generalLoginValidation = function() {
    var translation = $translate.instant(['guest_contribution_email_error', 'guest_contribution_password_error']);

    $('.general-login-info-form.ui.form').form({
      email: {
        identifier: 'email',
        rules: [{
          type: 'empty',
          prompt: translation.guest_contribution_email_error
        }]
      },
      password: {
        identifier: 'password',
        rules: [{
          type: 'empty',
          prompt: translation.guest_contribution_password_error
        }]
      }
    }, {
      inline: true,
      onSuccess: function() {
        $scope.valcheck = true;
      },
      onFailure: function() {
        $scope.valcheck = false;
      }
    }).form('validate form');
  }

  $scope.loginUser = function() {
    $scope.generalLoginValidation();

    if ($scope.accountInfo) {
      var data = {
        password: $scope.accountInfo.password,
        email: $scope.accountInfo.email,
      };

      if (!$scope.valcheck) {
        return;
      } else {
        Restangular.one('authenticate').customPOST(data).then(function(success) {
          // authenticate first
          var login_user = success;
          UserService.setLoggedIn(login_user);

          // grab existing values
          if ($scope.isEnableContributionMessage) {
            $rootScope.contributionMessage = $scope.contributionMessage;
          }
          if ($scope.charity) {
            $rootScope.charity = $scope.charity;
          }
          // redirect
          $location.path('/pledge-campaign').search('m', $scope.pledgeAmount);

        }, function(failed) {
          msg = {
            'header': "Invalid_credentials"
          }
          $rootScope.floatingMessage = msg;
        });
      }
    }
  }
  $scope.gotolink = function(path) {
    if ($scope.guestOption == 2) {
      var data = {
        email: $scope.accountInfo.email,
        password: $scope.accountInfo.password,
      };
      Restangular.one('authenticate').customPOST(data).then(function(success) {
        var login_user = success;
        UserService.setLoggedIn(login_user);
        // redirect

        $location.path(path);

      }, function(failed) {
        msg = {
          'header': failed.data.errors
        }
        $rootScope.floatingMessage = msg;
      });
    } else if ($scope.guestOption == 3) { //Guest Checkout Redirect
      $location.path(path);
    } else if ($scope.guestOption == 4) { //Express Checkout Redirect
      $location.path(path);
    }
  }

  $scope.openModalById = function(id) {
    $('.ui.modal#' + id).modal('show');
  };

  // Prepare data caching for location filter
  $scope.cities = [];

  // search city input
  $scope.searchCities = function(term) {
    var cityID = null; // variable to hold city ID
    var countryID = null;
    var native_lookup = $scope.native_lookup == true ? 1 : 0;
    if (term) {
      // Check setting here to choose which one to use, check the layout
      // This one is to search cities directly
      if (!$scope.alt_shipping) {
        Geolocator.searchCities(term, native_lookup).then(function(cities) {
          $scope.cities = cities;
        });
      }
      // This one is to search with subcountry id to limit the area
      else {
        Geolocator.searchCitiesBySubcountry(term, $scope.selectedSubcountry.selected.id, native_lookup).then(function(cities) {
          if (!cities || cities instanceof Array && cities.length === 0) {
            Geolocator.searchCitiesBySubcountry(term, $scope.selectedSubcountry.selected.id, 0).then(function(cities) {
              $scope.cities = cities;
            });
          } else if ($scope.native_lookup) {
            for (var i in cities) {
              if (cities[i].city_native_name != null) {
                cities[i].name = cities[i].city_native_name;
              }
              if (cities[i].country_native_name != null) {
                cities[i].country = cities[i].country_native_name;
              }
              if (cities[i].subcountry_native_name != null) {
                cities[i].subcountry = cities[i].subcountry_native_name;
              }
            }
            $scope.cities = cities;
          }
        });
      }
    }
  }

  // Users chose shipping types
  function chooseShipping(address) {
    $scope.shipping_error = false;
    $scope.shipOptions = [];
    if ($scope.selectedReward.shipping) {
      var len = $scope.selectedReward.shipping.length;
      var count = 0;
      var found = false;
      angular.forEach($scope.selectedReward.shipping, function(val) {
        if (!found) {

          if (val.country_id == address.country_id && val.subcountry_id == address.subcountry_id && val.shipping_option_type_id == 3) {
            $scope.shipOptions = [{
              shipping_option_type: val.shipping_option_type,
              country: val.country,
              sub_country: val.name,
              cost: val.cost
            }];
            count = count - len;
            found = true;
          } else {
            count++;
          }
          if (count == len) {
            var dummy = 0;
            angular.forEach($scope.selectedReward.shipping, function(v) {
              if (v.country_id == address.country_id && v.shipping_option_type_id == 2) {
                $scope.shipOptions = [{
                  shipping_option_type: v.shipping_option_type,
                  country: v.country,
                  sub_country: '',
                  cost: v.cost
                }];
                dummy = dummy - len;
                found = true;
              } else {
                dummy++;
              }
              if (dummy == len) {
                angular.forEach($scope.selectedReward.shipping, function(value) {
                  if (value.shipping_option_type_id == 1) {
                    $scope.shipOptions = [{
                      shipping_option_type: value.shipping_option_type,
                      country: '',
                      sub_country: '',
                      cost: value.cost
                    }];
                    found = true;
                  }
                });
                if ($scope.shipOptions.length < 1) {
                  $scope.shipping_error = true;
                }

              }

            });
          }
        }
      });
    }
  }

  $scope.randomPasswordGenerator = function() {
    var length = 8,
      charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
      retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
  }

  $scope.shippingOptionString = function(shipOpID) {
    // Check using ID instead of String
    // == 1 is Worldwide Shipping
    if (shipOpID == 1) {
      $translate('Worldwide Shipping').then(function(value) {
        $scope.shipping_option = value;
      });
    }
    // == 2 is Country Specific Shipping
    else if (shipOpID == 2) {
      $translate('Country Specific Shipping').then(function(value) {
        $scope.shipping_option = value;
      });
    }
    // == 3 is Subcountry Specific Shipping
    else {
      $translate('SubCountry Specific Shipping').then(function(value) {
        $scope.shipping_option = value;
      });
    }
  }

  $scope.setCountry = function(country) {
    $scope.selectedCountry.selected = country;
  }

  function getSubcountries(countryID) {
    Geolocator.getSubcountriesByCountry(countryID).then(function(subcountries) {
      // Check which language to show
      if ($scope.native_lookup) {
        for (var i in subcountries) {
          if (subcountries[i].native_name != null) {
            subcountries[i].name = subcountries[i].native_name;
          }
        }
      }
      $scope.subcountries = subcountries;
    });
  }

  // Shipped to selected city
  $scope.citySelect = function(city) {
      chooseShipping(city);
    }
    // watching variable changes
  $scope.$watch('selectedCity.selected', function(value, oldValue) {
    if (value != oldValue && value) {
      cityID = Geolocator.lookupCityID(value.name);

      var address_breakdown = value.name.split(',');
      $scope.stripeExtraDetails.address_city = address_breakdown[0];
      $scope.stripeExtraDetails.address_country = address_breakdown[2];

      if (cityID) {
        $scope.address.city_id = cityID;
      }
      countryID = Geolocator.lookupCountryID(value.name);
      if (countryID) {
        $scope.address.country_id = countryID;
      }
      $scope.citySelect(value);
      $('#select-city .select-error').remove();
      $('#select-city').removeClass('error');
    }
  });

  $scope.$watch("selectedCountry.selected", function(value, oldValue) {
    if (value != oldValue && value) {
      if ($scope.selectedReward) {
        chooseShipping(value);
      }
      $scope.selectedCity.selected = undefined;
      $scope.selectedSubcountry.selected = undefined;
      getSubcountries(value.id);
    }
  });

  $scope.$watch("selectedSubcountry.selected", function(value, oldValue) {
    if (value != oldValue) {
      chooseShipping(value);
    }
  });

  $scope.$watch('address.country_id', function(countryID) {
    var worldWide = null;
    var country = null;
    if (countryID) {
      // find out the index
      angular.forEach($scope.shippingOption, function(item, key) {
        if (item.country_id == countryID) {
          country = key;
          // return; // break loop when match country found
        }

        if (item.shipping_option_type_id == 1) {
          worldWide = key;
        }
      });

      // determine country or worldwide
      if (country != null) {
        $scope.costIndex = country;
      } else if (worldWide != null) {
        $scope.costIndex = worldWide;
      }
    }
  });

  $scope.goBackToCampaign = function() {
    window.location.href = $rootScope.currentURL;
  }

  $scope.total = function(shipping) {
    if (shipping) {
      $scope.totalAmount = parseFloat($scope.pledgeAmount) + parseFloat(shipping);
    } else {
      $scope.totalAmount = $scope.pledgeAmount;
    }

    var total = parseFloat($scope.totalAmount);
    // if($scope.tip.value) {
    //   if($scope.tip.type == 'Dollar') {
    //     total += parseFloat($scope.tip.value);
    //   } else {
    //     total += (parseFloat($scope.tip.value) / 100) * $scope.pledgeAmount;
    //   }
    // }
    return total;
  }

  function getCountries() {
    return Geolocator.getCountries().then(function(countries) {
      if ($scope.native_lookup) {
        for (var i in countries) {
          if (countries[i].native_name != null) {
            countries[i].name = countries[i].native_name
          }
        }
      }
      $scope.countries = countries;
      // Check if there is default country, if so, we put it at first index and remove the one originally in the array
      if ($scope.default_country) {
        for (var index in $scope.countries) {
          var value = $scope.countries[index];
          if (value.id == $scope.default_country.id) {
            // This line is to change output language of default_country according to native_lookup setting
            $scope.default_country = value;
            $scope.countries.splice(index, 1);
            break;
          }
        }
        $scope.countries.splice(0, 0, $scope.default_country);
      }
      return $scope.countries;
    });
  }

  var m_names = new Array("January", "February", "March",
    "April", "May", "June", "July", "August", "September",
    "October", "November", "December");
  var currdate = new Date();

  $scope.currdate = (m_names[currdate.getMonth()]) + " " + currdate.getDate() + " " + currdate.getFullYear() + " " + currdate.getHours() + ":" + currdate.getMinutes();

  $scope.$watch('campaignFundingGoal.value', function(newValue, oldValue) {
    if (newValue != oldValue && newValue) {
      if ($scope.campaign && typeof newValue === "string") {
        $scope.pledgeAmount = $rootScope.formatFundingGoal(newValue);
        if ($scope.selectedTipType == 'tiers') {
          $scope.updateTierValues();
        }
        if ($scope.tip.value && $scope.tip.value != 0 && $scope.tip.type == 'Percent') {
          var tipAmount;
          if ((($scope.tippingOptions.tiers[0].value / 100) * $scope.pledgeAmount) < $scope.lowestAmount) {
            if ($scope.tip.value == $scope.tippingOptions.tiers[0].value) {
              tipAmount = $scope.lowestAmount;
            } else {
              tipAmount = ((parseFloat($scope.tip.value) / 100) * $scope.pledgeAmount) + $scope.lowestAmount;
            }
          } else {
            tipAmount = ((parseFloat($scope.tip.value) / 100) * $scope.pledgeAmount)
          }
          $scope.tip.dollar_amount = tipAmount;
          if ($scope.tippingOptions.toggle_tier_names) {
            var percentString = $scope.tip.name + ' - ';
          } else {
            var percentString = ''
          }
          percentString = percentString + $filter('formatCurrency')(tipAmount, $scope.tipInfo.code_iso4217_alpha, $scope.public_setting.site_campaign_decimal_option);
          $('.tip-tiers').dropdown('set text', percentString)
        }
      }
    }
  });

  // Forgot Password
  $scope.forgotPassword = function() {
    $('.forgot-password-modal').modal({
      onApprove: function() {
        // if the email is not valid, do not close modal
        if (!$('.ui.email.form').form('validate form')) {
          return false;
        }
      },
    }).modal('show');
  };

  // sent reset password email
  $scope.resetPassword = function() {
    // process when email is valid
    if (!$('.ui.email.form').form('validate form')) {
      return;
    }

    var data = {
      'email': $scope.email,
    }
    Restangular.one('authenticate').one('forgot').customPOST(data).then(function(success) {
      if (success.success) {
        msg = {
          'header': "email_sent"
        }
        $rootScope.floatingMessage = msg;
      } else {
        msg = {
          'header': "wrong_email_sent"
        }
      }
      $rootScope.floatingMessage = msg;
      $scope.hideFloatingMessage();
    });
  };

  $scope.tipTypeSelection = function(type) {
    $scope.tipTypeError = false;
    $scope.tip = { value: null, dollar_amount: 0, type: 'Dollar' };
    if (type == 'tiers') {
      if ($scope.tippingOptions.tiers[0]) {
        $scope.updateTierValues();
        $scope.tip = { value: $scope.tippingOptions.tiers[0].value, dollar_amount: $scope.tippingOptions.tiers[0].dollar_amount, type: $scope.tippingOptions.tiers[0].type, name: $scope.tippingOptions.tiers[0].name };
      }
    } else if (type == 'dynamic') {
      if ($scope.tippingOptions.toggle_dynamic_min_max && $scope.tippingOptions.dynamic_min) {
        $scope.tip.value = $scope.tippingOptions.dynamic_min;
        $scope.tip.dollar_amount = $scope.tippingOptions.dynamic_min;
      }
    }

    $scope.selectedTipType = type;
  };

  $scope.tipTierSelection = function(value, type, dollarAmount, name) {
    $scope.tip = { value: parseFloat(value), dollar_amount: parseFloat(dollarAmount), type: type, name: name };
  };

  $scope.updateTierValues = function() {
    angular.forEach($scope.tippingOptions.tiers, function(value) {
      if (value.type == "Percent") {
        value.dollar_amount = ((value.value / 100) * $scope.pledgeAmount);
      } else {
        value.dollar_amount = value.value;
      }
    });
    $scope.tippingOptions.tiers.sort(function(a, b) {
      return parseFloat(a.dollar_amount) - parseFloat(b.dollar_amount);
    });
    if ($scope.tippingOptions.tiers[0].type == "Percent" && $scope.tippingOptions.tiers[0].dollar_amount < $scope.lowestAmount) {
      $scope.tippingOptions.tiers[0].dollar_amount = $scope.lowestAmount;
      angular.forEach($scope.tippingOptions.tiers, function(value, index) {
        if (index != 0 && value.type == "Percent") {
          value.dollar_amount += $scope.lowestAmount;
        }
      });
    }
  }

  function sendGATransaction(success, gaId) {

    var ea = { //ecommerce analytics
      'id': success.id,
      'affiliation': $scope.campaign.name,
      'revenue': success.amount,
      'name': $scope.rname
    };

    var name = ($scope.rname) ? $scope.rname : 'contribution';

    var script = "<script>" +
      "ga('create','" + gaId + "', 'auto', {'name': 'ecommerceTracking'});" +

      "ga('ecommerceTracking.require', 'ecommerce');" +

      "ga('ecommerceTracking.ecommerce:addTransaction',{" +
      "    'id': '" + ea.id + "'," +
      "    'affiliation': '" + ea.affiliation + "'," +
      "    'revenue': '" + ea.revenue + "'," +
      "  });" +

      "ga('ecommerceTracking.ecommerce:addItem',{" +
      "    'id': '" + ea.id + "'," +
      "    'price': '" + ea.revenue + "'," +
      "    'name': '" + name + "'," +
      "  });" +
      "ga('ecommerceTracking.ecommerce:send');" +
      "ga('send', 'pageview');" +
      "</script>";

    $scope.gaScript = $sce.trustAsHtml(script);
  }

  // Animated scroll to rewards section
  $scope.scrollToRewardParam = function() {
    $location.search({});
    $location.path($scope.campaign_loc).search('scroll_to_reward', 1);
  }

});