/*
* author  => Peek International
* designBy => Peek International
*/
app.controller("loginController", function($scope,$http,$location,$rootScope) {
	$scope.notAuthorize = false; // show invalid username password message
	/*check session*/
	$http({
          method: 'GET',
          url: '/checkSession',
        }).then(function successCallback(response) {
        	$rootScope.user = response.data;
        	$location.path("/dash"); 
        });

    /*login function*/
    $scope.login = function () {
        $http({
              method: 'POST',
              url: '/login',
              data:{email:$scope.email,password:$scope.password}
            }).then(function successCallback(response) {
            	$rootScope.user = response.data;
            	$location.path("/dash"); 
            }, function errorCallback(response) {
                $scope.notAuthorize = true;
            });
    }
    
});