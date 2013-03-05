class ReclamacoesApp < Sinatra::Base
  use Rack::Cache

  configure do
    set :views, Proc.new { File.join(root, "public/views") }
    MongoMapper.setup({'production' => {'uri' => ENV['MONGODB_URI']}}, 'production')
  end

  configure :production do
    require 'newrelic_rpm'
  end

  get '/' do
    erb :index
  end
  
  get '/empresas_busca' do
    #cache_control :public, :max_age => 36000
    nome_fantasia = params[:nome_fantasia].upcase
    #Empresa.where(:nome_fantasia => Regexp.new('^' + nome_fantasia)).limit(5).to_json
    Grupo.where(:name => Regexp.new('^' + nome_fantasia)).limit(10).to_json
  end

  get '/grupos/stats/:ano' do
    cache_control :public, :max_age => 36000
    GrupoStats.where('_id.ano' => params[:ano].to_i).sort(:'value.total'.desc).limit(10).all.to_json(:methods => [:name])
  end

  get '/empresas/:cnpj' do
    Empresa.find(params[:cnpj]).to_json
  end

  get '/empresas/:cnpj/reclamacoes' do
    empresa = Empresa.find(params[:cnpj])
    reclamacoes = Reclamacao.where(:empresa_id => params[:cnpj]).fields(:problema, :ano, :assunto, :atendida, :empresa_id)
    
    { :empresa => empresa, :reclamacoes => reclamacoes}.to_json
  end

  get '/empresas/:cnpj/reclamacoes/:ano' do
    empresa = Empresa.find(params[:cnpj])
    reclamacoes = Reclamacao.by_empresa_and_ano(params[:cnpj], params[:ano].to_i)
    { :empresa => empresa, :reclamacoes => reclamacoes}.to_json
  end

  get '/grupos/:id/empresas' do
    cache_control :public, :max_age => 36000
    Empresa.by_group(params[:id].to_i).to_json
  end

  get '/grupos/:id/reclamacoes' do
    cache_control :public, :max_age => 36000
    problemas = TopProblems.where('_id.grupo' => params[:id].to_i).sort(:'value.total'.desc).group_by { |r| r['_id']['problema']}.map do |k, v|
      total = 0;
      v.each do |i|
        total += i['value']['total']
      end
      {id: {grupo: v[0]['_id']['grupo'], problema: v[0]['_id']['problema']}, value: {total: total}}
    end
    problemas.sort_by { |v| -v[:value][:total]}.take(5).to_json
  end

  get '/grupos/:id/:ano/reclamacoes' do
    cache_control :public, :max_age => 36000
    TopProblems.where('_id.grupo' => params[:id].to_i, '_id.ano' => params[:ano].to_i).sort(:'value.total'.desc).limit(5).to_json
  end

  get '/grupos/:id' do
    cache_control :public, :max_age => 36000
    group_id = params[:id].to_i
    
    total = 0
    atendida = 0
    id = 0
    stats = GrupoStats.where('_id.grupo' => group_id).all.each do |v|
      id = v['_id']['grupo']
      total += v['value']['total']
      atendida += v['value']['atendida']
    end

    stats = {id: {grupo: id}, value: {total: total, atendida: atendida}}

    grupo = Grupo.find(group_id)
    cnpj = Empresa.where(:group_id => group_id).first.cnpj if grupo.total_empresas == 1

    {:grupo_stats => stats, :grupo_info => grupo, :cnpj => cnpj}.to_json
  end

  get '/grupos/:id/:ano' do
    cache_control :public, :max_age => 36000
    group_id = params[:id].to_i
    
    stats = GrupoStats.where('_id.grupo' => group_id, '_id.ano'=> params[:ano].to_i).first
    grupo = Grupo.find(group_id)
    cnpj = Empresa.where(:group_id => group_id).first.cnpj if grupo.total_empresas == 1

    {:grupo_stats => stats, :grupo_info => grupo, :cnpj => cnpj}.to_json
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
