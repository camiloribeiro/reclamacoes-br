class ReclamacoesApp < Sinatra::Base
  configure do
    set :views, Proc.new { File.join(root, "public/views") }
    MongoMapper.setup({'production' => {'uri' => ENV['MONGODB_URI']}}, 'production')
  end

  get '/' do
    erb :index
  end
  
  get '/empresas_busca' do
    cnpj = params[:cnpj] != '' ? params[:cnpj] : nil
    nome_fantasia = params[:nome_fantasia] != '' ? params[:nome_fantasia] : nil

    Empresa.search(cnpj, nome_fantasia).to_json
  end

  #get '/empresas/:cnpj' do
  #  raiz = params[:cnpj].slice(0, 8)
  #  @reclamacoes = Reclamacao.where('empresa.cnpj_raiz' => raiz)
  #  erb :"empresa/show"
  #end
end
