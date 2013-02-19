require 'mongo_mapper'

Dir["./app/model/*.rb"].each {|file| require file }

namespace :data do
  desc "Generates file with companies group ids by CNPJ/Nome Fantasia"
  task :generate_groups do
    connect_to_mongo

    puts "generating company group_id"
    all = Empresa.all
    puts "#{all.size} entries found..."

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
          break if match
        end
      end
      
      unless match #new group
        empresa.group_id = group_id
        group_id += 1
        groups << [empresa]
      end
    end

    puts "Total groups found: #{groups.size}. Saving data now..."
    file = File.open('empresas_groups.csv', 'w')
    groups.flatten.each do |emp|
      file.puts "#{emp.cnpj}, #{emp.group_id}"
      #emp.save
    end
    file.close
    puts "saved file empresas_groups.csv"
  end

  desc "Map reduce jobs to aggregate company data"
  task :generate_empresa_stats do
    connect_to_mongo
    
    puts "generating empresa_stats..."
    EmpresaStats.build
  end

  desc "Map reduce jobs to group reclamacoes by problema"
  task :generate_problemas do
    connect_to_mongo
    
    puts "generating problemas..."
    TopProblems.build
  end

  desc "Map reduce to group reclamacoes by estado"
  task :generate_estado_stats do
    connect_to_mongo
    
    puts "generating problemas..."
    EstadoStats.build
  end

  desc "Map reduce jobs to group reclamantes by genero"
  task :generate_reclamantes_genero do
    connect_to_mongo
    
    puts "generating reclamantes by genero..."
    ReclamantesGenero.build
  end

  def connect_to_mongo
    raise Exception, "ENV[MONGODB_URI] not defined" unless ENV['MONGODB_URI']
    MongoMapper.setup({ 'production' => { 'uri' => ENV['MONGODB_URI']}}, 'production')
  end
end
