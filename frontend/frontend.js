var app = angular.module('skull', [
    'ngMaterial',
    'ngWebSocket',

]);

app.controller('mainController', ['$scope', 'websocket', function($scope, websocket) {
    $scope.messages = [];

    $scope.registerUser = function() {
        $scope.isRegistered = true;
        websocket.send({
            type: 'NEW_USER',
            name: $scope.name
        });
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

    $scope.$on('NEW_CONNECTION', function(event) {
        $scope.isRegistered = false;
    });

    $scope.$on('CONNECTION_ERROR', function(event) {
        $scope.isRegistered = false;
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

    websocket.init().then(function(success) {
        if (success.type == "EXISTING_CONNECTION" && success.data.name) {
            $scope.name = success.data.name;
            $scope.isRegistered = true;
        } else {
            $scope.isRegistered = false;
        }
    }, function(error) {
        console.log(error);
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

app.factory('websocket', ['$rootScope', '$http', '$location', '$q', '$websocket', function($rootScope, $http, $location, $q, $websocket) {

    var ws = null;;

    function init() {
        return $q(function(resolve, reject) {
            $http.get('session').then(
                function(response) {
                    // Open a WebSocket connection
                    ws = $websocket('ws://' + $location.$$host + ':' + response.data.port + '/' + response.data.path + '/' + response.data.ws);

                    ws.onClose(function(event) {
                        if(!event.wasClean) {
                            setTimeout(function(){init()}, 5000);
                        };
                    });

                    ws.onMessage(function(message) {
                        var data = JSON.parse(message.data);
                        if(data.type == "NEW_CONNECTION" || data.type == "EXISTING_CONNECTION") {
                            resolve(data);
                            $rootScope.$broadcast(data.type, data);
                        } else {
                            $rootScope.$broadcast(data.type, data);
                        }
                    });

                }, function(response) {
                    setTimeout(function(){init()}, 5000);
                }
            );
        })
    }

    function send(message) {
        ws.send(message);
    }

    return {
        init: init,
        send: send
    }
}]);
