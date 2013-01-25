class Empresa
  include MongoMapper::Document
  
  key :cnpj, String, :unique => true
  key :cnpj_raiz, String
  key :cnae_codigo, Integer
  key :cnae_descricao, String
  key :nome_fantasia, String
  key :razao_social, String
  
  many :reclamacao

  def self.by_cnpj(cnpj)
    if cnpj.size == 14
      reduce where(:cnpj => cnpj)
    elsif cnpj.size == 8
      reduce where(:cnpj_raiz => cnpj)
    else
      reduce where(:cnpj => Regexp.new('^' + cnpj))
    end
  end
  
  def self.by_nome_fantasia(nome_fantasia)
    reduce where(:nome_fantasia => Regexp.new('^' + nome_fantasia))
  end

  def self.search(cnpj, nome_fantasia)
    if(cnpj && nome_fantasia)
      reduce where(:cnpj => Regexp.new('^'+cnpj)).where(:nome_fantasia => Regexp.new('^' + nome_fantasia))
    elsif(cnpj)
      by_cnpj(cnpj)
    else
      by_nome_fantasia(nome_fantasia)
    end
  end

  def self.reduce(empresas)
   empresas.all.uniq
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
