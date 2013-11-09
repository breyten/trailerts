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
};

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
    'https://www.googleapis.com/youtube/v3/search?part=snippet&q=' + escape(terms) + '&videoDuration=short&videoEmbeddable=true&type=video&videoCaption=closedCaption&key=AIzaSyBJJQPGXqu2BN3owWu7iIaan2exWSHZpAM',
    function (data) {
      console.log('got youtube data!:');
      console.dir(data);
    }, 'json');
};

$(document).ready(function() {
  Ster24.init();
});