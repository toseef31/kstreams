/*
* author  => Peek International
* designBy => Peek International
*/
app.config(function($routeProvider) {
    $routeProvider
    .when("/", {
        title: 'Login',
        templateUrl : "./views/login.html"
    })
    .when("/dash", {
        title: 'Dashboard',
        templateUrl : "./views/dash.html"
    }) 
    .when("/screenshare", {
        templateUrl : "./views/screenshare.html"
    })
    .when("/videoCall", {
        templateUrl : "./views/videoCall.html"
    })
    .when("/blue", {
        templateUrl : "blue.htm"
    });
});