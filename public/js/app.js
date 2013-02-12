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
    data.addColumn('string', 'link');

    for (var i=0; i<10; i++) { 
      var url = '#/analiseGrupo/'+$scope.empresas[i].id;
      data.addRow([$scope.empresas[i].value.name, $scope.empresas[i].value.total, url]); 
    }

    var view = new google.visualization.DataView(data);
    view.setColumns([0, 1]);

    // Set chart options
    var options = {'title':'Ranking empresas com mais reclamações',
                   'width':800,
                   'height':600,
                   'allowHtml':true};

    // Instantiate and draw our chart, passing in some options.
    var chart = new google.visualization.BarChart(document.getElementById('chart_div'));

    //draw the view because the link must be hidden
    chart.draw(view, options);

    google.visualization.events.addListener(chart, 'select', selectHandler); 
    function selectHandler(e) {   
      window.location = data.getValue(chart.getSelection()[0].row, 2);
    }
  });
}

function AnaliseGrupoCtrl($scope, $routeParams, $http) {
  $scope.grupo = {};
  $scope.empresas = [];

  $http.get('/analiseGrupo/'+$routeParams.id).success(function(data) {
    $scope.grupo = data;

    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Reclamações resolvidas');
    data.addColumn('number', 'Número atendimentos');
    
    var total = $scope.grupo.value.total;
    var sim = $scope.grupo.value.atendida;
    var nao = total - $scope.grupo.value.atendida;

    data.addRow(['Solucionados', sim]); 
    data.addRow(['Não Solucionados', nao]); 

    var options = {'title': $scope.grupo.value.name + ' - Índice de solução dos atendimentos',
                   'width':640,
                   'height':480};

    var chart = new google.visualization.PieChart(document.getElementById('chart_div'));
    chart.draw(data, options);
      
    $http.get('/grupoEmpresas/'+$scope.grupo.id).success(function(data) {
      $scope.empresas = data;

    });
  });
}

var app = angular.module('reclamacoesapp', []).
  config(['$routeProvider', function($routeProvider) {
  $routeProvider.
    when('/', {templateUrl: 'views/map.html'}).
    when('/empresas', {templateUrl: 'views/empresa/list.html', controller: EmpresaListCtrl}).
    when('/empresas/:cnpj', {templateUrl: 'views/empresa/detail.html', controller: EmpresaDetailCtrl}).
    when('/analise', {templateUrl: 'views/analise.html', controller: AnaliseCtrl}).
    when('/analiseGrupo/:id', {templateUrl: 'views/analiseGrupo.html', controller: AnaliseGrupoCtrl}).
    otherwise({redirectTo: '/'});
}]);

