var app = angular.module('ws-chat', [
    'ngMaterial',
    'ngWebSocket',

]);

app.controller('mainController', ['$scope', 'websocket', function($scope, websocket) {
    $scope.messages = [];
    $scope.users = {};

    $scope.isOpen = false;

      $scope.demo = {
        isOpen: false,
        count: 0,
        selectedDirection: 'left'
      };

    $scope.registerUser = function() {
        if($scope.name) {
            websocket.send({
                type: 'NEW_USER',
                name: $scope.name
            }).then(
                function(success) {
                    $scope.isRegistered = true;
                }
            );
        }
    }

    $scope.sendMessage = function() {
        if($scope.message) {
            websocket.send({
                type: 'CHAT',
                data: $scope.message
            }).then(
                function(success) {
                    $scope.message = "";
                }
            );
        }
    }

    $scope.uploadImage = function(file) {
        if(file) {
            websocket.send({
                type: 'IMAGE',
                data: file
            }).then(
                function(success) {
                    $scope.message = "";
                }
            );
        }
    }

    $scope.$on('NEW_CONNECTION', function(event) {
        $scope.isRegistered = false;
        $scope.messages = [];
    });

    $scope.$on('CONNECTION_CLOSED', function(event, data) {
        $scope.isRegistered = false;
        $scope.messages = [{
            timestamp: new Date(),
            sender: 'SYSTEM',
            data: 'CONNECTION_CLOSED:' + data
        }];
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

    $scope.$on('IMAGE', function(event, data) {
        $scope.users[data.sender] = data;
    });

    websocket.init().then(
        function(success) {
            if (success.type == "EXISTING_CONNECTION") {
                $scope.name = success.data.name;
                $scope.isRegistered = true;
            } else {
                $scope.isRegistered = false;
            }
            $scope.initiated = true;
        }, function(error) {
            console.log(error);
        }
    );
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

app.directive('fileInput', function() {
    return {
        restrict: 'EA',
        scope: {
            onChange: '='
        },
        templateUrl: 'input-file.html',
        link: function(scope, element, attrs) {
            element.find('label')[0].className += " " + element[0].className;
            element[0].className = "";

            element.on('change', change);

            scope.$on('destroy', function () {
                element.off('change', change);
            });

            var reader = new FileReader();

            reader.onload = function (e) {
                scope.onChange(e.target.result);
                scope.$apply(function () {
                    scope.image = e.target.result;
                });
            }

            function change() {
                reader.readAsDataURL(element.find('input')[0].files[0]);
            }
        }
    }
});

app.factory('websocket', ['$rootScope', '$http', '$location', '$q', '$websocket', function($rootScope, $http, $location, $q, $websocket) {

    var ws = null;;

    function init() {
        return $q(function(resolve, reject) {
            $http.get('session').then(
                function(success) {
                    // Open a WebSocket connection
                    ws = $websocket('ws://' + $location.$$host + ':' + $location.$$port + success.data.path + success.data.ws);

                    ws.onClose(function(event) {
                        if(!event.wasClean) {
                            setTimeout(function(){
                                init();
                            }, 5000);
                        } else {
                            $rootScope.$broadcast("CONNECTION_CLOSED", event.reason);
                        }
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

                }, function(error) {
                    setTimeout(function(){init()}, 5000);
                }
            );
        })
    }

    function send(message) {
        return $q(function(resolve, reject) {
            ws.send(message).then(
                function(success) {
                    resolve();
                },
                function(error) {
                    reject();
                }
            )
        })
    }


    return {
        init: init,
        send: send
    }
}]);
