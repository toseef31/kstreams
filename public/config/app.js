/*
* author  => Peek International
* designBy => Peek International
*/

var dependencies = [
	"ngRoute", 
	'ngSanitize',
	'ui.bootstrap',
	'ngWebsocket'
];
//'btorfs.multiselect', 
var app = angular.module("chatApp", dependencies);

app.directive('ngRightClick', function($parse) {
    return function(scope, element, attrs) {
        var fn = $parse(attrs.ngRightClick);
        element.bind('contextmenu', function(event) {
            scope.$apply(function() {
                event.preventDefault();
                fn(scope, {$event:event});
            });
        });
    };
});
app.directive('fileInput',['$parse',function($parse){
	return {
		restrict:'A',
		link:function(scope,elm,attrs){
			elm.bind('change',function(){
				$parse(attrs.fileInput).assign(scope,elm[0].files)
				scope.$apply()
				var scope2 = angular.element(document.getElementById("MainWrap")).scope();
				scope2.$apply(function(){
					scope2.upload();
				});
			})
		}
	}
}])
app.directive('fileDropzone',function(){
	return {
		restrict:'A',
		scope:{
			filesToUpload:'='
		},
		link:function(scope,element,attrs){
			element.bind('dragover',function(e){
				
				if( e != null ){
					e.preventDefault();
				}
				e.originalEvent.dataTransfer.effectAllowed = "copy";
				element.attr('class','msg_history file-drop-zone-over');
			})
			element.bind('dragenter',function(e){
				if( e != null ){
					e.preventDefault();
				}
				e.originalEvent.dataTransfer.effectAllowed = "copy";
				element.attr('class','msg_history file-drop-zone-over');
			});
			element.bind('drop',function(e){
				element.attr('class','msg_history');
				if( e != null ){
					e.preventDefault();
				}
				var scope2 = angular.element(document.getElementById("MainWrap")).scope();
				scope2.$apply(function(){
					scope2.files = e.originalEvent.dataTransfer.files;
					scope2.upload();
				});
			});
		}
	}
})

app.directive('execOnScrollToTop', function () {
	return {
	  restrict: 'A',
	  link: function (scope, element, attrs) {
		var fn = scope.$eval(attrs.execOnScrollToTop);
  
		element.on('scroll', function (e) {
  
		  if (!e.target.scrollTop) {
			console.log("scrolled to top...");
			scope.$apply(fn);
		  }
  
		});
	  }
	};
  });

  app.directive('execOnScrollToBottom', function () {
	return {
	  restrict: 'A',
	  link: function (scope, element, attrs) {
		var fn = scope.$eval(attrs.execOnScrollToBottom),
			clientHeight = element[0].clientHeight;
  
		element.on('scroll', function (e) {
		  var el = e.target;
  
		  if ((el.scrollHeight - el.scrollTop) === clientHeight) { // fully scrolled
			console.log("scrolled to bottom...");
			scope.$apply(fn);
		  }
		});
	  }
	};
  });

  app.filter('search', function() {
	return function(items, keyword) {
	  // if no keyword is entered, just display all the items
	  if (!keyword) { 
		return items; 
	  } 
	  // return subset of new items 
	  else {
		var newItems = [];
		var keyword = keyword.toLowerCase();
		// create new set of items where 'keyword' exists in object data
		for (var i of items) {
		  if (i.name.toLowerCase().indexOf(keyword) > -1// || 
			  //checkChat(i.materials, keyword)
			  ) { newItems.push(i); }
		}
		// loop through user's chat checking if 'keyword' exists in it also
		// function checkMaterials(mat, keyword) {
		//   for (var m of mat) {
		// 	if (m.toLowerCase().indexOf(keyword) > -1) {
		// 	  return true;
		// 	}
		//   }
		//   return false;
		// }
		return newItems;
	  }
	};
  });
