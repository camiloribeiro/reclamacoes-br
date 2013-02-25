class ReclamacoesApp < Sinatra::Base
  use Rack::Cache

  configure do
    set :views, Proc.new { File.join(root, "public/views") }
    MongoMapper.setup({'production' => {'uri' => ENV['MONGODB_URI']}}, 'production')
  end

  get '/' do
    erb :index
  end
  
  get '/empresas_busca' do
    cache_control :public, :max_age => 36000
    nome_fantasia = params[:nome_fantasia].upcase
    #Empresa.where(:nome_fantasia => Regexp.new('^' + nome_fantasia)).limit(5).to_json
    Group.where(:name => Regexp.new('^' + nome_fantasia)).limit(5).to_json
  end

  get '/empresas/stats/:ano' do
    cache_control :public, :max_age => 36000
    EmpresaStats.where('_id.ano' => params[:ano].to_i).sort(:'value.total'.desc).limit(20).all.to_json
  end

  get '/empresas/:cnpj' do
    Empresa.find(params[:cnpj]).to_json
  end

  get '/empresas/:cnpj/reclamacoes' do
    Reclamacao.by_empresas(params[:cnpj]).to_json
  end

  get '/empresas/:cnpj/reclamacoes/:ano' do
    empresa = Empresa.find(params[:cnpj])
    reclamacoes = Reclamacao.by_empresa_and_ano(params[:cnpj], params[:ano].to_i)
    json = { :empresa => empresa, :reclamacoes => reclamacoes}.to_json
  end

  get '/grupos/:id/empresas' do
    cache_control :public, :max_age => 36000
    Empresa.by_group(params[:id].to_i).to_json
  end

  get '/grupos/:id/:ano/reclamacoes' do
    cache_control :public, :max_age => 36000
    TopProblems.where('_id.grupo' => params[:id].to_i, '_id.ano' => params[:ano].to_i).sort(:'value.total'.desc).limit(5).to_json
  end

  get '/grupos/:id/:ano' do
    cache_control :public, :max_age => 36000
    EmpresaStats.where('_id.grupo' => params[:id].to_i, '_id.ano'=> params[:ano].to_i).first.to_json
  end

  get '/estados/stats' do
    cache_control :public, :max_age => 36000
    stats = EstadoStats.sort(:_id).all.to_json
  end

  get '/reclamantes/genero/:ano' do
    cache_control :public, :max_age => 36000
    ReclamantesGenero.where('_id.ano' => params[:ano].to_i).to_json
  end

  get '/reclamantes/idade/:ano' do
    cache_control :public, :max_age => 36000
    ReclamantesIdade.where('_id.ano' => params[:ano].to_i).to_json
  end
end
