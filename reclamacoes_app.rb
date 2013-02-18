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

  get '/empresas/stats' do
    EmpresaStats.sort(:'value.total'.desc).limit(20).all.to_json
  end

  get '/empresas/:cnpj' do
    Empresa.find(params[:cnpj]).to_json
  end

  get '/empresas/:cnpj/reclamacoes' do
    Reclamacao.by_empresas(params[:cnpj]).to_json
  end

  get '/groups/:id' do
    EmpresaStats.find(params[:id].to_i).to_json
  end

  get '/groups/:id/empresas' do
    Empresa.by_group(params[:id].to_i).to_json
  end

  get '/groups/:id/reclamacoes' do
    Empresa.reclamacoes_by_group(params[:id].to_i).to_json
  end
end