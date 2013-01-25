class EmpresaStats
  include MongoMapper::Document
  set_collection_name :empresa_stats
  
  def self.map
    <<-MAP
    function() {
      emit(this.empresa_id.slice(0,8), {total: 1, atendida: (this.atendida=='S'?1:0)});
    }
    MAP
  end
  
  def self.reduce
    <<-REDUCE
    function(key, values) { 
      var result = {total: 0, atendida: 0};
      values.forEach(function(doc){ 
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
