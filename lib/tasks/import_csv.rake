require 'csv'
require 'mongo_mapper'

require './app/model/consumidor'
require './app/model/empresa'
require './app/model/reclamacao'

namespace :data do
  desc "Import data from the available CSVs to a local mongodb instance"
  task :import do
    raise Exception, "ENV[MONGODB_URI] not defined" unless ENV['MONGODB_URI']
    MongoMapper.setup({ 'production' => { 'uri' => ENV['MONGODB_URI']}}, 'production')

    csv_files = Dir.glob(File.join("dataset", "*.csv"))
    csv_files.each do |filename|
      puts "Importing data from #{filename}..."

      CSV.foreach(filename, :col_sep => ";", encoding: "ISO8859-1") do |row| 
        next if row.first == 'anocalendario' # skipping CSV header

        row.each do |value|
          value.encode!('UTF-8') unless value.nil?
        end

        ano, arquivamento, abertura, codigo_regiao, regiao, uf, razao_social, 
          nome_fantasia, tipo, cnpj, cnpj_rad, razao_social_RFB, nome_fantasia_RFB, 
          cnae_principal, cnae_principal_desc, atendida, assunto_cd, assunto_desc,
          problema_cd, problema_desc, sexo, faixa_etaria, cep  = row

        next if cnpj == 'NULL' # no company data
      
        begin
          empresa = Empresa.create(
              :_id => cnpj,
              :cnpj => cnpj,
              :cnpj_raiz => cnpj.slice(0, 8),
              :cnae_codigo => cnae_principal,
              :cnae_descricao => cnae_principal_desc,
              :nome_fantasia => nome_fantasia, 
              :razao_social => razao_social,
           )

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
            :empresa => empresa
          )
          print "."
        rescue Exception => e
          puts "ERROR importing row data: '#{row}' ===> #{e.message} "
        end
      end
    end

    Empresa.ensure_index :cnpj
    Empresa.ensure_index :cnpj_raiz
  end
end
