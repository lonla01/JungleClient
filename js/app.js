// MODULE
var jungleApp = angular.module('jungleApp', ['ngResource', 'ngRoute']);

jungleApp.config(function ($routeProvider) {
    
    $routeProvider
    
        .when('/', {
            templateUrl : 'pages/main.html',
            controller: 'MainCtrl'
        })

        .when('/second', {
            templateUrl: 'pages/second.html',
            controller: 'SecondCtrl'
        })
    
        .when('/second/:carType', {
            templateUrl: 'pages/second.html',
            controller: 'SecondCtrl'
        })
    
        .when('/details/:id', {
            templateUrl: 'pages/details.html',
            controller: 'DetailCtrl'
        })
    
});

// CONTROLLERS
jungleApp.controller('MainCtrl', ['$scope', function ($scope) {
    $scope.pageName = 'Main';
}]);

jungleApp.controller('SecondCtrl', ['$scope', '$routeParams', 'CarTypeService', 'ListingFactory', function ($scope, $routeParams, CarTypeService, ListingFactory) {
    $scope.pageName = 'Second';
    if ( CarTypeService.carType !== $routeParams.carType) {
        CarTypeService.carType = $routeParams.carType;
        ListingFactory.resetListings();
    }
    
    console.log('SecondCtrl/' + $routeParams.carType );
}]);

jungleApp.controller('DetailCtrl', ['$scope', '$routeParams', 'ListingFactory', '$log', function ($scope, $routeParams, ListingFactory, $log) {
    
    $scope.pageName = $routeParams.id;
    $scope.listing = ListingFactory.getListingById($routeParams.id);
    $scope.theMsg = {}
    $log.debug("Listing: " + $scope.listing);
    
    $scope.sendMessage = function () {
        $log.info("The message is:");  
        $log.info($scope.theMsg);  
        ListingFactory.postMessage($scope.theMsg);
        alert( "Message sent successfully !" );
        $scope.theMsg = {};
    }
    
}]);

jungleApp.controller('ListingCtrl', ['$scope', '$log', 'ListingFactory', function ($scope, $log, ListingFactory) {
    
    $scope.listings = ListingFactory.getListings()
        .then(function (data) {
            $scope.listings = data;
            $log.info("Got [" + $scope.listings.length + "] listings ");
            $log.info( data[0] );
            ListingFactory.createListingIndex();
        }, function (msg) {
            $log.error(msg);
        });
    
    
}]);

jungleApp.service('CarTypeService', function () {
    
    this.carType = "suvs";
    this.carListURL = function () {
        return "http://localhost:8080/JungleCarsWEB/rest/" + this.carType;
    }
    
});

jungleApp.factory('ListingFactory', ['$log', '$http', '$q', 'CarTypeService', function ($log, $http, $q, CarTypeService) {
    
    var factory = {
        listings : false,
        idToListing : false,
        getListings : function () {         
            var deferred = $q.defer();
            if (factory.listings !== false) {
                $log.info( "No Fetching listings " );
                deferred.resolve(factory.listings);
            } else {
                $log.info( "Fetching listings from: " + CarTypeService.carListURL() );
                $http.get(CarTypeService.carListURL())
                    .success(function (data, status) {
                        factory.listings = data;
                        deferred.resolve(factory.listings);
                    }).error(function (data, status) {
                        $log.error( "Bad data: " + data );
                        deferred.reject("Couldn't get listings form server");
                    });
            }
                
            return deferred.promise;
        },
        
        getListingById : function (id) {
                var result = factory.idToListing[id];
                $log.info("result:" + result + " id:" + id);
                
                return result;
        },
        
        createListingIndex : function () {
            if (factory.idToListing === false) {
                factory.idToListing = {};
                var flistings = factory.getListings()
                    .then(function (data) {
                        $log.info("data:" + data.length );
                        angular.forEach( data, function(value, key) {
                            //$log.info("Key:" + key + " value:" + value.stringGID);
                            factory.idToListing[value.stringGID] = value; 
                        });
                    }, function (msg) {
                        $log.error(msg);
                    });                
            }
        },
        
        resetListings : function () {
            factory.listings = false;
            factory.idToListing = false;
        },
        
        postMessage : function (aMessage) {  
            
            var postURL = "http://localhost:8080/JungleCarsWEB/rest/msg";
            
            $log.info( "Posting Msg to: " + postURL );
            $http.post(postURL, aMessage)
                .then(function (data) {
                    $log.info("Post result is:");
                    $log.info(data);
                }, function (msg) {
                    $log.error(msg);
                });
                
        }
    };
    
    return factory;
}]);


