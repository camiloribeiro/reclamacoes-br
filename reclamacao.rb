class Reclamacao
  include MongoMapper::Document
  set_collection_name :reclamacoes

  key :ano, Integer
  key :nome_fantasia, String
  key :razao_social, String
 end

