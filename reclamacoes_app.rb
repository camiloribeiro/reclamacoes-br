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

  get '/analiseGrupo/:id' do
    EmpresaStats.find(params[:id].to_i).to_json
  end

  get '/empresas/:cnpj' do
    empresa = Empresa.find(params[:cnpj])
    empresa.to_json(:methods => [:group, :stats])
  end
  
  get '/grupoEmpresas/:group' do
    Empresa.by_group(params[:group].to_i).to_json
  end

  get '/reclamacoes/:group' do
    Empresa.reclamacoes_by_group(params[:group].to_i).to_json
  end

end
