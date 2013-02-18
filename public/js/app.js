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

function AnaliseCtrl($scope, $http) {
  $scope.empresas = [];

  $http.get('/empresas/stats').success(function(data) {
    $scope.empresas = data;

    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Empresas');
    data.addColumn('number', 'Reclamações');
    data.addColumn('string', 'link');

    for (var i=0; i<10; i++) { 
      var url = '#/grupos/' + $scope.empresas[i].id;
      data.addRow([$scope.empresas[i].value.name, $scope.empresas[i].value.total, url]); 
    }

    var view = new google.visualization.DataView(data);
    view.setColumns([0, 1]);

    // Instantiate and draw our chart, passing in some options.
    var chart = new google.visualization.BarChart(document.getElementById('chart_div'));

    //draw the view because the link must be hidden
    chart.draw(view, options('Ranking empresas com mais reclamações', 800, 600));

    google.visualization.events.addListener(chart, 'select', selectHandler); 
    function selectHandler(e) {   
      window.location = data.getValue(chart.getSelection()[0].row, 2);
    }
  });
}

function GrupoDetailCtrl($scope, $routeParams, $http) {
  createSpinner();
  $scope.loaded = false;
  $scope.grupo = {};
  $scope.empresas = [];

  $http.get('/groups/' + $routeParams.id).success(function(data) {
    $scope.grupo = data;

    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Reclamações resolvidas');
    data.addColumn('number', 'Número atendimentos');
    
    var total = $scope.grupo.value.total;
    var sim = $scope.grupo.value.atendida;
    var nao = total - $scope.grupo.value.atendida;

    data.addRow(['Solucionados', sim]); 
    data.addRow(['Não Solucionados', nao]);

    var chart = new google.visualization.PieChart(document.getElementById('chart_div'));
    chart.draw(data, options('Índice de solução dos atendimentos'));
      
    var url_grupo = '/groups/' + $scope.grupo.id + '/empresas';
    $http.get(url_grupo).success(function(data) {
      $scope.empresas = data;

      var reclamacoes_url = '/groups/' + $scope.grupo.id + '/reclamacoes';
      $http.get(reclamacoes_url).success(function(data) {
        $scope.reclamacoes = data;

        var data = new google.visualization.DataTable();
        data.addColumn('string', 'Tipos de reclamacão');
        data.addColumn('number', 'Número reclamações');
        
        for (var key in $scope.reclamacoes) {
            data.addRow([key, parseInt($scope.reclamacoes[key])]); 
        }

        var chart = new google.visualization.PieChart(document.getElementById('chart_tipo_reclamacoes'));
        chart.draw(data, options('Problemas mais reclamados'));
      });
    });
  });
}

function EmpresaDetailCtrl($scope, $routeParams, $http) {
  createSpinner();
  var url_empresa = '/empresas/' + $routeParams.cnpj;
  var url_reclamacoes = url_empresa + '/reclamacoes';

  $http.get(url_empresa).success(function(data){
    $scope.empresa = data;
  });

  $http.get(url_reclamacoes).success(function(data) {
    $scope.reclamacoes = data;

    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Tipos de reclamacão');
    data.addColumn('number', 'Número reclamações');

    for (var key in $scope.reclamacoes) {
      data.addRow([key, parseInt($scope.reclamacoes[key])]); 
    }

    var chart = new google.visualization.PieChart(document.getElementById('chart_tipo_reclamacoes'));
    chart.draw(data, options('Problemas mais reclamados'));
  });
}

var options = function(title, width, height) {
  return {
      title: title, 
      width: width || 640, 
      height: height || 480, 
      allowHtml: true
  };
}

var createSpinner = function() {
  var opts = {
    lines: 9, // The number of lines to draw
    length: 10, // The length of each line
    width: 8, // The line thickness
    radius: 17, // The radius of the inner circle
    corners: 1, // Corner roundness (0..1)
    rotate: 0, // The rotation offset
    color: '#000', // #rgb or #rrggbb
    speed: 1, // Rounds per second
    trail: 60, // Afterglow percentage
    shadow: false, // Whether to render a shadow
    hwaccel: false, // Whether to use hardware acceleration
    className: 'spinner', // The CSS class to assign to the spinner
    zIndex: 2e9, // The z-index (defaults to 2000000000)
    top: 'auto', // Top position relative to parent in px
    left: 'auto' // Left position relative to parent in px
  };
  var target = document.getElementById('spinner');
  var spinner = new Spinner(opts).spin(target);
}

var app = angular.module('reclamacoesapp', []).
  config(['$routeProvider', function($routeProvider) {
  $routeProvider.
    when('/', {templateUrl: 'views/map.html'}).
    when('/empresas', {templateUrl: 'views/empresa/list.html', controller: EmpresaListCtrl}).
    when('/empresas/:cnpj', {templateUrl: 'views/empresa/detail.html', controller: EmpresaDetailCtrl}).
    when('/grupos/:id', {templateUrl: 'views/grupo/detail.html', controller: GrupoDetailCtrl}).
    when('/analise', {templateUrl: 'views/analise.html', controller: AnaliseCtrl}).
    otherwise({redirectTo: '/'});
}]);
