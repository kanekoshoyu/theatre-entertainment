app.controller('RetryCardCtrl', function($scope, $routeParams, $location, Restangular, UserService, $translatePartialLoader, $translate, StripeService, $timeout) {
  $scope.card = {};
  var userId = UserService.id;
  var campaign_id = $routeParams.campaign_id;
  var pledge_level_id = $routeParams.pledge_level_id;
  var pledge_transaction_id = $routeParams.pledge_transaction_id;
  $scope.existedCards = [];
  $scope.cardSelected = {};
  $scope.old_card_id = '';
  $scope.new_card_id = '';
  $scope.isAddingNewCard = false;
  var existedStripeAccountCardId;
  var count = 0;
  $scope.$emit("loading_finished");
  setTimeout(function() {
    $('#propagate').checkbox('check');
  }, 200);

  if (userId > 0) {
    if (campaign_id) {
      // request get campaign details
      Restangular.one('campaign', campaign_id).customGET().then(function(success) {
        $scope.campaign = success;
      });
    }
    if (pledge_transaction_id) {
      Restangular.one('campaign', campaign_id).one('pledge-transaction', pledge_transaction_id).customGET().then(function(success) {
        $scope.failedContrib = success;
        $scope.old_card_id = $scope.failedContrib.stripe_account_card_id;
      }, function(failed) {
        if (failed.data.code == 'account_campaign_permission_transaction_entry_backer') {
          $('.ui.modal#wrong-account').modal({
            closable: false
          }).modal('show');
        } else if (failed.data.code == "entity_not_found") {
          $('.ui.modal#not-found-transaction').modal({
            closable: false
          }).modal('show');
        }
      });
    }

    $scope.saveCard = function() {
      var not_validated = !$('#credit-card-info').form('validate form');
      if (not_validated) {
        return;
      }
      $('#retrypledge').addClass('disabled');

      if ($scope.isAddingNewCard) {
        // get account
        StripeService.getPledgerAccount().then(function(account) {
          var account_id = account[0].id;
          var data = {
            number: $scope.cardSelected.number,
            exp_month: $scope.cardSelected.exp_month,
            exp_year: $scope.cardSelected.exp_year,
            cvc: $scope.cardSelected.cvc,
            name: $scope.cardSelected.name,
          };
          // submit card and get card id
          StripeService.createCard(account_id, data).then(function(card) {
            var card_id = card.id;
            $scope.new_card_id = card.id;
            var data;
            if ($('#propagate').checkbox('is checked')) {
              data = {
                stripe_account_card_id_previous: $scope.old_card_id,
                stripe_transaction_entry_backer_id: userId,
                stripe_account_card_id: card_id,
              };
            } else {
              data = {
                //stripe_account_card_id_previous:$scope.old_card_id
                stripe_transaction_entry_backer_id: userId,
                stripe_account_card_id: card_id
              };
            }

            repledge(data);

          }, function(failed) {
            $scope.failedMessage = failed.data.message;
            $('#retrypledge').removeClass('disabled');
          });
        });
      } else {
        var data;
        if ($('#propagate').checkbox('is checked')) {
          data = {
            stripe_account_card_id_previous: $scope.old_card_id,
            stripe_transaction_entry_backer_id: userId,
            stripe_account_card_id: existedStripeAccountCardId,
          };
        } else {
          data = {
            //stripe_account_card_id_previous:$scope.old_card_id
            stripe_transaction_entry_backer_id: userId,
            stripe_account_card_id: existedStripeAccountCardId
          };
        }
        repledge(data);
      }

    };
  } else {
    $location.path('/login');
  }

  function repledge(data) {
    // perform re-pledge
    Restangular.one('campaign', campaign_id).one('pledge-transaction', pledge_transaction_id).customPUT(data).then(function(success) {
      $scope.retrySuccess = true;
      $('.repledge-thank-you').modal('show');
    }, function(failed) {
      $scope.failedMessage = failed.data.message;
      $('#retrypledge').removeClass('disabled');
    });
  }

  $scope.goto = function() {
    $location.path('/explore');
  };

  var m_names = new Array("January", "February", "March",
    "April", "May", "June", "July", "August", "September",
    "October", "November", "December");
  var currdate = new Date();
  $scope.currdate = (m_names[currdate.getMonth()]) + " " + currdate.getDate() + " " + currdate.getFullYear() + " " + currdate.getHours() + ":" + currdate.getMinutes();

  StripeService.getPledgerAccount().then(function(success) {
    $scope.existedCards = success[0].cards;
    if (!$scope.existedCards.length) {
      $scope.isAddingNewCard = true;
    }
  });

  $scope.setStripeCardId = function(stripe_account_card_id) {
    existedStripeAccountCardId = stripe_account_card_id;
  }

  $scope.toggleNewCard = function() {
    $scope.isAddingNewCard = !$scope.isAddingNewCard;
    $(".existing_cards .dropdown").dropdown("clear");
    existedStripeAccountCardId = null;
  }

  $scope.initStripePayment = function() {
    $timeout(function() {
      $("input[name='card-number']").payment("formatCardNumber");
      $("input[name='cvc']").payment("formatCardCVC");
    }, 100);
  }

  $scope.hideNewCard = function() {
    $scope.isAddingNewCard = false;
  }

});
