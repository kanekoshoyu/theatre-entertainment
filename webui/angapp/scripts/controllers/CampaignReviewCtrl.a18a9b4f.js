app.controller("campaignReviewCtrl",["$location","$scope","$rootScope","$routeParams","CreateCampaignService","Restangular","RESOURCE_REGIONS","API_URL","$translate","$translatePartialLoader","CampaignSettingsService","VideoLinkService","PortalSettingsService",function($location,$scope,$rootScope,$routeParams,CreateCampaignService,Restangular,RESOURCE_REGIONS,API_URL,$translate,$translatePartialLoader,CampaignSettingsService,VideoLinkService,PortalSettingsService){function getNote(){Restangular.one("campaign",id).one("note").customGET().then(function(success){success&&success.length&&($scope.note=success[0].value,$scope.note.id=success[0].id)})}function checkTime(){var end=(moment(),moment($scope.campaign.ends)),d1=moment($scope.campaign.starts),d2=moment();moment.duration(d2.diff(end)).asMinutes();moment($scope.campaign.ends)<moment(new Date)?($scope.min=Math.abs(moment.duration(end.diff(d1)).asMinutes()),$scope.days=Math.abs(moment.duration(end.diff(d1)).asDays()),$scope.hours=Math.abs(moment.duration(end.diff(d1)).asHours()),$scope.week=Math.abs(moment.duration(end.diff(d1)).asWeeks()),$scope.month=Math.abs(moment.duration(end.diff(d1)).asMonths())):($scope.min=moment.duration(d2.diff(d1)).asMinutes(),$scope.days=moment.duration(d2.diff(d1)).asDays(),$scope.hours=moment.duration(d2.diff(d1)).asHours(),$scope.week=moment.duration(d2.diff(d1)).asWeeks(),$scope.month=moment.duration(d2.diff(d1)).asMonths()),$scope.month>1?($scope.duration=parseInt($scope.month),$scope.month>1&&$scope.month<2?$scope.dtype="month":$scope.dtype="months"):$scope.week>1?($scope.duration=parseInt($scope.week),$scope.week>1&&$scope.week<2?$scope.dtype="week":$scope.dtype="weeks"):$scope.days>1?($scope.duration=parseInt($scope.days),$scope.days>1&&$scope.days<2?$scope.dtype="day":$scope.dtype="days"):$scope.hours>1?($scope.duration=parseInt($scope.hours),$scope.hours>1&&$scope.hours<2?$scope.dtype="hour":$scope.dtype="hours"):$scope.min>1&&($scope.duration=parseInt($scope.min),$scope.min>1&&$scope.min<2?$scope.dtype="min":$scope.dtype="mins")}$scope.RESOURCE_REGIONS=RESOURCE_REGIONS;var id=$routeParams.campaign_id;$scope.duration="",$scope.campaign={};var msg;PortalSettingsService.getSettingsObj().then(function(success){$scope.public_settings=success.public_setting}),CreateCampaignService.load(id).then(function(success){$scope.campaign=success,checkTime(),CampaignSettingsService.setCampaignId($routeParams.campaign_id),CampaignSettingsService.processSettings(success.settings),$scope.campaign.settings=CampaignSettingsService.getSettings(),$.trim($scope.campaign.settings.top_header_link)&&$scope.campaign.settings.top_header_link.length<=0&&($scope.campaign.settings.top_header_link="#"),"#"==$scope.campaign.settings.top_header_link&&delete $scope.campaign.settings.top_header_link,$scope.faqs=success.faqs,$scope.remaining_time=$scope.campaign.time_remaining,$scope.days_rem=$scope.campaign.days_remaining_inclusive,$scope.campaign.timezoneText=moment().tz($scope.campaign.timezone).zoneAbbr(),$translate(["seconds_to_go","second_to_go","seconds_ago","second_ago","minutes_to_go","minute_to_go","minutes_ago","minute_ago","hours_to_go","hour_to_go","hours_ago","hour_ago"]).then(function(values){0==$scope.days_rem?($scope.days_rem=$scope.campaign.hours_remaining_inclusive,0==$scope.days_rem?($scope.days_rem=$scope.campaign.minutes_remaining_inclusive,0==$scope.days_rem?($scope.days_rem=$scope.campaign.seconds_remaining_inclusive,$scope.days_rem>=1?$scope.days_rem>1?$scope.day_text=values.seconds_to_go:$scope.day_text=values.second_to_go:($scope.days_rem=$scope.days_rem*-1,$scope.days_rem>1?$scope.day_text=values.seconds_ago:$scope.day_text=values.second_ago)):$scope.days_rem>=1?$scope.days_rem>1?$scope.day_text=values.minutes_to_go:$scope.day_text=values.minute_to_go:($scope.days_rem=$scope.days_rem*-1,$scope.days_rem>1?$scope.day_text=values.minutes_ago:$scope.day_text=values.minute_ago)):$scope.days_rem>=1?$scope.days_rem>1?$scope.day_text=values.hours_to_go:$scope.day_text=values.hour_to_go:($scope.days_rem=$scope.days_rem*-1,$scope.days_rem>1?$scope.day_text=values.hours_ago:$scope.day_text=values.hour_ago)):$scope.days_rem>=1?$scope.days_rem>1?$scope.day_text=" days to go":$scope.day_text=" day to go":($scope.days_rem=$scope.days_rem*-1,$scope.days_rem>1?$scope.day_text="days ago":$scope.day_text="day ago")})}),$scope.note={},getNote(),$scope.$emit("loading_finished"),$translatePartialLoader.addPart("error"),$translatePartialLoader.addPart("campaign-review"),$translate.refresh(),$scope.$watch("campaign.links",function(value){value&&angular.forEach(value,function(link){1==link.region_id&&1==link.resource_content_type_id&&"link"==link.resource_type&&($scope.campaign.video=link.uri.replace(/https?:\/\//gi,$location.protocol()+"://"),VideoLinkService.processVideoLink($scope.campaign.video,""),$scope.campaign.video_type=VideoLinkService.get_video_type(),"custom"==$scope.campaign.video_type&&($scope.campaign.video=VideoLinkService.get_video_link()))})}),$scope.addNotes=function(fieldName){$scope.noteFieldName=fieldName,$(".ui.modal.admin-notes").modal("show")},$scope.saveNote=function(){var data={value:$scope.note};$scope.note.id?Restangular.one("campaign",id).one("note",$scope.note.id).customPUT(data):Restangular.one("campaign",id).one("note",$scope.note.id).customPOST(data)},$scope.action=function(actionName){var data={entry_status_id:""};msg={loading:!0,loading_message:"updating_campaign_status"},$rootScope.floatingMessage=msg,"approve"==actionName?(data.entry_status_id=2,Restangular.one("campaign",id).customPUT(data).then(function(success){msg={header:"approve_campaign"},$rootScope.floatingMessage=msg,$scope.hideFloatingMessage()},function(failure){msg={header:failure.data.message},$rootScope.floatingMessage=msg,$scope.hideFloatingMessage()})):"disapprove"==actionName&&(data.entry_status_id=3,Restangular.one("campaign",id).customPUT(data).then(function(success){msg={header:"disapprove_campaign"},$rootScope.floatingMessage=msg},function(failure){msg={header:failure.data.message},$rootScope.floatingMessage=msg,$scope.hideFloatingMessage()}))},$scope.removeNote=function(fieldName){$scope.note[fieldName]="",$scope.saveNote()},$scope.dateInPast=function(value,sec){return 0==sec||"00"==sec||sec<0}}]);