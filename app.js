/**
 * This is the main application of our project
*/

/* Modules, Frameworks, Libraries */
var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
const axios = require('axios');
var nunjucks = require('nunjucks');
var sessions = require('express-session')

/* Global Constants */
var client_id = '1e03ef1b02c04193a4f9ee30aa04502b'; // Your client id
var client_secret = 'c7648e51d4ec4b01a821fad346c2b7cf'; // Your secret
var access_token; //Used in spotify API
const search_limit = 10;
const base_url = 'https://api.spotify.com/v1/';
const regExp = /^[a-zA-Z]+$/;



//Application requests authorization
var authOptions = {
  url: 'https://accounts.spotify.com/api/token',
  headers: {
    'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
  },
  form: {
    grant_type: 'client_credentials'
  },
  json: true
};

request.post(authOptions, function(error, response, body) {
  if (!error && response.statusCode === 200) {

    // use the access token to access the Spotify Web API
    access_token = body.access_token;
    var options = {
      url: 'https://api.spotify.com/v1/users/12142525543',
      headers: {
        'Authorization': 'Bearer ' + access_token
      },
      json: true
    };

    //Test any APIs here after obtaining the access_token
    request.get(options, function(error, response, body) {
      //console.log(body);
    });
  }
});


/*
* We can use this function to find the seed_artists & seed_tracks via word query
* Item: Either a list of artists/tracks or single string
* queryType: Either 'track' or 'artist'
*/
async function searchItem(queryItem, queryType){
  //Type is either Track || Artist
  let seed_id_list = [];
  if(Array.isArray(queryItem))
  {
    
    for (const item of queryItem){
      const searchQuery = encodeURIComponent(item);
      const search_url = base_url + `search?q=${searchQuery}&type=${queryType}&limit=${search_limit}`;
      const response = await axios.get(search_url, {headers: {Authorization: `Bearer ${access_token}`}});
      let id = (queryType == 'artist') ? response.data.artists.items[0].id : response.data.tracks.items[0].id;
      seed_id_list.push(id);
    }

  }else{

    const searchQuery = encodeURIComponent(queryItem);
    const search_url = base_url + `search?q=${searchQuery}&type=${queryType}&limit=${search_limit}`;
    axios.get(search_url, {headers: {Authorization: `Bearer ${access_token}`}})
    .then((response) => {
        let id = (queryType == 'artist') ? response.data.artists.items[0].id : response.data.tracks.items[0].id;
        //console.log(id);
        seed_id_list.push(id);

    }).catch((err) =>{
        console.log('Error with requesting API endpoint');
    });
    
  }

  return seed_id_list;
  
}

/*
* Interface for getting recommendations
* Inputs: strings of items, seperated with ','
*/
function getRecommendations(seed_artists, seed_generes, seed_tracks, callback) {
    const search_url = base_url + `recommendations?limit=${search_limit}&seed_artists=${seed_artists}&seed_genres=${seed_generes}&seed_tracks=${seed_tracks}`;
    axios.get(search_url, {headers: {Authorization: `Bearer ${access_token}`}})
    .then((response) => {
        let recommendation_list = [];
        let tracks = response.data.tracks;
        for(let i=0; i<search_limit; i++)
        {
          const recommendationObj = {
            artist: tracks[i].artists[0].name,
            albumName: tracks[i].album.name,
            totalTracks: tracks[i].album.total_tracks,
            releaseDate: tracks[i].album.release_date,
            previewLink: tracks[i].preview_url
          };
          recommendation_list.push(recommendationObj);
        }
        //console.log(recommendation_list);
        //return recommendation_list;
        callback(null, recommendation_list);

    }).catch((err) =>{
        //console.log(err);
        callback(err, []);
    });
}


//Server constants
const PORT = 8888; 
const router = express.Router();
const app = express(); //starts an express app

app.use(express.urlencoded({ extended: false}));
app.use('/', express.static('public'));
app.engine( 'html', nunjucks.render ) ;
app.set("view engine", "html");
const oneDay = 1000 * 60 * 60 * 24;
app.use(sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false 
}));

var env = nunjucks.configure(['./views'], { // set folders with templates
  autoescape: true, 
  express: app
});

/* Mongo */
let mongoDb;
const { MongoClient, ObjectId} = require('mongodb');

let mongo_info = {
  host: "localhost", //TODO: change to host ip-address that will be holding the mongo db
  port: "27017",
  db: "ee547_group5_project",
  opts: {
    useUnifiedTopology: true
  }
};

const uri = `mongodb://${mongo_info.host}:${mongo_info.port}?useUnifiedTopology=${mongo_info.opts.useUnifiedTopology}`;


MongoClient.connect(uri, (err, mongoConnect) => {
  //exit for any connection error
  if(err){
    process.exit(5);
  }

  mongoDb = mongoConnect.db(mongo_info.db);
  app.listen(PORT);
  console.log(`Server started, port ${PORT}`);

});

//app.listen(PORT);
//console.log(`Server started, port ${PORT}`);

//Home page:
app.get('/', (req, res, next) => {
  session = req.session;  
  if(session.userid){
    res.render('index.html', {userid: session.userid});  
  }
  else{
    res.render('index.html');
  }
  
});

app.get('/index', (req, res, next) => {
  res.render('index.html', );  
});

app.get('/about/:id', (req, res, next) => {
  res.sendFile(__dirname + '/about.html');  
});

app.get('/sorry', (req, res, next) => {
  res.sendFile(__dirname + '/sorry.html');  
});

//Route for signing up new user
app.post('/signup', async (req, res) => {
  let useridInput = req.body.userid;
  let nameInput = req.body.name;
  let passwordInput = req.body.password;

  //Valid inputs should be checked on client side java script


  //Add the user & redirect
  const newUser = {
    userid: useridInput,
    createdAt: new Date(),
    name: nameInput,
    password: passwordInput,
    artists: [],
    tracks: [],
    genres: []
  }

  try{
    const userDoc = await mongoDb.collection('user').findOne({ userid: useridInput });
    if(userDoc === null)
    {
      console.log('Userid is not used');
      mongoDb.collection('user').insertOne(newUser, function(err, result){
        if(err){
          console.log(err);
        }
 
        //Redirect to information about the user
        console.log(result.insertedId);
        res.redirect(303, '/index');
        //res.redirect(303, `/about/${result.insertedId}`);
      });
 
    }else{
      res.status(401).send({error: "UserID is already in use"});
    }
  }catch(error){
    console.log('Error when checking if a userid is alrady taken');
  }

});

//Route for signing in existing user
app.post('/signin', (req, res) =>{
  let userid = req.body.userid;
  let password = req.body.passwordinput;  
  
  console.log(userid, password);
  if(userid && password)
  {
    mongoDb.collection('user').findOne({ userid: userid })
        .then(function(doc){
          //user not found
          if(doc === null)
          {
            res.status(401).send({error: "Can't find userid"});
          }
          else
          {
            const resUserId = doc.userid;
            const resUserPassword = doc.password;
            const resName = doc.name;

            if(resUserPassword !== password)
            {
              //incorrect password
              res.status(401).send({error: "Incorrect password"});
            }
            // Set user session
            session = req.session
            session.userid = userid
            const databaseID = doc._id.toString();
            res.redirect(303, `/`);
          }
          
        }).catch(function(err){
          console.log(err);
        });
  }else{
    res.status(404).end();
  }
});

//Route for getting the recommendations
app.post('/recommendation', async (req,res) => {
  let artists = req.body.artists;
  let genres = req.body.genres;
  let tracks = req.body.tracks;

  console.log(artists);
  console.log(genres);
  console.log(tracks);
  //Should probably save the quries to the database

  //loop over the artists & tracks to get the seed values
  if(artists && genres && tracks){

    const resultArr = await Promise.all([
        searchItem(artists, 'artist'),
        searchItem(tracks, 'track')
    ]);

    const artists_seed_ids = resultArr[0];
    const tracks_seed_ids = resultArr[1];
    const selected_genres_string = (Array.isArray(genres)) ? genres.join(',') : genres;
    let selected_artists_string = artists_seed_ids.join(',');
    let selected_tracks_string = tracks_seed_ids.join(',');   

    console.log('After API calls');
    console.log(selected_artists_string);
    console.log(selected_genres_string);
    console.log(selected_tracks_string);
    const recDone = function callback(err, value) {
      if (err) {
          console.error(err);
      } else {
          console.log(value);
          res.status(202).json(value);
      }
    }
    const recommendedSongs = await getRecommendations(selected_artists_string, selected_genres_string, selected_tracks_string, recDone);
    

  }else{
    res.status(401).send({error: "Invalid inputs"});
  }

});

app.get('/logout',(req,res) => {
  req.session.destroy();
  res.redirect('/');
});

app.use('/', router);


/* List of Generes: Variable is hoisted */
var genre_list = [
    "acoustic",
    "afrobeat",
    "alt-rock",
    "alternative",
    "ambient",
    "anime",
    "black-metal",
    "bluegrass",
    "blues",
    "bossanova",
    "brazil",
    "breakbeat",
    "british",
    "cantopop",
    "chicago-house",
    "children",
    "chill",
    "classical",
    "club",
    "comedy",
    "country",
    "dance",
    "dancehall",
    "death-metal",
    "deep-house",
    "detroit-techno",
    "disco",
    "disney",
    "drum-and-bass",
    "dub",
    "dubstep",
    "edm",
    "electro",
    "electronic",
    "emo",
    "folk",
    "forro",
    "french",
    "funk",
    "garage",
    "german",
    "gospel",
    "goth",
    "grindcore",
    "groove",
    "grunge",
    "guitar",
    "happy",
    "hard-rock",
    "hardcore",
    "hardstyle",
    "heavy-metal",
    "hip-hop",
    "holidays",
    "honky-tonk",
    "house",
    "idm",
    "indian",
    "indie",
    "indie-pop",
    "industrial",
    "iranian",
    "j-dance",
    "j-idol",
    "j-pop",
    "j-rock",
    "jazz",
    "k-pop",
    "kids",
    "latin",
    "latino",
    "malay",
    "mandopop",
    "metal",
    "metal-misc",
    "metalcore",
    "minimal-techno",
    "movies",
    "mpb",
    "new-age",
    "new-release",
    "opera",
    "pagode",
    "party",
    "philippines-opm",
    "piano",
    "pop",
    "pop-film",
    "post-dubstep",
    "power-pop",
    "progressive-house",
    "psych-rock",
    "punk",
    "punk-rock",
    "r-n-b",
    "rainy-day",
    "reggae",
    "reggaeton",
    "road-trip",
    "rock",
    "rock-n-roll",
    "rockabilly",
    "romance",
    "sad",
    "salsa",
    "samba",
    "sertanejo",
    "show-tunes",
    "singer-songwriter",
    "ska",
    "sleep",
    "songwriter",
    "soul",
    "soundtracks",
    "spanish",
    "study",
    "summer",
    "swedish",
    "synth-pop",
    "tango",
    "techno",
    "trance",
    "trip-hop",
    "turkish",
    "work-out",
    "world-music"
];