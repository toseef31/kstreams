  var timmer = function(element){
    
    var obj = {};
    obj.ele = element;
    obj.callDropTime = 30;
    obj.controllerId = "MainWrap";
    obj.sec = 0;
    obj.mint = 0;
    obj.hour = 0;

    obj.startCallTimmer = function(){
      obj.calltimmer = setInterval(obj.timmer,1000);
    }

    obj.timmer = function(){
      obj.sec++;
      if(obj.sec == 60){
        obj.mint++;
        obj.sec = 0;
      }
      if(obj.mint == 60){
        obj.hour++;
        obj.mint = 0;
      }

      obj.time = obj.hour + ' h ' + obj.mint + ' m ' + obj.sec + ' s ';
    
      if( obj.ele == '#checker' && obj.time == '0 h 0 m '+obj.callDropTime+' s ' ){
  
        var scope = angular.element(document.getElementById(obj.controllerId)).scope();
            scope.$apply(function () {
            scope.dropCall();
        });
      }
      document.querySelector(obj.ele).innerHTML = obj.hour + ' h ' + obj.mint + ' m ' + obj.sec + ' s ';
    }
    obj.stopCallTimmer = function(){
      clearInterval(obj.calltimmer);
    }
    obj.showTime = function(){
      return obj.hour + ' h ' + obj.mint + ' m ' + obj.sec + ' s ';
    }
    obj.reset = function(){
      obj.sec  = 0;
      obj.mint = 0;
      obj.hour = 0;
    }
    return obj;
  }
  
  
  