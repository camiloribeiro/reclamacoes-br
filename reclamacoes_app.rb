class ReclamacoesApp < Sinatra::Base
  configure do
    set :views, Proc.new { File.join(root, "app/views") }
    MongoMapper.setup({'development' => {'uri' => 'mongodb://chiconato:chiconato@ds045637.mongolab.com:45637/reclamacoes'}}, 'development')
  end

  get '/' do
    erb :home
  end
  
  get '/empresas' do
    erb :"empresa/index"
  end

  get '/empresa/:cnpj' do
    @reclamacoes = Reclamacao.where('empresa.cnpj' => params[:cnpj])
    erb :"empresa/show"
  end
end