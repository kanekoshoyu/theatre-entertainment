app.service('wpService', function($http, API_URL, $timeout, $location, $sce){
	var wpObj = {
		posts:[],
		categories:[],
	};
	wpObj.getPosts = function(category_filter, callback, tag_filter, posts_per_page, page_index, search_text){
		var filter = "";
		if (search_text){
			filter = filter+"&filter[s]="+search_text;
		}
		if (category_filter && category_filter.length){
			var tmp = "";
			var i;
			for (i=0;i<category_filter.length-1;i++){
				tmp = tmp+category_filter[i];
				tmp = tmp+',';
			}
			tmp = tmp + category_filter[i];
			filter = filter + '&filter[category_name]=' + tmp;
		}
		if (tag_filter && tag_filter.length){
			var tmp = "";
			var i;
			for (i=0;i<tag_filter.length-1;i++){
				tmp = tmp+tag_filter[i];
				tmp = tmp+',';
			}
			tmp = tmp + tag_filter[i];
			filter = filter + '&filter[tag]=' + tmp;
		}
		if (posts_per_page){
			filter = filter + '&filter[posts_per_page]='+posts_per_page;
		}
		if (page_index){
			filter = filter+'&page='+page_index;
		}
		if (API_URL.wp_api){
			var req = {
				method: 'GET',
				url: API_URL.wp_api + 'posts' + filter,
				transformRequest: function(data, headersGetter) {
					var headers = headersGetter();
					delete headers['X-Auth-Token'];
					return headers;
				},
				withCredentials:false,
			};
			$http(req).success(function(data, status, headers, config) {
				wpObj.posts = data;		
				for (var i=0;i<wpObj.posts.length;i++){
					wpObj.posts[i].title_html = $sce.trustAsHtml(wpObj.posts[i].title);
					wpObj.posts[i].content_html = $sce.trustAsHtml(wpObj.posts[i].content);
					wpObj.posts[i].title_ab = $sce.trustAsHtml(wpObj.posts[i].title.substring(0, 100));
					wpObj.posts[i].title_cd = $sce.trustAsHtml(wpObj.posts[i].title.substring(0, 60));
					if (wpObj.posts[i].excerpt){
						wpObj.posts[i].excerpt_ab = $sce.trustAsHtml(wpObj.posts[i].excerpt.substring(0, 360));
						wpObj.posts[i].excerpt_cd = $sce.trustAsHtml(wpObj.posts[i].excerpt.substring(0, 150));
					}
					wpObj.posts[i].cat_str = "";
					var j;
					for (j=0; j<wpObj.posts[i].terms.category.length-1;j++){
						wpObj.posts[i].cat_str = wpObj.posts[i].cat_str + wpObj.posts[i].terms.category[j].name + ', ';
					}
					wpObj.posts[i].cat_str = wpObj.posts[i].cat_str + wpObj.posts[i].terms.category[j].name;
					var tmp = new Date(wpObj.posts[i].date);
					wpObj.posts[i].dateString = tmp.toString();
				}
				if (posts_per_page!=2){
					wpObj.totalPage = headers()['x-wp-totalpages'];
				}
				if (typeof callback == 'function'){
					callback.call();
				}
			});
		}else{
			$timeout(function(){
				var req = {
					method: 'GET',
					url: API_URL.wp_api + 'posts' + filter,
					transformRequest: function(data, headersGetter) {
						var headers = headersGetter();
						delete headers['X-Auth-Token'];
						return headers;
					},
					withCredentials:false,
				};
				$http(req).success(function(data, status, headers, config) {
					wpObj.posts = data;	
					(wpObj.posts);		
					for (var i=0;i<wpObj.posts.length;i++){
						wpObj.posts[i].title_html = $sce.trustAsHtml(wpObj.posts[i].title);
						wpObj.posts[i].content_html = $sce.trustAsHtml(wpObj.posts[i].content);
						wpObj.posts[i].title_ab = $sce.trustAsHtml(wpObj.posts[i].title.substring(0, 100));
						wpObj.posts[i].title_cd = $sce.trustAsHtml(wpObj.posts[i].title.substring(0, 50));
						if (wpObj.posts[i].excerpt){
							wpObj.posts[i].excerpt_ab = $sce.trustAsHtml(wpObj.posts[i].excerpt.substring(0, 360));
							wpObj.posts[i].excerpt_cd = $sce.trustAsHtml(wpObj.posts[i].excerpt.substring(0, 150));
						}
						wpObj.posts[i].cat_str = "";
						var j;
						for (j=0; j<wpObj.posts[i].terms.category.length-1;j++){
							wpObj.posts[i].cat_str = wpObj.posts[i].cat_str + wpObj.posts[i].terms.category[j].name + ', ';
						}
						wpObj.posts[i].cat_str = wpObj.posts[i].cat_str + wpObj.posts[i].terms.category[j].name;
						var tmp = new Date(wpObj.posts[i].date);
						wpObj.posts[i].dateString = tmp.toString();
					}
					if (typeof callback == 'function'){
						callback.call();
					}
				});
			}, 1000);
		}
	}
	wpObj.getCategories = function(callback){
		var req = {
			method: 'GET',
			url: API_URL.wp_api + 'taxonomies/category/terms',
			headers: {},
			transformRequest: function(data, headersGetter){
				var headers = headersGetter();
				delete headers['X-Auth-Token'];
				return headers;
			},
			withCredentials:false,
		}
		$http(req).success(function(data, status, headers, config) {
			wpObj.categories = data;
			var new_list = [];
			for (var i=0;i<data.length;i++){
				var current = data[i];
				if (!current.parent){
					new_list.push(current);
					data.splice(i,1);
					i--;
				}
			}
			for (var i=0;i<data.length;i++){
				for (var j=0;j<new_list.length;j++){
					if (data[i].parent.ID==new_list[j].ID){
						if(!new_list[j].children){
							new_list[j].children = [];
						}
						new_list[j].children.push(data[i]);
						data.splice(i,1);
						i--;
						break;
					}
				}
			}
			for (var i=0;i<data.length;i++){
				for (var j=0;j<new_list.length;j++){
					if (new_list[j].children){
						for (var k=0;k<new_list[j].children.length;k++){
							if (data[i].parent.ID==new_list[j].children[k].ID){
								if (!new_list[j].children[k].children){
									new_list[j].children[k].children = [];
								}
								new_list[j].children[k].children.push(data[i]);
								data.splice(i,1);
								i--;
								break;
							}
						}
					}
				}
			}
			wpObj.categories = new_list;
			if (typeof callback == 'function'){
				callback.call();
			}
		});
	}
	return wpObj;
});