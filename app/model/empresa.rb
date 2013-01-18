class Empresa
  include MongoMapper::EmbeddedDocument
  
  key :cnpj, String
  key :cnpj_raiz, String
  key :cnae_codigo, Integer
  key :cnae_descricao, String
  key :nome_fantasia, String
  key :razao_social, String

  def self.by_cnpj(cnpj)
    if cnpj.size == 14
      return reduce Reclamacao.where('empresa.cnpj' => cnpj)
    elsif cnpj.size == 8
      return reduce Reclamacao.where('empresa.cnpj_raiz' => cnpj)
    else
      return reduce Reclamacao.where('empresa.cnpj' => Regexp.new(cnpj))
    end
  end

  def self.reduce(reclamacoes)
   reclamacoes.map{|r| r.empresa }.uniq
  end
  
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
