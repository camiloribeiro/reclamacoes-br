# encoding: UTF-8
require 'mongo_mapper'

Dir["./app/model/*.rb"].each {|file| require file }

namespace :data do
  desc "passo 2 - geracao de agrupamentos de empresas"
  task :generate_groups do
    connect_to_mongo

    puts "gerando grupos..."
    all = Empresa.fields(:nome_fantasia, :cnpj_raiz, :cnpj, :razao_social).sort(:cnpj_raiz).all

    puts "#{all.size} empresas encontradas..."
    start = Time.now

    synonyms = {
      "CLARO" => ["CELL CLARO", "CELL CLARO CORPORATE", "CELLSHOPP-CLARO", "CENTER CELL - CLARO", "LOUREIRO & ALMEIDAAGENTE AUTORIZADO CLARO", "NEXCOM", "NEXCOM CLARO"],
      "BANCO ITAU" => ["BANCO ITAU.*", "ITAU.*", "CIA ITAÚLEASING.*", "UNICARD.*"],
      "BRADESCO" => ["BANCO BRADESCO .*", "BRADESCO .*"],
      "OI" => ["OI FIXO", "OI CELULAR"],
      "LG" => ["LG ELECTRONICS DA AMAZONIA LTDA.", "LG ELETRONICS"],
      "PONTO FRIO" => ["PONTO FRIO .*"],
      "SAMSUNG" => ["SAMSUNG CUSTOMER SERVICE", "SAMSUNG DO BRASIL"],
      "SKY" => ["DIRECTV", "SKY DIRECTV"],
      "TIM" => ["TIM CELULAR", "TIM MAIS", "TIM NORDESTE", "TIM SUL", "TIM MANIA", "CELULAR MANIA"],
      "VIVO" => ["VIVO MATRIZ"]
    }

    all.each do |empresa|
      nome_fantasia = empresa.nome_fantasia == 'NULL' ? empresa.razao_social : empresa.nome_fantasia
      synonyms.keys.each do |name|
        synonyms[name].each do |syn|
          nome_fantasia = name if nome_fantasia.match(syn)
        end
      end
      
      empresa.cnpj_raiz = empresa.cnpj_raiz.to_sym
      empresa.nome_fantasia = remove_suffixes(nome_fantasia)
      empresa.razao_social = remove_suffixes(empresa.razao_social)
    end

    puts "#{Time.now - start} - limpando nomes"
    
    by_cnpj = all.group_by {|e| e.cnpj_raiz}.values
    by_razao = by_cnpj.group_by{|g| most_frequent(g.map{|e| e.razao_social}) }.values.map{|a| a.flatten}
    by_nome = by_razao.group_by{|g| most_frequent(g.map{|e| e.nome_fantasia})}

    groups = by_nome

    puts "#{Time.now - start} - terminou"
    puts "Grupos encontrados: #{groups.size} | Grupos com mais de uma empresa: #{groups.values.count{ |g| g.flatten.size > 1} }"
    puts "Gerando arquivos de grupos..."
      
    e_grupos_file = File.open('db/empresas_grupo.csv', 'w')
    grupos_file     = File.open('db/grupos.csv', 'w')
    
    id = 1
    groups.each do |grupo|
      nome = grupo[0]
      empresas = grupo[1].flatten

      grupos_file.puts "#{id},#{nome},#{empresas.size}"
      empresas.each do |e|
        e_grupos_file.puts "#{e.cnpj},#{id},#{e.razao_social},#{e.nome_fantasia}"
      end
      id += 1
    end
    e_grupos_file.close
    grupos_file.close

    puts "arquivo salvo com sucesso: db/empresas_grupo.csv"
    puts "arquivo salvo com sucesso: db/grupos.csv"
  end

  desc "passo 4 - map reduces para agregar dados"
  task :generate_stats do
    connect_to_mongo
    
    puts "generating grupo stats..."
    GrupoStats.build

    puts "generating top problems..."
    TopProblems.build

    puts "generating estado stats..."
    EstadoStats.build

    puts "generating reclamantes by genero..."
    ReclamantesGenero.build

    puts "generating reclamantes by idade..."
    ReclamantesIdade.build
  end

  def remove_suffixes(string)
    string.gsub(/( S.?A\.*| LTDA.?( ?-? ?ME.?)?(-?EPP)?| -?EPP|\")/, '')
  end

  def self.most_frequent(collection)
  	freq = collection.inject(Hash.new(0)) { |h,v| h[v] += 1; h }
		collection.sort_by { |v| freq[v] }.last
  end

  def connect_to_mongo
    raise Exception, "ENV[MONGODB_URI] not defined" unless ENV['MONGODB_URI']
    MongoMapper.setup({ 'production' => { 'uri' => ENV['MONGODB_URI']}}, 'production')
  end
end
