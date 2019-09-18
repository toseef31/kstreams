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
				/*preview code*/
				/*var fileObjectArray = [];
				angular.forEach(e.originalEvent.dataTransfer.files,function(file){
					var reader = new FileReader();
					reader.onload = function(e){
						scope.$apply(function(){
							var newFilePreview = e.target.result;
							var newFileName    = file.name;
							var newFileSize    = file.size;
							var fileObject  = {
								file:file,
								name:newFileName,
								size:newFileSize,
								preview:newFilePreview
							}
							fileObjectArray.push(fileObject);
							scope.filesToUpload = fileObjectArray;
						});
					}
					reader.readAsDataURL(file);
				});*/
				var scope2 = angular.element(document.getElementById("MainWrap")).scope();
				scope2.$apply(function(){
					scope2.files = e.originalEvent.dataTransfer.files;
					scope2.upload();
				});
			});
		}
	}
})