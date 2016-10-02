var app = angular.module('skull', [
    'ngMaterial',
    'ngWebSocket'
]);

app.controller('mainController', ['$scope', '$location', 'websocket', function($scope, $location, websocket) {

    $scope.messages = [];

    $scope.registerUser = function() {
        websocket.init($location.$$host, $location.$$port);
        $scope.isRegistered = true;
    }

    $scope.sendMessage = function() {
        if($scope.message) {
            websocket.send({
                type: 'CHAT',
                data: $scope.message
            });
            $scope.message = "";
        }
    }

    $scope.$on('open', function(event) {
        websocket.send({
            type: 'NEW_USER',
            name: $scope.name
        });
    });

    $scope.$on('CHAT', function(event, data) {
        $scope.messages.push(data);
    });

    $scope.$on('NEW_USER', function(event, data) {
        $scope.messages.push(data);
    });

    $scope.$on('HISTORY', function(event, data) {
        $scope.messages = data.data.messages;
    });
}]);

app.directive('ngEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.keyCode === 13 && !event.shiftKey) {
                scope.$apply(function (){
                    scope.$eval(attrs.ngEnter);
                });
                event.preventDefault();
            }
        });
    };
});

app.directive('ngBlurOnEnter', function() {
  return function(scope, element, attrs) {
      element.bind("keydown keypress", function (event) {
          if(event.keyCode === 13 && !event.shiftKey) {
              element[0].blur();
          }
      });
  };
});

app.directive('ngFocusOn', function() {
    return {
        scope: {
            focusVariable: "=ngFocusOn"
        },
        link: function($scope, $element, attrs) {
            $scope.$watch("focusVariable", function() {
                $element[0].focus();
            })
        }
    }
});

app.factory('websocket', ['$rootScope', '$websocket', function($rootScope, $websocket) {

    var ws = null;;

    function init(hostname, port) {
        // Open a WebSocket connection
        ws = $websocket('ws://'+hostname+':'+port);

        ws.onOpen(function(event) {
            $rootScope.$broadcast(event.type, event);
        });

        ws.onClose(function(event) {
            if(!event.wasClean) {
                setTimeout(function(){init(hostname, port)}, 5000);
            };
        });

        ws.onMessage(function(message) {
            var data = JSON.parse(message.data);
            $rootScope.$broadcast(data.type, data);
        });
    }

    function send(message) {
        ws.send(message);
    }

    return {
        init: init,
        send: send
    };
}]);
