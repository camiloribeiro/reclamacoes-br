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

  get '/empresas/:group_id' do
    #empresa = Empresa.find(params[:cnpj])
    #empresa.to_json(:methods => [:group, :stats])
    EmpresaStats.find(params[:group_id].to_i).to_json
  end
  
  get '/empresas/:id/empresa' do
    Empresa.by_group(params[:group_id].to_i).to_json
  end

  get '/empresas/:group_id/group' do
    Empresa.by_group(params[:group_id].to_i).to_json
  end

  get '/empresas/:group_id/reclamacoes' do
    Empresa.reclamacoes_by_group(params[:group_id].to_i).to_json
  end
  
  get '/reclamacoes/:empresa' do
    Reclamacao.by_empresas(params[:empresa]).to_json
  end
end
