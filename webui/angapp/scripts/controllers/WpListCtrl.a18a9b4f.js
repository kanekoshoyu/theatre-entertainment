app.controller("wpListCtrl",["$http","$scope","API_URL","$timeout","$location","$sce","wpService","BLOG_SETTINGS",function($http,$scope,API_URL,$timeout,$location,$sce,wpService,BLOG_SETTINGS){function updateParameter(){var obj={};$scope.category_filter.length&&(obj={category:$scope.category_filter}),$scope.tag_filter.length&&(obj.tag=$scope.tag_filter),$scope.s&&$scope.s.length&&(obj.s=$scope.s),$location.search(obj)}$scope.posts=[],$scope.categories=[],$scope.category_filter=[],$scope.tag_filter=[],$scope.current_page=1,$scope.totalPage=1,$scope.posts_per_page=BLOG_SETTINGS.posts_per_page,$scope.updatePostList=function(){wpService.getPosts($scope.category_filter,function(){$scope.posts=wpService.posts,$scope.totalPage=wpService.totalPage},$scope.tag_filter,$scope.posts_per_page,$scope.current_page,$scope.s)};var para=$location.search();para.category&&$scope.category_filter.push(para.category),para.tag&&$scope.tag_filter.push(para.tag),para.s&&($scope.s=para.s),$scope.list_limit=$scope.posts_per_page,wpService.getPosts($scope.category_filter,function(){$scope.posts=wpService.posts},$scope.tag_filter,$scope.list_limit,1,$scope.s),wpService.categories&&wpService.categories.length?($scope.categories=wpService.categories,$scope.totalPage=wpService.totalPage):wpService.getCategories(function(){$scope.categories=wpService.categories,$scope.totalPage=wpService.totalPage}),$scope.updateCategory=function(category){if($scope.category_filter=[],category)$scope.category_filter.push(category.name),updateParameter(),$scope.updatePostList();else{$scope.category_filter=[];var para=$location.search();delete para.category,$location.search(para),$scope.updatePostList()}},$scope.updateTags=function(tag){$scope.tag_filter=[],tag?($scope.tag_filter.push(tag.slug),updateParameter(),$scope.updatePostList()):$scope.updatePostList()},$scope.updateSearchTerm=function(){$scope.s.length?(updateParameter(),$scope.updatePostList()):$scope.updatePostList()},$scope.searchEnterPress=function(e){13==e.charCode&&$scope.updateSearchTerm()}}]);