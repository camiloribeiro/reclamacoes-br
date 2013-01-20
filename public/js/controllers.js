function EmpresaListCtrl($scope, $http){
  $scope.empresas = [];

  $scope.get_name = function(empresa) {
    return empresa.nome_fantasia != 'NULL' ? empresa.nome_fantasia : empresa.razao_social
  }

  $scope.fetch = function() {
    if($scope.cnpj == '') {
      $scope.empresas = [];
      return;
    }
  
    $http.get('/empresas_busca?cnpj=' + $scope.cnpj).success(function(data){
      $scope.empresas = data;
    });
  }
}
