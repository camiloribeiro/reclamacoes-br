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
  one :empresa
  
  def atendida?
    atendida == 'S'
  end
end
