class Empresa
  include MongoMapper::EmbeddedDocument
  
  key :cnpj, String
  key :cnae_codigo, Integer
  key :cnae_descricao, String
  key :nome_fantasia, String
  key :razao_social, String
end
