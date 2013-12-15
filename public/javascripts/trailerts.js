if(typeof(String.prototype.trim) === "undefined")
{
    String.prototype.trim = function() 
    {
        return String(this).replace(/^\s+|\s+$/g, '');
    };
}

var Trailerts = window.Trailerts || {
  max_queue_length: 10,
  slug: undefined,
  data: {},
  queue: [],
  player: undefined,
  startup: true,
  min_year: 1980,
  max_year: 2015,
  fetching: false
};

function onYouTubePlayerReady(playerId) {
  console.log('youtube player ready!');
  Trailerts.data.player = document.getElementById("myytplayer");
  Trailerts.data.player.addEventListener("onStateChange", "onytplayerStateChange");
  Trailerts.data.player.playVideo();
}

function onytplayerStateChange(newState) {
  // This event fires whenever the player's state changes. The value that the API passes to your event listener function will specify an integer that corresponds to the new player state. Possible values are:
  // -1 (unstarted)
  // 0 (ended)
  // 1 (playing)
  // 2 (paused)
  // 3 (buffering)
  // 5 (video cued).
  console.log("Player's new state: " + newState);
  if ((newState == -1) || (newState == 5)) {
    Trailerts.data.player.playVideo();
  }
  
  if (newState == 0) {
    Trailerts.process_queue();
  }
}

Trailerts.init = function() {
  console.log('Trailerts inited!');

  $('slider input').attr('data-slider-min', Trailerts.min_year).attr('data-slider-max', Trailerts.max_year);
  $('#min-year').text(Trailerts.min_year);
  $('#max-year').text(Trailerts.max_year);

  Trailerts.fetch_new_ad();

  $('.slider input').slider().on('slideStop', function(ev) {
    var period = $(this).slider('getValue').data('slider').getValue();
    console.log('Slider was used! new value: ' + period);
    Trailerts.min_year = period[0];
    Trailerts.max_year = period[1];
    $('#min-year').text(Trailerts.min_year);
    $('#max-year').text(Trailerts.max_year);
    if (!Trailerts.fetching) {
      Trailerts.queue = Trailerts.queue.slice(0,1); // cut off
      Trailerts.fetch_new_ad();
    }
  });
};

Trailerts.fetch_new_ad = function() {
  if (Trailerts.queue.length <= Trailerts.max_queue_length) {
    var random_url = '/api';
    if (!Trailerts.data.slug) {
      random_url = '/api/upcoming?';
    } else {
      random_url = '/api/' + Trailerts.data.slug + '?';
      if (typeof(Trailerts.min_year) != 'undefined') {
        random_url += 'release_date.gte=' + Trailerts.min_year + '-01-01&';
      }      
      if (typeof(Trailerts.max_year) != 'undefined') {
        random_url += 'release_date.lte=' + Trailerts.max_year + '-12-31&';
      }      
    }
    var random_bit = Math.round(new Date().getTime() / 1000);
    random_url = random_url + '_=' + random_bit;
    console.log('api url: ' + random_url);
    Trailerts.fetching = true;
    $.get(random_url, function (data) {
      var product = data.title.trim();
      console.log('got a new ad: ' + product);
      //console.dir(data);
      Trailerts.search_youtube(product + ' trailer');
    }, 'json');
  }
};

Trailerts.search_youtube = function(terms) {
  $.get(
    'https://www.googleapis.com/youtube/v3/search?part=snippet&q=' + terms.replace(/\s+/g, '+').toLowerCase() + '&videoDuration=short&videoEmbeddable=true&type=video&key=AIzaSyBJJQPGXqu2BN3owWu7iIaan2exWSHZpAM',
    function (data) {
      Trailerts.fetching = false;
      console.log('got youtube data!:');
      console.dir(data);
      if (data.items.length > 0) {
        var videos_added = 0;
        for(item_idx in data.items) {
          var youtubeID = data.items[item_idx].id.videoId;
          if ((videos_added == 0) && (Trailerts.queue.indexOf(youtubeID) < 0)) {
            Trailerts.queue.push(youtubeID);
            videos_added = videos_added + 1;
            if (Trailerts.startup) {
              Trailerts.startup = false;
              Trailerts.process_queue();
            }
          }
        }
      } else {
        console.log('no youtube video found for : ' + terms.replace(/\s+/g, '+'));
      }
      
      if (Trailerts.queue.length < Trailerts.max_queue_length) {
        Trailerts.fetch_new_ad();
      }
    }, 'json');
};

Trailerts.process_queue = function() {
  if (Trailerts.queue.length <= 0) {
    // load new video in background
    return;
  }

  if (typeof(Trailerts.data.player) == 'undefined') {
    var youtubeID = Trailerts.queue.pop();
    console.log('Embedding youtube video ' + youtubeID);
    var params = { allowScriptAccess: "always", allowFullScreen: "true" };
        var atts = { id: "myytplayer" };
        var yt_height = Math.floor((screen.height - 140) * 0.90);
        var yt_width = Math.floor(yt_height * 1.33);
        swfobject.embedSWF("http://www.youtube.com/v/" + youtubeID + "?enablejsapi=1&playerapiid=ytplayer&version=3",
                           "ytapiplayer", yt_width, yt_height, "8", null, null, params, atts);    
  } else {
    var youtubeID = Trailerts.queue.pop();
    Trailerts.data.player.cueVideoById(youtubeID);
  }

  if (Trailerts.queue.length < Trailerts.max_queue_length) {
    Trailerts.fetch_new_ad();
  }
};

$(document).ready(function() {
  Trailerts.init();
});