app.controller("AccountTabCtrl",["$scope","UserService","Restangular","$location","$routeParams",function($scope,UserService,Restangular,$location,$routeParams){UserService.isLoggedIn()||$location.path("/"),$scope.formData={},$scope.formData.email=UserService.email,window.a=$scope,$scope.errorShown=!1,$scope.closeErrorMessage=function(){$scope.errorShown=!1},$scope.sentChangeEmail=function(){Restangular.one("account").one("email").customPOST().then(function(success){var msg={header:"Verify email sent"};$scope.$parent.successMessage.push(msg)})}}]);