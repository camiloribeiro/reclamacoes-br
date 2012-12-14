require 'rubygems'
require 'bundler'

Bundler.require

require './app/model/reclamacao'
require './app/model/consumidor'
require './app/model/empresa' 


require './reclamacoes_app'
run ReclamacoesApp
