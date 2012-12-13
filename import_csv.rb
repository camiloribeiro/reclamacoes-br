require 'csv'
require 'mongo_mapper'

require './consumidor'
require './empresa'
require './reclamacao'

MongoMapper.setup({ 'development' => { 'uri' => 'mongodb://localhost:27017/test'}}, 'development')

CSV.foreach('dataset/reclamacoes-2011.csv', :col_sep => ";", encoding: "ISO8859-1") do |row| 
  next if row.first == 'anocalendario' # skipping CSV header

  row.each do |value|
    value.encode!('UTF-8') unless value.nil?
  end

  ano, arquivamento, abertura, codigo_regiao, regiao, uf, razao_social, 
  	nome_fantasia, tipo, cnpj, cnpj_rad, razao_social_RFB, nome_fantasia_RFB, 
  	cnae_principal, cnae_principal_desc, atendida, assunto_cd, assunto_desc,
  	problema_cd, problema_desc, sexo, faixa_etaria, cep  = row

  r = Reclamacao.create( 
    :ano => ano, 
    :data_abertura => DateTime.parse(abertura),
    :data_arquivamento => DateTime.parse(arquivamento),
    :assunto => assunto_desc,
    :problema => problema_desc,
    :atendida => atendida,
    :regiao => regiao,
    :uf => uf,
    :consumidor => Consumidor.new(
      :cep => cep,
      :faixa_etaria => faixa_etaria,
      :sexo => sexo
    ),
    :empresa => Empresa.new(
      :cnpj => cnpj,
      :cnae_codigo => cnae_principal,
      :cnae_descricao => cnae_principal_desc,
      :nome_fantasia => nome_fantasia, 
      :razao_social => razao_social,
    )
  )
  p r
end
