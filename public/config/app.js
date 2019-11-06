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


  app.filter("timeago", function () {
	//time: the time
	//local: compared to what time? default: now
	//raw: wheter you want in a format of "5 minutes ago", or "5 minutes"
	return function (time, local, raw) {
		if (!time) return "never";

		if (!local) {
			(local = Date.now())
		}

		if (angular.isDate(time)) {
			time = time.getTime();
		} else if (typeof time === "string") {
			time = new Date(time).getTime();
		}

		if (angular.isDate(local)) {
			local = local.getTime();
		}else if (typeof local === "string") {
			local = new Date(local).getTime();
		}

		if (typeof time !== 'number' || typeof local !== 'number') {
			return;
		}

		var
			offset = Math.abs((local - time) / 1000),
			span = [],
			MINUTE = 60,
			HOUR = 3600,
			DAY = 86400,
			WEEK = 604800,
			MONTH = 2629744,
			YEAR = 31556926,
			DECADE = 315569260;

		if (offset <= MINUTE)              span = [ '', raw ? 'now' : 'less than a minute' ];
		else if (offset < (MINUTE * 60))   span = [ Math.round(Math.abs(offset / MINUTE)), 'min' ];
		else if (offset < (HOUR * 24))     span = [ Math.round(Math.abs(offset / HOUR)), 'hr' ];
		else if (offset < (DAY * 7))       span = [ Math.round(Math.abs(offset / DAY)), 'day' ];
		else if (offset < (WEEK * 52))     span = [ Math.round(Math.abs(offset / WEEK)), 'week' ];
		else if (offset < (YEAR * 10))     span = [ Math.round(Math.abs(offset / YEAR)), 'year' ];
		else if (offset < (DECADE * 100))  span = [ Math.round(Math.abs(offset / DECADE)), 'decade' ];
		else                               span = [ '', 'a long time' ];

		span[1] += (span[0] === 0 || span[0] > 1) ? 's' : '';
		span = span.join(' ');

		if (raw === true) {
			return span;
		}
		return (time <= local) ? span + ' ago' : 'in ' + span;
	}
})
