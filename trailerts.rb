#!/usr/bin/env ruby

require 'rubygems'
require 'bundler'
require 'json'

require 'sinatra'
require 'httparty'
require 'mysql2'
require 'inifile'
require 'themoviedb'
require 'redis'

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

get '/now_playing' do
  response.headers['Content-type'] = "application/json"
  
  @config = get_config
  
  redis = Redis.new

  cached_movies = redis['trailerts_now_playing']
  if cached_movies
    movies = JSON.parse(cached_movies)
  else
    @tmdb = Tmdb::Api.key(@config['themoviedb']['key'])
    movies = Tmdb::Movie.now_playing
    redis['trailerts_now_playing'] = movies.to_json
    redis.expire('trailerts_now_playing', 43200) # half a day
  end
  movie = movies.sample
  movie.to_json
end

get '/upcoming' do
  response.headers['Content-type'] = "application/json"
  
  @config = get_config
  
  redis = Redis.new

  cached_movies = redis['trailerts_upcoming']
  if cached_movies
    movies = JSON.parse(cached_movies)
  else
    @tmdb = Tmdb::Api.key(@config['themoviedb']['key'])
    movies = Tmdb::Movie.upcoming
    redis['trailerts_upcoming'] = movies.to_json
    redis.expire('trailerts_upcoming', 43200) # half a day
  end
  movie = movies.sample
  movie.to_json
end

get '/discover' do
  response.headers['Content-type'] = "application/json"
  
  @config = get_config

  @movie_params = {}
  ['year', 'language', 'with_companies', 'vote_count.gte', 'vote_average.gte', 'with_genres'].each do |param_name|
    @movie_params[param_name.to_sym] = @params[param_name].to_i if @params.has_key?(param_name)
  end

  redis_key = 'trailerts_discover_%s' % @movie_params.hash.to_s

  redis = Redis.new

  cached_movies = redis[redis_key]
  if cached_movies
    movies = JSON.parse(cached_movies)
  else
    @tmdb = Tmdb::Api.key(@config['themoviedb']['key'])
    movies = Tmdb::Movie.discover @movie_params #now_playing
    redis[redis_key] = movies.to_json
    redis.expire(redis_key, 43200) # half a day
  end
  movie = movies.sample
  movie.to_json
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
