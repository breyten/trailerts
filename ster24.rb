#!/usr/bin/env ruby

require 'rubygems'
require 'bundler'
require 'json'

require 'sinatra'
require 'httparty'
require 'mysql2'

set :session_secret, ENV["SESSION_KEY"] || 'too secret'

enable :sessions

# Usage: partial :foo
helpers do
  def partial(page, options={})
    erb page, options.merge!(:layout => false)
  end
end


get '/' do
  erb :index
end

get '/random' do
  response.headers['Content-type'] = "application/json"
  
  client = Mysql2::Client.new(
    :host => "localhost", :username => "spots", :password => "spots", :database => "sterspot"
  )
  client.query("SELECT * FROM spots ORDER BY RAND() LIMIT 1").first.to_json
end