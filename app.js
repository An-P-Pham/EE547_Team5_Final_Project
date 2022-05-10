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
const search_limit = 5;
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
* queryString: Either track name or artist name
* queryType: Either 'track' or 'artist'
*/
function searchItem(queryString, queryType){
  //Type is either Track || Artist
  const searchQuery = encodeURIComponent(queryString);
  const search_url = base_url + `search?q=${searchQuery}&type=${queryType}&limit=${search_limit}`;
  axios.get(search_url, {headers: {Authorization: `Bearer ${access_token}`}})
  .then((response) => {
      let id = (queryType == 'artist') ? response.data.artists.items[0].id : response.data.tracks.items[0].id;
      console.log(id);
      return id;

  }).catch((err) =>{
      console.log('Error with requesting API endpoint');
  });
}

/*
* Interface for getting recommendations
* Inputs: strings of items, seperated with ','
*/
function getRecommendations(seed_artists, seed_generes, seed_tracks) {
    const search_url = base_url + `recommendations?limit=${search_limit}&seed_artists=${seed_artists}&seed_genres=${seed_generes}&seed_tracks=${seed_tracks}`;

    axios.get(search_url, {headers: {Authorization: `Bearer ${access_token}`}})
    .then((response) => {
        console.log(response.data.tracks)

    }).catch((err) =>{
        console.log('Error with requesting API endpoint');
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
app.post('/signup', (req, res) => {
  let useridInput = req.body.userid;
  let nameInput = req.body.name;
  let passwordInput = req.body.password;

  //Valid inputs should be checked on client side java script


  //Add the user & redirect
  let newUser = {
    userid: useridInput,
    name: nameInput,
    password: passwordInput,
    artists: [],
    tracks: [],
    genres: []
  }
  //TODO: prevent duplicate inserts
  mongoDb.collection('user').insertOne(newUser, function(err, result){
    if(err){
      console.log(err);
    }

    //Redirect to information about the user
    console.log(result.insertedId);
    res.redirect(303, '/index');
    //res.redirect(303, `/about/${result.insertedId}`);

  });

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