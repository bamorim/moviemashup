var express = require('express'),
    http = require('http'),
    app = express(),
    engine = require('ejs-locals');

const api_key = process.env.TMDB_API_KEY;
const forbiddenWords = "a e i o u é à há em ou de da do para desde que das dos no na nos nas - 1 2 3 4 5 6 7 8 9 i ii iii iv v vi".split(" ");

const isAllowed = function(word){
  return forbiddenWords.indexOf(word.toLowerCase()) < 0;
};

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}

app.engine('ejs',engine);
app.set('view engine','ejs');

app.get('/',function(req,res){
  res.render('index');
});

app.get("/:word/:movieId/:wordIndex",function(req,res,next){
  var options = {
    host: 'api.themoviedb.org',
    port: 80,
    path: '/3/movie/'+req.params.movieId+'?api_key='+api_key
  };

  http.get(options,function(resp){
    var dataStr = "";
    resp.on('data',function(chunk){
      dataStr = dataStr + chunk.toString();
    };

    resp.on('end',function(){
      var movie = JSON.parse(dataStr);
      var titleWords = movie.title.split(" ");
      titleWords[req.params.wordIndex] = req.params.word.capitalize();
      var newMovieTitle = titleWords.join(" ");
      res.render('results',{title: newMovieTitle, movie: movie, locals:{ word: req.params.word }});
    });
  }).on('error',next);
});

app.get('/:word',function(req,res,next){
  var page = parseInt(Math.random() * 100) + 1;
  var options = {
    host: 'api.themoviedb.org',
    port: 80,
    path: '/3/discover/movie?sort_by=popularity.desc&api_key='+api_key+'&language=pt&page='+page
  }
  http.get(options,function(resp){
    var dataStr = "";
    resp.on('data',function(chunk){
      dataStr = dataStr + chunk.toString();
    });
    resp.on('end',function() {
      var data = JSON.parse(dataStr);
      var movies = data.results.filter(function(movie){
        return movie.title.split(" ").filter(isAllowed).length > 1
      });
      
      if(movies.length == 0) return res.redirect('.');

      var movieIndex = parseInt(movies.length*Math.random());
      var movieTitle = movies[movieIndex].title;
      var movie = movies[movieIndex];
      var movieTitleWords = movieTitle.split(" ");
      var allowedWords = movieTitleWords.filter(isAllowed);
      var wordToBeChanged = allowedWords[parseInt(allowedWords.length*Math.random())];
      movieTitleWords[movieTitleWords.indexOf(wordToBeChanged)] = req.params.word.capitalize();
      var newMovieTitle = movieTitleWords.join(" ");
      res.render('results',{title: newMovieTitle, movie: movie, locals:{ word: req.params.word }});
    });
  }).on('error',next);
});

var port = process.env.PORT || 3000;

console.log("App listening on ",port);
app.listen(port);
