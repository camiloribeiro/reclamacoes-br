'use strict';

function EmpresaSearchController($scope, $http, $location) {
  $scope.typeaheadValue = '';
  $scope.typeahead = [];
  $scope.empresas = [];
  
  $scope.$watch('typeaheadValue',function(newVal, oldVal) {
    $http.get('/empresas_busca?nome_fantasia='+newVal).success(function(json) {
      $scope.empresas = json;

      var names = _.map(json, function(empresa){ return empresa.name;});
      $scope.typeahead = names;
    });
  });

  $scope.loadGroup = function() {
    var group = _.find($scope.empresas, function(empresa){ return empresa.name == $scope.typeaheadValue });
    group && $location.path('grupos/' + group.id + '/2011');
  };
};


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

function AnaliseCtrl($scope, $routeParams, $http) {
  $scope.empresas = [];
  $scope.ano = $routeParams.ano;

  $http.get('/empresas/stats/' + $routeParams.ano).success(function(data) {
    $scope.empresas = data;

    var chartService = ChartService();
    chartService.addColumns(['string', 'Empresas'],['number', 'Reclamações']);

    var empresas = {};
    for (var i=0; i<10; i++) { 
      var url = '#/grupos/' + $scope.empresas[i].id.grupo + '/' + $scope.ano;
      chartService.addRow([$scope.empresas[i].value.name, $scope.empresas[i].value.total]); 
      empresas[$scope.empresas[i].value.name] = url;
    }

    chartService.drawBarChart('chart_div', options('Ranking empresas com mais reclamações', 1200, 600, {textStyle: {color: 'blue'}}));

    $('text').each(function(i, el) {
      if (empresas[el.textContent]) {
        var a = document.createElementNS("http://www.w3.org/2000/svg", "a")
        a.setAttributeNS("http://www.w3.org/1999/xlink", "href", empresas[el.textContent]);

        var parent = el.parentNode;
        parent.replaceChild(a, el);
        a.appendChild(el);
      }
    });
  });

  $http.get('/reclamantes/genero/' + $scope.ano).success(function(data) {
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

  $http.get('/reclamantes/idade/' + $scope.ano).success(function(data) {
    $scope.reclamantes_idade = SortByFaixaEtaria(data);

    var chartService = ChartService();
    chartService.addColumns(['string', 'Idade'], ['number', 'Número de reclamações']);

    _.each($scope.reclamantes_idade, function(reclamante) { chartService.addRow([reclamante.id.idade, reclamante.value.total]) });

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

    var reclamacoes_url = '/groups/' + $scope.grupo.id.grupo + '/' + $routeParams.ano + '/reclamacoes';
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
  createSpinner();

  $http.get('/reclamacoes/' + $routeParams.cnpj + '/' + $routeParams.ano).success(function(data) {
    $scope.reclamacoes = data.reclamacoes;
    $scope.empresa = data.empresa;
    $scope.ano = $routeParams.ano;

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

var options = function(title, width, height, style) {
  return {
      title: title, 
      width: width || 640, 
      height: height || 480, 
      allowHtml: true,
      vAxis: style,
  };
}

function SortDesc(obj) {
  var sortable = [ ];
  for (var key in obj) {
    sortable.push([key, obj[key]]);
  }

  return sortable.sort(function(a, b) {return b[1] - a[1]}).slice(0,5);
}

function SortByFaixaEtaria(obj) {
  return obj.sort(function(a, b) {
   
    var idade = b.id.idade === null ? -1 : b.id.idade.match(/\W\d+\W/i);
    var otherIdade = a.id.idade === null ? -1 : a.id.idade.match(/\W\d+\W/i);
    
    return idade - otherIdade;
  });
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

var app = angular.module('reclamacoesapp', ['$strap.directives']).
  config(['$routeProvider', function($routeProvider) {
  $routeProvider.
    when('/', {templateUrl: 'views/map.html', controller: MapController}).
    when('/empresas', {templateUrl: 'views/empresa/list.html', controller: EmpresaListCtrl}).
    when('/empresas/:cnpj/:ano', {templateUrl: 'views/empresa/detail.html', controller: EmpresaDetailCtrl}).
    when('/grupos/:id/:ano', {templateUrl: 'views/grupo/detail.html', controller: GrupoDetailCtrl}).
    when('/analise/:ano', {templateUrl: 'views/analise.html', controller: AnaliseCtrl}).
    otherwise({redirectTo: '/'});
}]);

app.directive('typeAheadSelected', function() {
  return function(scope, elm, attrs) {
    elm.bind("change", function() {
      scope.$apply(attrs.typeAheadSelected);
    });
  };
});

function findTotalByIdOn(argument, array) { 
  return _.find(array, function(e) { return e.id.sexo === argument}).value.total; 
}

app.run(function($location, $rootScope) {
  $rootScope.getClass = function(ano) {
    if ($location.path().indexOf(ano) !== -1) {
      return "selected";
    }
  }
});
