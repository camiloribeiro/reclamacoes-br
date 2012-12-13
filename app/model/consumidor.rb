class Consumidor
  include MongoMapper::EmbeddedDocument

  key :cep, String
  key :faixa_etaria, String
  key :sexo, String
end
