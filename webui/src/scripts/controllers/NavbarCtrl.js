app.controller('NavbarCtrl', function($location, $route, $scope, $rootScope, Restangular, UserService, API_URL, RequestCacheService, PortalSettingsService, $translatePartialLoader, $translate) {

    $scope.user = UserService;
    $scope.pages = [];
    $scope.logo_url = "";
    $scope.headerMenu = [];
    $scope.logoUrl = "";
    $scope.showLogoPlaceholder = false;
    $scope.$location = $location;


    PortalSettingsService.getSettingsObj().then(function(success) {
        $scope.public_setting = success.public_setting;
        // get site logo
        var logo_url = success.public_setting.site_logo.path_external;
        $scope.payment_gateway = success.public_setting.site_payment_gateway;
        $scope.logoUrl = logo_url ? API_URL.url + '/image/site_logo_320x80/' + logo_url : "images/placeholder-images/placeholder_logo.png";
        if (typeof success.public_setting.site_logo_link == 'undefined') {
            $scope.site_logo_link = '/';
        } else {
            $scope.site_logo_link = success.public_setting.site_logo_link;
        }
        // retrieve menu item ids, then retrieve pages info
        $scope.headerMenu = success.public_setting.site_menu_header

        RequestCacheService.getPage().then(function(success) {
            for (var i = 0; i < $scope.headerMenu.length; i++) {
                for (var j = 0; j < success.length; j++) {
                    if ($scope.headerMenu[i].id == success[j].id) {
                        if (success[j].path == '/') {
                            $scope.headerMenu[i]['name'] = success[j].name;
                            $scope.headerMenu[i]['path'] = '/';
                        } else if ($scope.headerMenu[i].id) {
                            $scope.headerMenu[i]['name'] = success[j].name;
                            $scope.headerMenu[i]['path'] = success[j].path;
                        }
                    }
                }
            }

            if ($scope.public_setting.site_admin_campaign_management_only) {
                for (var i = 0; i < $scope.headerMenu.length; i++) {
                    if ($scope.headerMenu[i].name == "Start" && UserService.person_type_id != 1) {
                        $scope.headerMenu.splice(i, 1);
                        break;
                    }
                }
            }

            $scope.hideCampaignNav = $scope.public_setting.site_admin_campaign_management_only && $scope.user.person_type_id != 1;

        });

        $scope.stickyMenu = success.public_setting.site_theme_sticky_menu;
        $scope.enabledContribution = success.public_setting.site_campaign_contributions;

    });

    // page reload
    $scope.reload = function() {
        $route.reload();

    }

    // toggle mobile side bar
    $scope.closeMobileSidebar = function() {
        $('#mobile-sidebar').sidebar('hide');
        $('body').removeClass('mobile-sidebar-no-scroll');
    }
    $scope.showMobileSidebar = function() {
        if ($('#mobile-sidebar').sidebar('is visible')) {
            $('#mobile-sidebar').sidebar('hide');
        } else {
            $('#mobile-sidebar').sidebar('show');
            $('body').addClass('mobile-sidebar-no-scroll');
        }
    }
});
