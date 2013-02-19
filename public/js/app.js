'use strict';

function MapController($scope, $http) {
  $http.get('/estados/stats').success(function(data){
    $scope.colors =
    {
      AC: '#eeeeee',
      AL: '#eeeeee',
      AM: '#eeeeee',
      AP: '#eeeeee',
      BA: '#eeeeee',
      CE: '#eeeeee',
      DF: '#eeeeee',
      ES: '#eeeeee',
      GO: '#eeeeee',
      MA: '#eeeeee',
      MG: '#eeeeee',
      MS: '#eeeeee',
      MT: '#eeeeee',
      PA: '#eeeeee',
      PB: '#eeeeee',
      PE: '#eeeeee',
      PI: '#eeeeee',
      PR: '#eeeeee',
      RJ: '#eeeeee',
      RN: '#eeeeee',
      RO: '#eeeeee',
      RR: '#eeeeee',
      RS: '#eeeeee',
      SC: '#eeeeee',
      SE: '#eeeeee',
      SP: '#eeeeee',
      TO: '#eeeeee'
    };

    data.forEach(function(estado) {
      var total = estado.value.total;
      var color;
      if(total >= 20000)
        color = '#003300';
      else if(total >= 15000)
        color = '#009933';
      else if(total >= 10000)
        color = '#33CC33';
      else if(total >= 5000)
        color = '#66FF66';
      else 
        color =  '#CCFFCC';

      $scope.colors[estado.id] = color;
    });

  });
}

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

    $http.get('/reclamantes/genero').success(function(data) {
      $scope.reclamantes_genero = data;

      var data = new google.visualization.DataTable();
      data.addColumn('string', 'Sexo');
      data.addColumn('number', 'Total');

      var total = 0;
      var homens = 0;
      var mulheres = 0;
      for (var i = 0; i < $scope.reclamantes_genero.length; i++) {
        var genero = $scope.reclamantes_genero[i];
        total += genero.value.total;
        if (genero.id._id === "M") {
          homens = genero.value.total;
        }
        if (genero.id._id === "F") {
          mulheres = genero.value.total;
        }
      }

      data.addRow(['Homens', homens]); 
      data.addRow(['Mulheres', mulheres]);
      data.addRow(['Não responderam', (total - (homens + mulheres))]);

      var chart = new google.visualization.PieChart(document.getElementById('chart_genero'));
      chart.draw(data, options());

      $http.get('/reclamantes/idade').success(function(data) {
        $scope.reclamantes_idade = data;

        var data = new google.visualization.DataTable();
        data.addColumn('string', 'Idade');
        data.addColumn('number', 'Número de pessoas');

        for (var i = 0; i < $scope.reclamantes_idade.length; i++) {
          var reclamante = $scope.reclamantes_idade[i];
          if (reclamante.id.hasOwnProperty('_id')) {
            data.addRow([reclamante.id._id, reclamante.value.total]); 
          }
        }

        var chart = new google.visualization.BarChart(document.getElementById('chart_idade'));
        chart.draw(data, options('Faixa etária dos reclamantes'));
      });
    });
  });
}

function GrupoDetailCtrl($scope, $routeParams, $http) {
  createSpinner();
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
        
        for (var i = 0; i < $scope.reclamacoes.length; i++) {
            data.addRow([$scope.reclamacoes[i].id.problema, $scope.reclamacoes[i].value.total]); 
        }

        var chart = new google.visualization.PieChart(document.getElementById('chart_tipo_reclamacoes'));
        chart.draw(data, options('Problemas mais reclamados'));
      });
    });
  });
}

function EmpresaDetailCtrl($scope, $routeParams, $http) {
  //createSpinner();

  $http.get('/reclamacoes/' + $routeParams.cnpj).success(function(data) {
    $scope.reclamacoes = data.reclamacoes;
    $scope.empresa = data.empresa;

    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Reclamações resolvidas');
    data.addColumn('number', 'Número atendimentos');

    var sim = 0;
    for (var i = 0; i < $scope.reclamacoes.length; i++) {
      if ($scope.reclamacoes[i].atendida === 'S') {
        sim += 1;
      }
    }

    var total = $scope.reclamacoes.length;
    var nao = total - sim;

    data.addRow(['Solucionados', sim]); 
    data.addRow(['Não Solucionados', nao]); 

    var chart = new google.visualization.PieChart(document.getElementById('chart_div'));
    chart.draw(data, options('Índice de solução dos atendimentos'));

    data = new google.visualization.DataTable();
    data.addColumn('string', 'Tipos de reclamacão');
    data.addColumn('number', 'Número reclamações');

    var reclamacoesGrouped = GroupBy($scope.reclamacoes, "problema");
    reclamacoesGrouped = SortDesc(reclamacoesGrouped);

    for (var i = 0; i < reclamacoesGrouped.length; i++) {
      data.addRow([reclamacoesGrouped[i][0], reclamacoesGrouped[i][1]]); 
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

function SortDesc(obj) {
  var sortable = [ ];
  for (var key in obj) {
    sortable.push([key, obj[key]]);
  }

  return sortable.sort(function(a, b) {return b[1] - a[1]}).slice(0,5);
}

function GroupBy(myjson, attr) {
  var sum ={};

  myjson.forEach( function(obj) {
    if ( typeof sum[obj[attr]] == 'undefined') {
      sum[obj[attr]] = 1;
    } else {
      sum[obj[attr]]++;
    } 
  });
  return sum;
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
    when('/', {templateUrl: 'views/map.html', controller: MapController}).
    when('/empresas', {templateUrl: 'views/empresa/list.html', controller: EmpresaListCtrl}).
    when('/empresas/:cnpj', {templateUrl: 'views/empresa/detail.html', controller: EmpresaDetailCtrl}).
    when('/grupos/:id', {templateUrl: 'views/grupo/detail.html', controller: GrupoDetailCtrl}).
    when('/analise', {templateUrl: 'views/analise.html', controller: AnaliseCtrl}).
    otherwise({redirectTo: '/'});
}]);
