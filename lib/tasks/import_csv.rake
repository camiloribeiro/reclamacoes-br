require 'csv'
require 'mongo_mapper'
Dir["./app/model/*.rb"].each {|file| require file }

namespace :data do
  desc "passo 1 - importacao dos dados dos arquivos CSVs para o mongodb"
  task :import do
    connect_to_mongo

    failed_rows = []

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
          failed_rows << row
          puts "ERROR importing row data: '#{row}' ===> #{e.message} "
        end
      end
    end
    
    puts "#{failed_rows.size} failed rows. generating failed_rows.csv file"
    file = File.open('failed_rows.csv', 'w') 
    failed_rows.each do |row|
      file.puts row
    end
    file.close

    Empresa.ensure_index :cnpj
    Empresa.ensure_index :cnpj_raiz
  end

  desc "passo 3 - importacao dos dados de agrupamento para o mongodb"
  task :import_groups do
    connect_to_mongo
    
    puts "atualizando agrupamento das empresas"
    total = 0

    CSV.foreach("db/empresas_grupo.csv") do |row|
      cnpj, group_id, razao, nome = row

      empresa = Empresa.find(cnpj)
      empresa.group_id = group_id
      empresa.save

      total += 1
      puts total
    end
    
    puts "importando Grupos..."
    Grupo.collection.remove
    CSV.foreach("db/grupos.csv") do |row|
      id, nome, total_empresas = row
      Grupo.create(:id => id.to_i, :name => nome, :total_empresas => total_empresas)
    end
  
    Grupo.ensure_index :name
  end

  def connect_to_mongo
    raise Exception, "ENV[MONGODB_URI] not defined" unless ENV['MONGODB_URI']
    MongoMapper.setup({ 'production' => { 'uri' => ENV['MONGODB_URI']}}, 'production')
  end
end
