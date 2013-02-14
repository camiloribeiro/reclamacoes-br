class Reclamacao
  include MongoMapper::Document
  set_collection_name :reclamacoes

  key :ano, Integer
  key :data_abertura, Time
  key :data_arquivamento, Time
  key :assunto, String
  key :problema, String
  key :atendida, String
  key :regiao, String
  key :uf, String

  one :consumidor

  belongs_to :empresa
  
  def atendida?
    atendida == 'S'
  end

  def self.by_empresas(empresas)
    Hash[Reclamacao.where(:empresa_id => empresas).fields(:problema, :assunto, :empresa_id).all.group_by { |r| r.problema}.map { |k,v| [k, v.size] }.sort_by{ |k,v| -v}.take(5)]
  end
end
