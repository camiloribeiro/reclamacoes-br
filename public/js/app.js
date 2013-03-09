'use strict';

function EmpresaSearchController($scope, $http, $location) {
  $scope.typeaheadValue = '';
  $scope.typeahead = [];
  $scope.empresas = [];
  $scope.loading = false;
  
  $scope.$watch('typeaheadValue',function(newVal, oldVal) {
    $scope.loading = true;
    $http.get('/empresas_busca?nome_fantasia='+newVal).success(function(json) {
      $scope.empresas = json;

      var names = _.map(json, function(empresa){
        var total = empresa.total_empresas;
        return total > 1 ? empresa.name + ' (' + total + ' empresas)' : empresa.name;
      });
      $scope.typeahead = names;
      
      $scope.loading = false;
      setTimeout(function(){$('#typeaheadValue').trigger('keyup');}, 1); //GAMBIARRA
    });
  });

  $scope.loadGroup = function() {
    var group = _.find($scope.empresas, function(empresa) {
      var selected = $scope.typeaheadValue.replace(/\s\(.*\)/, '');
      return empresa.name == selected;
    });
    group && $location.path('grupos/' + group.id + '/2011');
  };
};


function MapController($scope, $http) {
  $http.get('/estados/stats').success(function(data){
    $scope.colors = {};

    data.forEach(function(estado) {
      var total = estado.value.total;
      var color;
      if(total >= 20000)
        color = 'muito-alto';
      else if(total >= 15000)
        color = 'alto';
      else if(total >= 10000)
        color = 'medio';
      else if(total >= 5000)
        color = 'baixo';
      else 
        color =  'muito-baixo';

      $scope.colors[estado.id] = color;
    });
  });
}

function AnaliseCtrl($scope, $routeParams, $http) {
  $scope.empresas = [];
  $scope.ano = $routeParams.ano;

  $http.get('/grupos/stats/' + $routeParams.ano).success(function(data) {
    $scope.empresas = data;

    var chartService = ChartService();
    chartService.addColumns(['string', 'Empresas'],['number', 'Reclamações']);

    var empresas = {};
    $($scope.empresas).each(function(index, empresa) {
      chartService.addRow([empresa.name, empresa.value.total]); 

      var url = '#/grupos/' + empresa.id.grupo;
      empresas[empresa.name] = url;
    });

    chartService.drawBarChart('chart_div', options('Ranking empresas com mais reclamações', 1200, 600, {textStyle: {color: 'blue'}}));

    //TODO: refatorar esse lixo
    $('text').each(function(i, el) {
      if (empresas[el.textContent]) {
        var a = document.createElementNS("http://www.w3.org/2000/svg", "a")
        a.setAttributeNS("http://www.w3.org/1999/xlink", "href", empresas[el.textContent]);

        var parent = el.parentNode;
        parent.replaceChild(a, el);
        a.appendChild(el);
      } else if (endsWith(el.textContent, '...')) {
        for (var key in empresas) {
          var shortName = el.textContent.substr(0, el.textContent.length - 3);
          if (key.indexOf(shortName) !== -1) {
            var a = document.createElementNS("http://www.w3.org/2000/svg", "a")
            a.setAttributeNS("http://www.w3.org/1999/xlink", "href", empresas[key]);

            var parent = el.parentNode;
            var rect = $(parent).children('rect')[0];

            parent.replaceChild(a, rect);
            a.appendChild(rect);
          }
        }
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

function GrupoListCtrl($scope) {

}

function GrupoDetailCtrl($scope, $routeParams, $http, $location) {
  var spinner = createSpinner();

  var optionalYearParameter = $routeParams.ano ? '/' + $routeParams.ano : '';
  $http.get('/grupos/' + $routeParams.id + optionalYearParameter).success(function(data) {
    $scope.grupo_info = data.grupo_info;
    $scope.ano = $routeParams.ano;
    $scope.grupo_id = $routeParams.id;
    var grupo_stats = data.grupo_stats;

    if($scope.grupo_info.total_empresas == 1) {
      $location.path('empresas/' + data.cnpj + '/2011');
    }
    
    if(grupo_stats) {
      $scope.total = grupo_stats.value.total;
      var sim = grupo_stats.value.atendida;
      var nao = $scope.total - sim;

      var chartService = ChartService();
      chartService.addColumns(['string', 'Reclamações resolvidas'], ['number', 'Número atendimentos']);
      chartService.addRow(['Solucionados', sim]); 
      chartService.addRow(['Não Solucionados', nao]);

      chartService.drawPieChart('chart_div', options('Índice de solução dos atendimentos'));
    } else {
      ChartService().drawEmptyPieChart('chart_div', 'Índice de solução dos atendimentos');
    }
      
    var url_grupo = '/grupos/' + $scope.grupo_id + '/empresas';
    $http.get(url_grupo).success(function(data) {
      $scope.empresas = data;
      setTimeout(dataTablePlugin);
    });

    var reclamacoes_url = '/grupos/' + $scope.grupo_id + optionalYearParameter + '/reclamacoes';
    $http.get(reclamacoes_url).success(function(data) {
      $scope.reclamacoes = data;

      if (data.length <= 0) { 
        ChartService().drawEmptyPieChart('chart_tipo_reclamacoes', 'Problemas mais reclamados');
        return;
      }

      var chartService = ChartService();
      chartService.addColumns(['string', 'Tipos de reclamacão'], ['number', 'Número reclamações']);
      _.each($scope.reclamacoes, function(reclamacao) { chartService.addRow([reclamacao.id.problema, reclamacao.value.total]) });

      chartService.drawPieChart('chart_tipo_reclamacoes', options('Problemas mais reclamados'));
    });
  });
}

function EmpresaDetailCtrl($scope, $routeParams, $http) {
  createSpinner();

  var optionalYearParameter = $routeParams.ano ? '/' + $routeParams.ano : '';
  var url_reclamacoes_empresa = '/empresas/' + $routeParams.cnpj + '/reclamacoes' + optionalYearParameter;

  $http.get(url_reclamacoes_empresa).success(function(data) {
    $scope.ano = $routeParams.ano;
    $scope.empresa = data.empresa;
    $scope.grupo = data.grupo;
    $scope.reclamacoes = data.reclamacoes;
    
    if (data.reclamacoes.length <= 0) { 
      ChartService().drawEmptyPieChart('chart_div', 'Índice de solução dos atendimentos');
      ChartService().drawEmptyPieChart('chart_tipo_reclamacoes', 'Problemas mais reclamados');
      return;
    }

    var sim = _.countBy($scope.reclamacoes, function(reclamacao) { return reclamacao.atendida === 'S'}).true || 0;
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
      width: width || 600, 
      height: height || 480, 
      allowHtml: true,
      vAxis: style,
      backgroundColor: '#f6f6f6'
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

  function drawEmptyPieChart(elementId, title) {
    var fakeData = google.visualization.arrayToDataTable([ ['string', 'nothing'], ['Dados indisponíveis', 1] ]);

    var options = {
      title: title, 
      width: 600, height:400,
      hAxis: {title: "Dados indisponíveis"},
      legend : {position: 'bottom'},
      colors: ['#FBEFEF'],
      pieSliceText: "none",
      tooltip : {trigger: 'none'},
      backgroundColor: '#f6f6f6'
    };

    var chart = new google.visualization.PieChart(document.getElementById(elementId));
    chart.draw(fakeData, options);
  }

  return {
    addColumns : addColumns,
    addRow : addRow,
    drawPieChart : drawPieChart,
    drawBarChart : drawBarChart,
    drawEmptyPieChart : drawEmptyPieChart
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
  return new Spinner(opts).spin(target);
}

var app = angular.module('reclamacoesapp', ['$strap.directives']).
  config(['$routeProvider', function($routeProvider) {
  $routeProvider.
    when('/', {templateUrl: 'views/map.html', controller: MapController}).
    when('/empresas/:cnpj', {templateUrl: 'views/empresa/detail.html', controller: EmpresaDetailCtrl}).
    when('/empresas/:cnpj/:ano', {templateUrl: 'views/empresa/detail.html', controller: EmpresaDetailCtrl}).
    when('/grupos', {templateUrl: 'views/grupo/list.html', controller: GrupoListCtrl}).
    when('/grupos/:id', {templateUrl: 'views/grupo/detail.html', controller: GrupoDetailCtrl}).
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

var dataTablePlugin = function() {
  $('#empresasTable').dataTable( {
    "sDom": "<'row'<'span6'l><'span6'f>r>t<'row'<'span6'i><'span6'p>>",
    "sPaginationType": "bootstrap",
    "bFilter" : true,
    "oLanguage": {
      "sProcessing":   "Processando...",
      "sLengthMenu":   "Mostrar _MENU_ registros",
      "sZeroRecords":  "Não foram encontrados resultados",
      "sInfo":         "Mostrando _START_ - _END_ de _TOTAL_ registros",
      "sInfoEmpty":    "Mostrando 0 registros",
      "sInfoFiltered": "(filtrado de _MAX_ registros no total)",
      "sInfoPostFix":  "",
      "sSearch":       "Filtrar:",
      "sUrl":          "",
      "oPaginate": {
        "sFirst":    "Primeiro",
        "sPrevious": "Anterior",
        "sNext":     "Próximo",
        "sLast":     "Último"
        }
      }
  });
  $('#empresasTable_length').css("display", "none")
}

function findTotalByIdOn(argument, array) { 
  return _.find(array, function(e) { return e.id.sexo === argument}).value.total;
}

function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

app.run(function($location, $rootScope) {
  $rootScope.getClass = function(ano) {
    if ($location.path().indexOf(ano) !== -1) {
      return "selected";
    }
  }

  $rootScope.getReclamacoesByYear = function(reclamacoes, ano) {
    if (ano) {
      return reclamacoes[ano];
    }

    var total = 0;
    _.each( reclamacoes, function(val) { total += val; })
    return total;
  }
});
