class ReclamacoesApp < Sinatra::Base
  configure do
    set :views, Proc.new { File.join(root, "app/views") }
    MongoMapper.setup({'production' => {'uri' => ENV['MONGODB_URI']}}, 'production')
  end

  get '/' do
    erb :home
  end
  
  get '/empresas' do
    @empresas = params[:cnpj] ? Reclamacao.where('empresa.cnpj' => Regexp.new(params[:cnpj])).map{ |r| r.empresa }.uniq : []
    erb :"empresa/index"
  end

  get '/empresa/:cnpj' do
    raiz = params[:cnpj].slice(0, 8)
    @reclamacoes = Reclamacao.where('empresa.cnpj_raiz' => raiz)
    erb :"empresa/show"
  end
end
