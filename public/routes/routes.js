/*
* author  => Peek International
* designBy => Peek International
*/
app.config(function($routeProvider) {
    $routeProvider
    .when("/", {
        templateUrl : "./views/login.html"
    })
    .when("/dash", {
        templateUrl : "./views/dash.html"
    })
    .when("/videoCall", {
        templateUrl : "./views/videoCall.html"
    })
    .when("/blue", {
        templateUrl : "blue.htm"
    });
});