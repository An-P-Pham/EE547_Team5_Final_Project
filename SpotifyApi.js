//list of available genres
const genre_list = [
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

const axios = require('axios')
const { EntityNotFoundError } = require('./error');

class SpotifyApi {
    constructor(access_token) {
        this.access_token = access_token;
        this.search_limit = 10;
        this.base_url = 'https://api.spotify.com/v1/';
    }

    //Type is either Track || Artist
    //API: https://developer.spotify.com/console/get-search-item/
    searchItem(queryString, queryType, callback) {

        const search_url = this.base_url + `search?q=${queryString}&type=${queryType}&limit=${this.search_limit}`;
        axios.get(search_url, {headers: {Authorization: `Bearer ${this.access_token}`}})
        .then((response) => {
          console.log(response.data.artists.items);

        }).catch((err) =>{
          console.log('Error with requesting API endpoint');
        });

    }

    //API: https://developer.spotify.com/console/get-recommendations/
    getRecommendations(seed_artists, seed_generes, seed_tracks, callback) {
        const search_url = this.base_url + `recommendations?limit=${this.search_limit}&seed_artists=${seed_artists}&seed_genres=${seed_generes}&seed_tracks=${seed_tracks}`;

        axios.get(search_url, {headers: {Authorization: `Bearer ${this.access_token}`}})
        .then((response) => {
            console.log(response.data.tracks)

        }).catch((err) =>{
            console.log('Error with requesting API endpoint');
        });

    }

    
}

exports.TwitterApi = TwitterApi;