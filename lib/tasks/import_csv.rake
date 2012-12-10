require 'net/http'

namespace :data do
  task :import do
    puts "Iniciando download..."
    Net::HTTP.start('dados.gov.br') do |http| 
      ['2009', '2010', '2011'].each do |year|
        puts "Importando dados de #{year}..."

        response = http.get("/wp/wp-content/uploads/2012/11/reclamacoes-fundamentadas-sindec-#{year}.csv");
        open("dataset/reclamacoes-#{year}.csv", 'wb') do |file|
          file.write response.body
        end
      end
    end
    puts "Download completo"
  end
end
