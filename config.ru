require 'rubygems'
require 'bundler'

Bundler.require

require './app/model/reclamacao'
require './app/model/consumidor'
require './app/model/empresa' 
require './app/model/empresa_stats'
require './app/model/top_problems'

ENV['MONGODB_URI'] = 'mongodb://localhost:27017/dev' unless ENV['MONGODB_URI']

require './reclamacoes_app'
run ReclamacoesApp
