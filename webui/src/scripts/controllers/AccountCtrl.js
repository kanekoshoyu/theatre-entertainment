app.controller('AccountTabCtrl', function($scope, UserService, Restangular, $location, $routeParams) {
  if (!UserService.isLoggedIn()) {
    $location.path('/');
  }

  $scope.formData = {};
  $scope.formData.email = UserService.email;
  window.a = $scope;

  $scope.errorShown = false;

  $scope.closeErrorMessage = function() {
    $scope.errorShown = false;
  }



  //validate email address
  function isValidEmailAddress(emailAddress) {
    var temp = emailAddress.match(/[-0-9a-zA-Z.+_]+@[-0-9a-zA-Z.+_]+\.[a-zA-Z]{2,4}/);
    if (temp) {
      return true;
    }
    return false;
  };

  $scope.sentChangeEmail = function() {
    Restangular.one('account').one('email').customPOST().then(
      function(success) {
        var msg = {
          header: "Verify email sent"
        };

        $scope.$parent.successMessage.push(msg);
      }
    );
  }

});
