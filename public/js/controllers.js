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
