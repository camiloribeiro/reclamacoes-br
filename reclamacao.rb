class Reclamacao
  include MongoMapper::Document
  set_collection_name :reclamacoes

  key :ano, Integer
  key :data_abertura, DateTime
  key :data_arquivamento, DateTime
  key :nome_fantasia, String
  key :razao_social, String
  key :regiao, String
  key :uf, String
 end

