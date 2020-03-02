app.controller("dockerController", function ($scope, $http, $window, $rootScope) {
    $scope.usersList = $rootScope.tempUsers;
    console.log($scope.usersList);
})
