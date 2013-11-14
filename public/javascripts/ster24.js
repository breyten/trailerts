if(typeof(String.prototype.trim) === "undefined")
{
    String.prototype.trim = function() 
    {
        return String(this).replace(/^\s+|\s+$/g, '');
    };
}

var Ster24 = window.Ster24 || {
  max_queue_length: 10,
  slug: undefined,
  data: {},
  queue: [],
  player: undefined,
  startup: true,
};

function onYouTubePlayerReady(playerId) {
  console.log('youtube player ready!');
  Ster24.data.player = document.getElementById("myytplayer");
  Ster24.data.player.addEventListener("onStateChange", "onytplayerStateChange");
  Ster24.data.player.playVideo();
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
    Ster24.data.player.playVideo();
  }
  
  if (newState == 0) {
    Ster24.process_queue();
  }
}

Ster24.init = function() {
  console.log('ster24 inited!');
  Ster24.fetch_new_ad();
};

Ster24.fetch_new_ad = function() {
  if (Ster24.queue.length <= Ster24.max_queue_length) {
    var random_url = '/random';
    if (!Ster24.data.slug) {
      random_url = '/random';
    } else {
      random_url = '/random/' + Ster24.data.slug;      
    }
    var random_bit = Math.round(new Date().getTime() / 1000);
    random_url = random_url + '?_=' + random_bit;
    $.get(random_url, function (data) {
      var product = data.advertiserdescr.trim();
      console.log('got a new ad: ' + product);
      //console.dir(data);
      Ster24.search_youtube(product + ' reclame');
    }, 'json');
  }
};

Ster24.search_youtube = function(terms) {
  $.get(
    'https://www.googleapis.com/youtube/v3/search?part=snippet&q=' + terms.replace(/\s+/g, '+').toLowerCase() + '&videoDuration=short&videoEmbeddable=true&type=video&key=AIzaSyBJJQPGXqu2BN3owWu7iIaan2exWSHZpAM',
    function (data) {
      console.log('got youtube data!:');
      console.dir(data);
      if (data.items.length > 0) {
        var videos_added = 0;
        for(item_idx in data.items) {
          var youtubeID = data.items[item_idx].id.videoId;
          if ((videos_added == 0) && (Ster24.queue.indexOf(youtubeID) < 0)) {
            Ster24.queue.push(youtubeID);
            videos_added = videos_added + 1;
            if (Ster24.startup) {
              Ster24.startup = false;
              Ster24.process_queue();
            }
          }
        }
      } else {
        console.log('no youtube video found for : ' + terms.replace(/\s+/g, '+'));
      }
      
      if (Ster24.queue.length < Ster24.max_queue_length) {
        Ster24.fetch_new_ad();
      }
    }, 'json');
};

Ster24.process_queue = function() {
  if (Ster24.queue.length <= 0) {
    // load new video in background
    return;
  }

  if (typeof(Ster24.data.player) == 'undefined') {
    var youtubeID = Ster24.queue.pop();
    console.log('Embedding youtube video ' + youtubeID);
    var params = { allowScriptAccess: "always", allowFullScreen: "true" };
        var atts = { id: "myytplayer" };
        var yt_height = Math.floor((screen.height - 140) * 0.90);
        var yt_width = Math.floor(yt_height * 1.33);
        swfobject.embedSWF("http://www.youtube.com/v/" + youtubeID + "?enablejsapi=1&playerapiid=ytplayer&version=3",
                           "ytapiplayer", yt_width, yt_height, "8", null, null, params, atts);    
  } else {
    var youtubeID = Ster24.queue.pop();
    Ster24.data.player.cueVideoById(youtubeID);
  }

  if (Ster24.queue.length < Ster24.max_queue_length) {
    Ster24.fetch_new_ad();
  }
};

$(document).ready(function() {
  Ster24.init();
});