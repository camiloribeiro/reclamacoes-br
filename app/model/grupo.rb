class Grupo
  include MongoMapper::Document
  set_collection_name :grupo

	key :name, String
  key :total_empresas, Integer

  def self.build
    Grupo.collection.remove

  	(1..19611).each do |group_id|
    	empresas = Empresa.where(:group_id => group_id).all
    	next if empresas.empty?

    	nomes_fantasia = empresas.map {|empresa| empresa.nome_fantasia}
    	group_name = most_frequent(nomes_fantasia)
    	
    	if(group_name == 'NULL')
    		razoes_sociais = empresas.map {|empresa| empresa.razao_social}
    		group_name = most_frequent(razoes_sociais)
    	end
    	
    	Grupo.create(:id => group_id, :name => group_name, :total_empresas => empresas.size)
    	puts "grupo: #{group_id} => #{empresas.size} empresas | #{group_name}"
  	end
  end

  private
  def self.most_frequent(collection)
  	freq = collection.inject(Hash.new(0)) { |h,v| h[v] += 1; h }
		collection.sort_by { |v| freq[v] }.last
  end
end