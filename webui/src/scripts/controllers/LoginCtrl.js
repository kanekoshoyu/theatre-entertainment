app.controller('LoginCtrl', function($rootScope, $scope, PortalSettingsService, UserService, Restangular, redirectService, $translate, $translatePartialLoader, AUTH_SCHEME, $timeout) {
  // Login page
  $scope.submit_once = false;
  $scope.formData = {};
  $scope.account = {};
  var auth_scheme = AUTH_SCHEME[0];
  var url = redirectService.getUrl();
  var tmp_lst = url.split('/');
  if (tmp_lst[1] == 'authenticate' && tmp_lst[2] == 'forgot') {
    $scope.formData.successful = {
      message: "login_new_password",
    };
  }
  $scope.$watch('userEmail', function(v) {
    if ($scope.formData.email) {

    } else {
      $scope.formData.email = v;
    }
  });

  $(".modal").modal({
    allowMultiple: true
  });

  // Check valid login id
  $scope.tos_login = false;
  PortalSettingsService.getSettings(true).then(function(success) {
    $rootScope.loginRedirect = null;
    $scope.val = success;
    angular.forEach($scope.val, function(value) {
      if (value) {
        if (value.name === 'site_tos_login_ui') {
          $scope.tos_login = value.value;
        } else if (value.name === "site_auth_scheme") {
          auth_scheme = value.value;
        } else if (value.name === "site_disable_account_setting") {
          $scope.isAccSetEnabled = !value.value;
        } else if (value.name === "site_login_redirect" && !$rootScope.loginRedirect) {
          $rootScope.loginRedirect = value.value;
          if (typeof $scope.loginRedirect.text !== "undefined" && $scope.loginRedirect.text !== "" && typeof $scope.loginRedirect.link !== "undefined" && $scope.loginRedirect.link !== "") {
            $scope.loginRedirectShow = true;
          } else {
            $scope.loginRedirectShow = false;
          }
        }
      }
    });
    $scope.isAccSetEnabled = $scope.isAccSetEnabled != undefined ? $scope.isAccSetEnabled : true;
    $scope.$emit("loading_finished");
  });
  // Check valid login id
  $rootScope.checklogin = true;
  $scope.formData = {};
  $scope.submit = function() {
    if ($scope.tos_login) {
      $scope.submit_once = true;
      if (!$('#login input[type="checkbox"]').is(':checked')) {
        $scope.login_tos_not_checked = true;
        return;
      } else {
        $scope.login_tos_not_checked = false;
      }
    }

    var not_validated = !$('.ui.login.form').form('validate form');
    if (not_validated) {
      return;
    }

    // clear messages
    $scope.formData.errors = null;
    $scope.formData.successful = null;
    // set loading true
    $scope.loading = true;
    // display message
    $scope.formData.successful = {
      "message": "login_logging_in"
    };
    $translate(['login_page_login_message']).then(function(value) {
      $scope.login_message = value.login_page_login_message;
    });
    // angularjs model will not autofill. need to do it manually
    if (!$scope.formData.email) {
      $scope.formData.email = $('#login input[name="email"]').val();
    }
    if (!$scope.formData.password) {
      $scope.formData.password = $('#login input[name="password"]').val();
    }
    // Check if it's SHA 1, a constant in app.js
    if (auth_scheme.id == 2) {
      $scope.formData.password_scheme = "sha1";
    }
    Restangular.all('authenticate').post($scope.formData).then(
      function(success) {
        // clear messages
        $scope.formData.errors = null;
        $scope.formData.successful = null;
        // success message
        $scope.formData.successful = {
          message: "login_login_successful"
        };
        // translate login successful
        $translate(['login_page_login_success']).then(function(value) {
          $scope.login_message = value.login_page_login_success;
        });
        UserService.setLoggedIn(success); // Update loggedin status and user account info
        $('.ui.modal').modal('hide');
      },
      function(failure) { // If the login request fails, set the errors returned from the server
        // clear messages
        $scope.formData.errors = null;
        $scope.formData.successful = null;
        $scope.formData.errors = failure.data.errors;
        $scope.formData.error_message = failure.data.message;
        $scope.str = $scope.formData.errors.credential_verification[0].code;
        if ($scope.str === "authenticate_invalid_authenticate_credentials") {
          $translate('login_page_invalid_credentials').then(function(value) {
            $scope.invalid_cred = value;
          });

        }

        // set loading false
        $scope.loading = false;
      });


  };
  // Details empty will prompt error message
  $scope.serrormessgae = "";
  $timeout(function() {
    $translate(['login_page_invalid_email', 'login_page_empty_email', 'login_page_password_empty', 'login_page_password_length']).then(function(value) {

      $scope.email_empty_invalid = value.login_page_invalid_email;
      $scope.email_empty = value.login_page_empty_email;
      $scope.password_empty = value.login_page_password_empty;
      $scope.password_length = value.login_page_password_length;
      // semantic form validation
      $('.ui.login.form').form({
        email: {
          identifier: 'email',
          rules: [{
            type: 'empty',
            prompt: $scope.email_empty
          }, {
            type: 'email',
            prompt: $scope.email_empty_invalid
          }]
        },
        password: {
          identifier: 'password',
          rules: [{
            type: 'empty',
            prompt: $scope.password_empty
          }, {
            type: 'length[6]',
            prompt: $scope.password_length
          }]
        }
      }, {
        inline: true,
      });
    });
  }, 1000);

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
    if ($scope.isAccSetEnabled) {
      // process when email is valid
      if (!$('.ui.email.form').form('validate form')) {
        return;
      }

      var data = {
        'email': $scope.account.email,
      }
      Restangular.one('authenticate').one('forgot').customPOST(data).then(function(success) {
        if (success.success) {
          $rootScope.emailconfirmed = true;
        } else {
          $rootScope.wrongemail = true;
        }
      });
    }
  };

  $scope.reconfirm = function() {
    // process when email is valid
    if (!$('.ui.email.form').form('validate form')) {
      return;
    }
    var data = {
      'email': $scope.account.email,
    };
    Restangular.one('register').one('reconfirm').customPOST(data).then(function(success) {
      if (success.success) {
        $rootScope.emailconfirmed = true;
      } else {
        $rootScope.wrongemail = true;
      }
    });
  }

  var translationLogin = $translate.instant(['login_emailempty_prompt', 'login_emailinvalid_prompt']);
  // modal forgot password/activate account validation
  $('.ui.email.form').form({
    email: {
      identifier: 'email',
      rules: [{
        type: 'empty',
        prompt: translationLogin.login_emailempty_prompt
      }, {
        type: 'email',
        prompt: translationLogin.login_emailinvalid_prompt
      }]
    },
  }, {
    inline: true,
    on: 'blur',
    onInvalid: function() {
      if (this.hasClass('ng-pristine')) {
        this.parent().removeClass('error');
        this.next().remove();
      }
    }
  });
});