class Grupo
  include MongoMapper::Document
  set_collection_name :grupo

	key :name, String
  key :total_empresas, Integer
end
