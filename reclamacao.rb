class Reclamacao
  include MongoMapper::Document
  set_collection_name :reclamacoes

  key :ano, Integer
  key :data_abertura, DateTime
  key :data_arquivamento, DateTime
  key :regiao, String
  key :uf, String

  one :consumidor
  one :empresa
end
