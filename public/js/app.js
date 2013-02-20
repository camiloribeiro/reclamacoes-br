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
      var url = '#/grupos/' + $scope.empresas[i].id.grupo + '/' + 2011;
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

  $http.get('/reclamantes/genero').success(function(data) {
    $scope.reclamantes_genero = data;

    var homens = findTotalByIdOn('M', $scope.reclamantes_genero);
    var mulheres = findTotalByIdOn('F', $scope.reclamantes_genero);
    var total = findTotalByIdOn('N', $scope.reclamantes_genero) + homens + mulheres;

    var chartService = ChartService();
    chartService.addColumns(['string', 'Sexo'], ['number', 'Total']);
    chartService.addRow(['Homens', homens]); 
    chartService.addRow(['Mulheres', mulheres]);
    chartService.addRow(['Não responderam', (total - (homens + mulheres))]);

    chartService.drawPieChart('chart_genero', options());
  });

  $http.get('/reclamantes/idade').success(function(data) {
    $scope.reclamantes_idade = data;

    var chartService = ChartService();
    chartService.addColumns(['string', 'Idade'], ['number', 'Número de pessoas']);

    _.each($scope.reclamantes_idade, function(reclamante) { chartService.addRow([reclamante.id, reclamante.value.total]) });

    chartService.drawBarChart('chart_idade', options('Faixa etária dos reclamantes'));
  });
}

function GrupoDetailCtrl($scope, $routeParams, $http) {
  createSpinner();

  $http.get('/groups/' + $routeParams.id + '/' + $routeParams.ano).success(function(data) {
    $scope.grupo = data;
    $scope.ano = $routeParams.ano;
    
    var total = $scope.grupo.value.total;
    var sim = $scope.grupo.value.atendida;
    var nao = total - $scope.grupo.value.atendida;

    var chartService = ChartService();
    chartService.addColumns(['string', 'Reclamações resolvidas'], ['number', 'Número atendimentos']);
    chartService.addRow(['Solucionados', sim]); 
    chartService.addRow(['Não Solucionados', nao]);

    chartService.drawPieChart('chart_div', options('Índice de solução dos atendimentos'));
      
    var url_grupo = '/groups/' + $scope.grupo.id.grupo + '/empresas';
    $http.get(url_grupo).success(function(data) {
      $scope.empresas = data;
    });

    var reclamacoes_url = '/groups/' + $scope.grupo.id.grupo + '/reclamacoes';
    $http.get(reclamacoes_url).success(function(data) {
      $scope.reclamacoes = data;

      var chartService = ChartService();
      chartService.addColumns(['string', 'Tipos de reclamacão'], ['number', 'Número reclamações']);
      _.each($scope.reclamacoes, function(reclamacao) { chartService.addRow([reclamacao.id.problema, reclamacao.value.total]) });

      chartService.drawPieChart('chart_tipo_reclamacoes', options('Problemas mais reclamados'));
    });
  });
}

function EmpresaDetailCtrl($scope, $routeParams, $http) {
  //createSpinner();

  $http.get('/reclamacoes/' + $routeParams.cnpj).success(function(data) {
    $scope.reclamacoes = data.reclamacoes;
    $scope.empresa = data.empresa;

    var sim = _.countBy($scope.reclamacoes, function(reclamacao) { return reclamacao.atendida === 'S'}).true;
    var total = $scope.reclamacoes.length;
    var nao = total - sim;

    var chartService = ChartService();
    chartService.addColumns(['string', 'Reclamações resolvidas'], ['number', 'Número atendimentos']);
    chartService.addRow(['Solucionados', sim]);
    chartService.addRow(['Não Solucionados', nao]);

    chartService.drawPieChart('chart_div', options('Índice de solução dos atendimentos'));

    var reclamacoesGrouped = GroupBy($scope.reclamacoes, "problema");
    reclamacoesGrouped = SortDesc(reclamacoesGrouped);

    chartService = ChartService();
    chartService.addColumns(['string', 'Tipos de reclamacão'], ['number', 'Número reclamações']);
    _.each(reclamacoesGrouped, function(reclamacao) { chartService.addRow([reclamacao[0], reclamacao[1]]) });

    chartService.drawPieChart('chart_tipo_reclamacoes', options('Problemas mais reclamados'));
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

var ChartService = function() {
  var data = new google.visualization.DataTable();

  var addColumns = function() {
    for (var i in arguments) {
      data.addColumn(arguments[i][0], arguments[i][1]);
    }
  };

  var addRow = function(row) {
    data.addRow(row); 
  }

  var drawPieChart = function(elementId, options) {
    var chart = new google.visualization.PieChart(document.getElementById(elementId));
    chart.draw(data, options);
  }

  var drawBarChart = function(elementId, options) {
    var chart = new google.visualization.BarChart(document.getElementById(elementId));
    chart.draw(data, options);
  }

  return {
    addColumns : addColumns,
    addRow : addRow,
    drawPieChart : drawPieChart,
    drawBarChart : drawBarChart
  };
};

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
    when('/grupos/:id/:ano', {templateUrl: 'views/grupo/detail.html', controller: GrupoDetailCtrl}).
    when('/analise', {templateUrl: 'views/analise.html', controller: AnaliseCtrl}).
    otherwise({redirectTo: '/'});
}]);

function findTotalByIdOn(argument, array) { 
  return _.find(array, function(e) { return e.id === argument}).value.total; 
}

app.run(function($location, $rootScope) {
  $rootScope.getClass = function(ano) {
    if ($location.path().indexOf(ano) !== -1) {
      return "selected";
    }
  }
});
