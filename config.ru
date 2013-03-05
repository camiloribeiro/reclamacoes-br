require 'rubygems'
require 'bundler'

Bundler.require
Dir["./app/model/*.rb"].each {|file| require file }

ENV['MONGODB_URI'] = 'mongodb://localhost:27017/dev' unless ENV['MONGODB_URI']
require './reclamacoes_app'

run ReclamacoesApp
