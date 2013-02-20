class ReclamantesIdade
  include MongoMapper::Document
  set_collection_name :reclamantes_idade
  
  key :idade, String
  key :total, Integer
  
  def self.map
    <<-MAP
    function() {
      emit({idade: this.consumidor.faixa_etaria, ano: this.ano}, {total: 1});
    }
    MAP
  end
  
  def self.reduce
    <<-REDUCE
    function(key, values) { 
      var result = {total: 0};
      values.forEach(function(doc) {
        result.total += doc.total;
      });
      return result;
    } 
    REDUCE
  end

  def self.build
    Reclamacao.collection.map_reduce(map, reduce, :out => 'reclamantes_idade')
  end
end
