'use strict';

function EmpresaListCtrl($scope, $http){
  $scope.empresas = [];
  $scope.cnpj = $scope.nome_fantasia = '';
                                                                                          
  $scope.get_name = function(empresa) {                                                   
    return empresa.nome_fantasia != 'NULL' ? empresa.nome_fantasia : empresa.razao_social 
  }

  $scope.fetch = function() {
    if(!$scope.cnpj && !$scope.nome_fantasia) {
      $scope.empresas = [];                                                               
      return;
    }                                                                                     
    var url = '/empresas_busca?cnpj='+$scope.cnpj+'&nome_fantasia='+$scope.nome_fantasia; 
    $http.get(url).success(function(data){                                                
      $scope.empresas = data;
    });
  }
}

function EmpresaDetailCtrl($scope, $routeParams, $http) {
  $http.get('/empresas/'+$routeParams.cnpj).success(function(data) {
    $scope.empresas = data;
  });
}

function AnaliseCtrl($scope, $http) {
  $scope.empresas = [];

  $http.get('/analise').success(function(data) {
    $scope.empresas = data;

    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Empresas');
    data.addColumn('number', 'Reclamações');

    for (var i=0; i<10; i++) { 
      data.addRow([$scope.empresas[i].value.name, $scope.empresas[i].value.total]); 
    }

    // Set chart options
    var options = {'title':'Ranking empresas com mais reclamações',
                   'width':800,
                   'height':600};

    // Instantiate and draw our chart, passing in some options.
    var chart = new google.visualization.BarChart(document.getElementById('chart_div'));
    chart.draw(data, options);
  });
}

var app = angular.module('reclamacoesapp', []).
  config(['$routeProvider', function($routeProvider) {
  $routeProvider.
    when('/', {templateUrl: 'views/map.html'}).
    when('/empresas', {templateUrl: 'views/empresa/list.html', controller: EmpresaListCtrl}).
    when('/empresas/:cnpj', {templateUrl: 'views/empresa/detail.html', controller: EmpresaDetailCtrl}).
    when('/analise', {templateUrl: 'views/analise.html', controller: AnaliseCtrl}).
    otherwise({redirectTo: '/'});
}]);

