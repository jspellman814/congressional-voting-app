var scorecardApp = angular.module('scorecardApp', ['ngAnimate', 'angular-loading-bar']);
var key = apiKey;

scorecardApp.config(['cfpLoadingBarProvider', function (cfpLoadingBarProvider) {
    cfpLoadingBarProvider.includeSpinner = false;
}]);

// @todo: document
scorecardApp.factory('scorecardFactory', ['$http', '$q', function ($http, $q) {
    var fac = $q.defer();

    // @todo: the year in this url needs to be variable
    $http.get('/scorecard-2016.json')
        .then(function (result) {
            fac.resolve(result);
        });
    return fac.promise;
}]);

// @todo: document
scorecardApp.factory('billsFactory', ['$http', '$q', function ($http, $q) {
    var fac = $q.defer();

    // @todo: the year in this url needs to be variable
    $http.get('/bills-2016.json')
        .then(function (result) {
            fac.resolve(result);
        });
    return fac.promise;
}]);

// @todo: document
scorecardApp.controller('congressMemberController', ['$scope', '$http', '$q', 'scorecardFactory', function ($scope, $http, $q, scorecardFactory) {
    scorecardFactory.then(function (result) {
        $scope.scorecards = result.data.nodes;

        console.log($scope.scorecards);
        var sc_member_ids = [];
        // isolate member ids from scorecard.xml file
        angular.forEach($scope.scorecards, function (value) {
            sc_member_ids.push(value.node.member_id);
        });

        // filter API results using member_ids from scorecards
        $scope.filterValues = sc_member_ids;
        $scope.memberID = function (item) {
            return ($scope.filterValues.indexOf(item.id) !== -1);
        };

        $scope.members = [];

        var congressNumber = result.data.nodes[0].node.congress;
        var session = result.data.nodes[0].node.session;
        $q.all([
            $http.get('https://api.propublica.org/congress/' + session + '/' + congressNumber + '/house/members.json', {headers: {"X-API-Key": key}}),
            $http.get('https://api.propublica.org/congress/' + session + '/' + congressNumber + '/senate/members.json', {headers: {"X-API-Key": key}})
        ])
            .then(function (result) {
                // concat house & senate json objects
                /*$scope.members = result[0].data.results[0].members.concat(result[1].data.results[0].members);*/
                $scope.members = result[0].data.results[0].members;
            });
    });
}]);

// @todo: document
scorecardApp.controller('votesController', ['$scope', '$http', '$q', 'billsFactory', function ($scope, $http, $q, billsFactory) {
    billsFactory.then(function (result) {
        $scope.bills = result.data.nodes;

        // @todo: poor practice that this is in forEach loop?
        angular.forEach($scope.bills, function (value) {
            var congressNumber = value.node.congress;
            var session = value.node.session;
            var chamberUpper = value.node.chamber;
            var chamberLower = chamberUpper.toLowerCase();
            var rollCall = value.node.roll_call;
            $q.all([
                $http.get('https://api.propublica.org/congress/v1/' + congressNumber + '/' + chamberLower + '/sessions/' + session + '/votes/' + rollCall + '.json', {headers: {"X-API-Key": key}})
            ])
                .then(function (result) {
                    $scope.votes = result[0].data.results.votes.vote.positions;
                });
        });
    })
}]);