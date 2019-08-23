/*
* author  => Peek International
* designBy => Peek International
*/
app.controller("loginController", function ($scope, $http, $location, $rootScope) {
    $scope.notAuthorize = false; // show invalid username password message
    // $scope.testProjectId = "5d4c07fb030f5d0600bf5c03"; //5d4c07fb030f5d0600bf5c03
    // $scope.projectName = "";
    // $scope.projectLogo = "";
    // $scope.projectTitle = "";
    // $scope.projectTitleLogo = "";

    // $http.post("/getProjects", { 'projectId': $scope.testProjectId }).then(function (response) {
    //     $scope.projectName = response.data[0].name;
    //     $scope.projectLogo = response.data[0].logo;
    //     $scope.projectTitle = response.data[0].metaTitle;
    //     $scope.projectTitleLogo = "images/logos/" + response.data[0].logo;
    // });

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
            data: { email: $scope.email, password: $scope.password }
        }).then(function successCallback(response) {
            $rootScope.user = response.data;
            $location.path("/dash");
        }, function errorCallback(response) {
            $scope.notAuthorize = true;
        });
    }

});