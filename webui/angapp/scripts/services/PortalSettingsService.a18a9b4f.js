app.service("PortalSettingsService",["$cacheFactory","Restangular",function($cacheFactory,Restangular){var portal_settings={},cache=$cacheFactory("cached_settings");this.getSettings=function(refresh){var data=cache.get("portal_settings");if(!data||refresh){var request=Restangular.one("portal/setting").customGET();return cache.put("portal_settings",request),request}return data},this.reloadSettings=function(){cache.remove("portal_settings"),this.getSettings()},this.getSettingsObj=function(refresh){var refreshData=1==refresh,request=this.getSettings(refreshData);return request.then(function(success){return portal_settings.public_setting={},portal_settings.private_setting={},angular.forEach(success,function(value){3==value.setting_type_id?portal_settings.public_setting[value.name]=value.value:1==value.setting_type_id&&(portal_settings.private_setting[value.name]=value.value)}),portal_settings})},this.savePublicSettings=function(data){if(data){var request=Restangular.one("portal/setting/public").customPUT(data);return request}},this.savePrivateSettings=function(data){if(data){var request=Restangular.one("portal/setting").customPUT(data);return request}},this.deletePublicSettings=function(data){if(data){var request=Restangular.one("portal/setting/public").customDELETE(data);return request}},this.deletePrivateSettings=function(data){if(data){var request=Restangular.one("portal/setting").customDELETE(data);return request}}}]);