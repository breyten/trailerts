#!/usr/bin/env ruby

require 'rubygems'
require 'bundler'
require 'json'

require 'sinatra'
require 'httparty'

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
