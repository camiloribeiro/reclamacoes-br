class TopProblems
  include MongoMapper::Document
  set_collection_name :top_problems
  
  key :problema, String
  key :total, Integer
  
  def self.map
    <<-MAP
    function() {
      var empresa = db.empresas.findOne({_id: this.empresa_id});
      emit({grupo: empresa.group_id, problema: this.problema, ano: this.ano}, {total: 1});
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
    Reclamacao.collection.map_reduce(map, reduce, :out => 'top_problems')
  end
end
