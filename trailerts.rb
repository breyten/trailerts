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

def get_if_cached(cache_key, proc, cache_timeout = 43200)
  redis = Redis.new
  
  cached_movies = redis[cache_key]
  if cached_movies
    movies = JSON.parse(cached_movies)
  else
    @tmdb = Tmdb::Api.key(@config['themoviedb']['key'])
    movies = proc.call
    redis[cache_key] = movies.to_json
    redis.expire(cache_key, cache_timeout) # half a day
  end
  
  movies
end

# Usage: partial :foo
helpers do
  def partial(page, options={})
    erb page, options.merge!(:layout => false)
  end
end


get '/' do
  @slug = 'upcoming'
  @config = get_config

  @genres = get_if_cached('trailerts_genres', Proc.new { Tmdb::Genre.list })

  erb :index
end

get '/now_playing' do
  @slug = 'now_playing'
  @config = get_config

  erb :index
end

get '/update/genres' do
  @config = get_config

  secret_configured_and_passed = params.has_key?('secret') && @config.has_section?('trailerts') && @config['trailerts'].has_key?('secret')
  secret_correct = (@config['trailerts']['secret'] == params['secret'])
  raise Sinatra::NotFound, 'Forbidden' unless params.has_key?('secret')

  genres = get_if_cached('trailerts_genres', Proc.new { Tmdb::Genre.list })
  genres.to_json
end

get '/api/now_playing' do
  response.headers['Content-type'] = "application/json"
  
  @config = get_config
  
  movies = get_if_cached('trailerts_now_playing', Proc.new { Tmdb::Movie.now_playing })
  movie = movies.sample
  movie.to_json
end

get '/api/upcoming' do
  response.headers['Content-type'] = "application/json"
  
  @config = get_config
  
  movies = get_if_cached('trailerts_upcoming', Proc.new { Tmdb::Movie.upcoming })
  movie = movies.sample
  movie.to_json
end

get '/api/discover' do
  response.headers['Content-type'] = "application/json"
  
  @config = get_config

  @movie_params = {}
  ['year', 'language', 'with_companies', 'vote_count.gte', 'vote_average.gte', 'with_genres'].each do |param_name|
    @movie_params[param_name.to_sym] = @params[param_name].to_i if @params.has_key?(param_name)
  end

  redis_key = 'trailerts_discover_%s' % @movie_params.hash.to_s

  movies = get_if_cached(redis_key, Proc.new { Tmdb::Movie.discover @movie_params })
  movie = movies.sample
  movie.to_json
end

get '/api/:slug' do
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
