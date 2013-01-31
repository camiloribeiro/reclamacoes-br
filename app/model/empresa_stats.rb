class EmpresaStats
  include MongoMapper::Document
  set_collection_name :empresa_stats
  
  key :name, String
  key :total, Integer
  key :atendida, Integer
  
  def self.map
    <<-MAP
    function() {
      var empresa = db.empresas.findOne({_id: this.empresa_id});
      emit(empresa.group_id, {name: empresa.nome_fantasia, total: 1, atendida: (this.atendida=='S'?1:0)});
    }
    MAP
  end
  
  def self.reduce
    <<-REDUCE
    function(key, values) { 
      var result = {name: null, total: 0, atendida: 0};
      values.forEach(function(doc) {
        result.name = doc.name != 'NULL' ? doc.name : result.name;
        result.total += doc.total;
        result.atendida += doc.atendida;
      });
      return result;
    } 
    REDUCE
  end

  def self.build
    Reclamacao.collection.map_reduce(map, reduce, :out => 'empresa_stats')
  end
end
