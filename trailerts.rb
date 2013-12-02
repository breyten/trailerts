#!/usr/bin/env ruby

require 'rubygems'
require 'bundler'
require 'json'

require 'sinatra'
require 'httparty'
require 'mysql2'
require 'inifile'
require 'themoviedb'

set :session_secret, ENV["SESSION_KEY"] || 'too secret'

enable :sessions

not_found do
  'This is nowhere to be found.'
end

def get_config
  IniFile.load('trailerts.ini')
end

# Usage: partial :foo
helpers do
  def partial(page, options={})
    erb page, options.merge!(:layout => false)
  end
end


get '/' do
  @slug = nil
  @config = get_config

  erb :index
end

get '/random' do
  response.headers['Content-type'] = "application/json"
  
  @config = get_config
  @tmdb = Tmdb::Api.key(@config['themoviedb']['key'])
  record = Tmdb::Movie.now_playing.sample
  record.to_json
end

get '/random/:slug' do
  response.headers['Content-type'] = "application/json"

  @config = get_config

  {}.to_json
end

get '/:slug' do
  @slug = params[:slug]
  @config = get_config

  raise Sinatra::NotFound, 'Channel does not exist yet.' unless @config.has_section?(@slug)

  erb :index
end
