/*
* author  => Peek International
* designBy => Peek International
*/
app.config(function($routeProvider) {
    $routeProvider
    .when("/", {
        title: 'Login',
        templateUrl : "./views/login.html" //temporarily changed from 'login'
    })
    .when("/dash", {
        title: 'Dashboard',
        templateUrl : "./views/dash.html"
    }) 
    .when("/chatDocker", {
        title: 'chatDocker',
        templateUrl : "./views/chatDocker.html"
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