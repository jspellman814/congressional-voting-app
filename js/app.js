var scorecardApp = angular.module('scorecardApp', ['ngAnimate', 'angular-loading-bar']);
var key = apiKey;

// include angular-loading-bar
scorecardApp.config(['cfpLoadingBarProvider', function (cfpLoadingBarProvider) {
    cfpLoadingBarProvider.includeSpinner = false;
}]);

// get scorecard data from local json and store for later use in congressMemberController
scorecardApp.factory('scorecardFactory', ['$http', '$q', function ($http, $q) {
    // defer contains the promise to be returned
    var fac = $q.defer();

    // @todo: year needs to be variable
    $http.get('/scorecard-2016.json')
        .then(function (result) {
            // resolve (fulfill) promise
            fac.resolve(result);
        });
    // return promise
    return fac.promise;
}]);

// get bill data from local json and store for later use in votesController
scorecardApp.factory('billsFactory', ['$http', '$q', function ($http, $q) {
    // defer contains the promise to be returned
    var fac = $q.defer();

    // @todo: year needs to be variable
    $http.get('/bills-2016.json')
        .then(function (result) {
            // resolve (fulfill) promise
            fac.resolve(result);
        });
    // return promise
    return fac.promise;
}]);

// define member controller
scorecardApp.controller('congressMemberController', ['$scope', '$http', '$q', 'scorecardFactory', function ($scope, $http, $q, scorecardFactory) {
    // call promise from scorecardFactory
    scorecardFactory.then(function (result) {
        // define scorecard variable
        $scope.scorecards = result.data.nodes;

        // declare array which will contain member_ids
        var sc_member_ids = [];
        // isolate member_ids from $scope.scorecards
        // will use to filter API results
        angular.forEach($scope.scorecards, function (value) {
            // push ids to array
            sc_member_ids.push(value.node.member_id);
        });

        // filter API results using member_ids
        // only shows members whose id is contained in scorecard.json
        $scope.filterValues = sc_member_ids;
        $scope.memberID = function (item) {
            return ($scope.filterValues.indexOf(item.id) !== -1);
        };

        $scope.members = [];

        // get congress and session # from first node
        // assumes all members are in same congressional session
        // vars to build member request urls
        var congressNumber = result.data.nodes[0].node.congress;
        var session = result.data.nodes[0].node.session;
        $q.all([
            // get house/senate data from api
            $http.get('https://api.propublica.org/congress/' + session + '/' + congressNumber + '/house/members.json', {headers: {"X-API-Key": key}}),
            $http.get('https://api.propublica.org/congress/' + session + '/' + congressNumber + '/senate/members.json', {headers: {"X-API-Key": key}})
        ])
            .then(function (result) {
                // concat house & senate json objects, return members
                $scope.members = result[0].data.results[0].members;
            });
    });
}]);

// define votes controller
scorecardApp.controller('votesController', ['$scope', '$http', '$q', 'billsFactory', function ($scope, $http, $q, billsFactory) {
    // call promise from billsFactory
    billsFactory.then(function (result) {
        // define scorecard variable
        $scope.bills = result.data.nodes;

        // loop through each bill
        // @todo: poor practice that this is in forEach loop?
        angular.forEach($scope.bills, function (value) {
            // vars to build vote request urls
            var congressNumber = value.node.congress;
            var session = value.node.session;
            var chamberUpper = value.node.chamber;
            var chamberLower = chamberUpper.toLowerCase();
            var rollCall = value.node.roll_call;
            $q.all([
                // get vote data from api
                $http.get('https://api.propublica.org/congress/v1/' + congressNumber + '/' + chamberLower + '/sessions/' + session + '/votes/' + rollCall + '.json', {headers: {"X-API-Key": key}})
            ])
                .then(function (result) {
                    // return votes
                    $scope.votes = result[0].data.results.votes.vote.positions;
                });
        });
    })
}]);