class ReclamacoesApp < Sinatra::Base
  configure do
    set :views, Proc.new { File.join(root, "app/views") }
    MongoMapper.setup({'development' => {'uri' => 'mongodb://localhost:27017/dev'}}, 'development')
  end

  get '/' do
    erb :home
  end
  
  get '/empresa/:cnpj' do
    @reclamacoes = Reclamacao.where('empresa.cnpj' => params[:cnpj])
    erb :empresa
  end
end
