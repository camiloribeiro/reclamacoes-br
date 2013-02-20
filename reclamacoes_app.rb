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

  get '/groups/:id/empresas' do
    Empresa.by_group(params[:id].to_i).to_json
  end

  get '/groups/:id/reclamacoes' do
    #Empresa.reclamacoes_by_group(params[:id].to_i).to_json
    TopProblems.where('_id._id' => params[:id].to_i).sort(:'value.total'.desc).limit(5).to_json
  end

  get '/groups/:id/:ano' do
    EmpresaStats.where('_id.grupo' => params[:id].to_i, '_id.ano'=> params[:ano].to_i).first.to_json
  end
  
  get '/reclamacoes/:empresa' do
    empresa = Empresa.find(params[:empresa])
    reclamacoes = Reclamacao.by_empresa(params[:empresa])
    json = { :empresa => empresa, :reclamacoes => reclamacoes}.to_json
  end

  get '/estados/stats' do
    stats = EstadoStats.sort(:_id).all.to_json
  end

  get '/reclamantes/genero' do
    ReclamantesGenero.all().to_json
  end

  get '/reclamantes/idade' do
    ReclamantesIdade.sort(:'value.total'.desc).all.to_json
  end
end
