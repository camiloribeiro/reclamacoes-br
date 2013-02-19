class EstadoStats
  include MongoMapper::Document
  set_collection_name :estado_stats
  
  def self.map
    <<-MAP
    function() {
      emit(this.uf, {total: 1, atendida: (this.atendida=='S'?1:0)});
    }
    MAP
  end
  
  def self.reduce
    <<-REDUCE
    function(key, values) { 
      var result = {total: 0, atendida: 0};
      values.forEach(function(doc) {
        result.total += doc.total;
        result.atendida += doc.atendida;
      });
      return result;
    } 
    REDUCE
  end

  def self.build
    Reclamacao.collection.map_reduce(map, reduce, :out => 'estado_stats')
  end
end
