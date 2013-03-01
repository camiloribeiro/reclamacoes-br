require 'mongo_mapper'

Dir["./app/model/*.rb"].each {|file| require file }

namespace :data do
  desc "Generates file with companies group ids by CNPJ/Nome Fantasia"
  task :generate_groups do
    connect_to_mongo

    puts "generating company group_id"
    all = Empresa.fields(:nome_fantasia, :cnpj_raiz, :cnpj, :razao_social).sort(:cnpj_raiz).limit(1000).all
    puts "#{all.size} entries found..."

    start = Time.now

    all.each do |empresa|
      empresa.cnpj_raiz = empresa.cnpj_raiz.to_sym
      empresa.razao_social = remove_suffixes(empresa.razao_social)
      empresa.nome_fantasia = empresa.nome_fantasia=='NULL' ? empresa.razao_social : remove_suffixes(empresa.nome_fantasia)
    end

    puts "#{Time.now - start} - limpando nomes"

    i=0
    group_id = 1
    groups = []
    all.each do |empresa|
      puts "#{i}/#{all.size} - #{groups.size}"
      i+=1
      match = false

      groups.each do |group|
        group.each do |other|
          if empresa.similar_to(other)
            empresa.group_id = other.group_id
            group << empresa
            match = true
            break
          end
        end
        break if match
      end
      
      unless match #new group
        empresa.group_id = group_id
        group_id += 1
        groups << [empresa]
      end
    end

    puts "#{Time.now - start} - finished"

    puts "#{groups.count{ |g| g.size > 1} } groups with more than one company"

    puts "Total groups found: #{groups.size}. Saving data now..."
    file = File.open('empresas_groups.csv', 'w')
    groups.flatten.each do |emp|
      file.puts "#{emp.cnpj}, #{emp.group_id}"
    end
    file.close
    puts "saved file empresas_groups.csv"
  end

  desc "Map reduce jobs to aggregate data"
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

  desc "Generate groups names"
  task :generate_groups_names do
    connect_to_mongo
    puts "generating group names..."
    Grupo.build
  end

  def remove_suffixes(string)
    string.gsub(/( S.?A\.*| LTDA.?( ?-? ?ME.?)?(-?EPP)?| -?EPP)/, '')
  end

  def connect_to_mongo
    raise Exception, "ENV[MONGODB_URI] not defined" unless ENV['MONGODB_URI']
    MongoMapper.setup({ 'production' => { 'uri' => ENV['MONGODB_URI']}}, 'production')
  end
end
