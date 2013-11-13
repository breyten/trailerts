#!/usr/bin/env ruby

require 'rubygems'
require 'bundler'
require 'json'

require 'sinatra'
require 'httparty'
require 'mysql2'
require 'inifile'

set :session_secret, ENV["SESSION_KEY"] || 'too secret'

enable :sessions

not_found do
  'This is nowhere to be found.'
end

def get_config
  IniFile.load('ster24.ini')
end

def random_record(config, channel = nil)
  client = Mysql2::Client.new(
    :host => "localhost", :username => "spots", :password => "spots", :database => "sterspot"
  )

  if channel.nil?
    client.query("SELECT * FROM spots ORDER BY RAND() LIMIT 1").first
  elsif config.has_section?(channel)
    field_name = config[channel]['field']
    choices = config[channel]['choices']
    client.query(
      "SELECT * FROM spots WHERE %s IN (%s) ORDER BY RAND() LIMIT 1" % [field_name, choices]
    ).first
  else
    raise Sinatra::NotFound, 'Channel does not exist yet.'
  end
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
  record = random_record(@config)
  record.to_json
end

get '/random/:slug' do
  response.headers['Content-type'] = "application/json"

  @config = get_config
  record = random_record(@config, @params[:slug])
  record.to_json  
end

get '/:slug' do
  @slug = params[:slug]
  @config = get_config

  raise Sinatra::NotFound, 'Channel does not exist yet.' unless @config.has_section?(@slug)

  erb :index
end
