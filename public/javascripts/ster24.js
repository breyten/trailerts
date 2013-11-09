if(typeof(String.prototype.trim) === "undefined")
{
    String.prototype.trim = function() 
    {
        return String(this).replace(/^\s+|\s+$/g, '');
    };
}

var Ster24 = window.Ster24 || {
  data: {},
  queue: [],
  player: undefined,
};

function onYouTubePlayerReady(playerId) {
  console.log('youtube player ready!');
  Ster24.data.player = document.getElementById("myytplayer");
  Ster24.data.player.playVideo();
}
    
Ster24.init = function() {
  console.log('ster24 inited!');
  Ster24.fetch_new_ad();
};

Ster24.fetch_new_ad = function() {
  $.get('/random', function (data) {
    var product = data.branddescr.trim();
    console.log('got a new ad: ' + product);
    //console.dir(data);
    Ster24.search_youtube(product + ' reclame');
  }, 'json');
};

Ster24.search_youtube = function(terms) {
  $.get(
    'https://www.googleapis.com/youtube/v3/search?part=snippet&q=' + terms.replace(/\s+/g, '+').toLowerCase() + '&videoDuration=short&videoEmbeddable=true&type=video&videoCaption=closedCaption&key=AIzaSyBJJQPGXqu2BN3owWu7iIaan2exWSHZpAM',
    function (data) {
      console.log('got youtube data!:');
      console.dir(data);
      if (data.items.length > 0) {
        var youtubeID = data.items[0].id.videoId;
        console.log('Embedding youtube video ' + youtubeID);
        var params = { allowScriptAccess: "always" };
            var atts = { id: "myytplayer" };
            swfobject.embedSWF("http://www.youtube.com/v/" + youtubeID + "?enablejsapi=1&playerapiid=ytplayer&version=3",
                               "ytapiplayer", "425", "356", "8", null, null, params, atts);
      } else {
        console.log('no youtube video found for : ' + terms.replace(/\s+/g, '+'));
      }
    }, 'json');
};

$(document).ready(function() {
  Ster24.init();
});