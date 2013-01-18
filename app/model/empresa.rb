class Empresa
  include MongoMapper::EmbeddedDocument
  
  key :cnpj, String
  key :cnpj_raiz, String
  key :cnae_codigo, Integer
  key :cnae_descricao, String
  key :nome_fantasia, String
  key :razao_social, String

  def hash
    cnpj_raiz.hash
  end
  
  def eql?(other)
    self == other
  end
  
  def ==(other)
    self.cnpj_raiz == other.cnpj_raiz
  end
end
