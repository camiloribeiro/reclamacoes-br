class GrupoStats
  include MongoMapper::Document
  set_collection_name :grupo_stats
  
  key :total, Integer
  key :atendida, Integer

  #verify why this generated more records
  #day = Date.UTC(this.data_arquivamento.getFullYear());
  #emit({_id: empresa.group_id, date: day}, {name: empresa.nome_fantasia, total: 1, atendida: (this.atendida=='S'?1:0)});
  #
  def self.map
    <<-MAP
    function() {
      var empresa = db.empresas.findOne({_id: this.empresa_id});
      emit({grupo: empresa.group_id, ano: this.ano}, {total: 1, atendida: (this.atendida=='S'?1:0)});
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

  def name
    Grupo.find(id['grupo']).name
  end

  def self.build
    GrupoStats.collection.remove
    Reclamacao.collection.map_reduce(map, reduce, :out => 'grupo_stats')
  end
end
