class ReclamacoesApp < Sinatra::Base
  configure do
    set :views, Proc.new { File.join(root, "app/views") }
    MongoMapper.setup({'development' => {'uri' => 'mongodb://chiconato:chiconato@ds045637.mongolab.com:45637/reclamacoes'}}, 'development')
  end

  get '/' do
    erb :home
  end
  
  get '/empresas' do
    @empresas = params[:cnpj] ? Reclamacao.where('empresa.cnpj' => Regexp.new(params[:cnpj])).map{ |r| r.empresa }.uniq : []
    erb :"empresa/index"
  end

  get '/empresa/:cnpj' do
    @reclamacoes = Reclamacao.where('empresa.cnpj' => params[:cnpj])
    erb :"empresa/show"
  end
end
