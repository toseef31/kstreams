/*
* author  => Peek International
* designBy => Peek International
*/
app.controller("loginController", function ($scope, $http, $location, $rootScope) {
    $scope.notAuthorize = false; // show invalid username password message
    //$scope.testProjectId = "5d4c07fb030f5d0600bf5c03"; //5d4c07fb030f5d0600bf5c03
    $rootScope.projectData=[];
    user={};

    $http.post("/getProject").then(function (response) {
        $rootScope.projectData=response.data;  
       // console.log( $rootScope.projectData.metaTitle);
    });

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
      //  console.log($scope.email);
        $http({
            method: 'POST',
            url: '/login',
            data: { email: $scope.user.email, password: $scope.user.password }
        }).then(function successCallback(response) {
            $rootScope.user = response.data;
            $location.path("/dash");
        }, function errorCallback(response) {
            $scope.notAuthorize = true;
        });
    }

});