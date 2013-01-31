require 'mongo_mapper'

require './app/model/consumidor'
require './app/model/empresa'
require './app/model/empresa_stats'
require './app/model/reclamacao'

namespace :data do
  desc "Group companies by CNPJ/Nome Fantasia"
  task :generate_groups do
    raise Exception, "ENV[MONGODB_URI] not defined" unless ENV['MONGODB_URI']
    MongoMapper.setup({ 'production' => { 'uri' => ENV['MONGODB_URI']}}, 'production')

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
    groups.flatten.each do |emp|
      emp.save
    end

  end

  desc "Map reduce jobs to aggregate data"
  task :generate_stats do
    raise Exception, "ENV[MONGODB_URI] not defined" unless ENV['MONGODB_URI']
    MongoMapper.setup({ 'production' => { 'uri' => ENV['MONGODB_URI']}}, 'production')
    
    puts "generating empresa_stats..."
    EmpresaStats.build
  end
end
