require 'mongo_mapper'

require './app/model/consumidor'
require './app/model/empresa'
require './app/model/empresa_stats'
require './app/model/reclamacao'

namespace :data do
  desc "Run map reduce jobs to generate data"
  task :generate do
    raise Exception, "ENV[MONGODB_URI] not defined" unless ENV['MONGODB_URI']
    MongoMapper.setup({ 'production' => { 'uri' => ENV['MONGODB_URI']}}, 'production')

    puts "generating empresa_stats..."
    EmpresaStats.build
  end
end
