const axios = require('axios')
/**
 * Allows you to quickly test API endpoints without the hassle of setting up an express server
 */

var request = require('request'); // "Request" library

var client_id = '1e03ef1b02c04193a4f9ee30aa04502b'; // Your client id
var client_secret = 'c7648e51d4ec4b01a821fad346c2b7cf'; // Your secret
var access_token;
var search_limit = 5;
const base_url = 'https://api.spotify.com/v1/';

/*
* We can use this function to find the seed_artists & seed_tracks via word query
* queryString: Either track name or artist name
* queryType: Either 'track' or 'artist'
*/
function searchItem(queryString, queryType){
  //Type is either Track || Artist
  const search_url = base_url + `search?q=${queryString}&type=${queryType}&limit=${search_limit}`;
  axios.get(search_url, {headers: {Authorization: `Bearer ${access_token}`}})
  .then((response) => {
      console.log(response.data.artists.items);

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

// your application requests authorization
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
    //searchItem('Keshi', 'artist');
    getRecommendations('3pc0bOVB5whxmD50W79wwO,2LIk90788K0zvyj2JJVwkJ', 'chill r&b', '1Fhb9iJPufNMZSwupsXiRe,1rDQ4oMwGJI7B4tovsBOxc');
    request.get(options, function(error, response, body) {
      //console.log(body);
    });
  }
});

