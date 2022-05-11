const spotify = require('./SpotifyApiGrabber.js');
const aws = require('aws-sdk');
const fs = require('fs');
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
//var refresh_uri = 'http://172.16.42.131:3000/refresh_token';
const BEARER_TOKEN = 'BQAgM54ttc_q4boUW_z6-TVOAo17iazOpKp29K1xeLqZ63Pm5QTzZ3qX5YjovTuDrmMnIGYLCOWXvzhMco40ylJ03x6_Lc8QONl8PsqwTW8XkfQvcBID45D66UjIiimiT9ONGTfY6nEYxggOJlUWqw'

function readAWSCredentials(path) {
    try {
        if (fs.existsSync(path)) {
            let data = fs.readFileSync(path).toString().split("\n");
            for (let i = 0; i < data.length; i++) {
                let n = data[i].lastIndexOf('=');
                data[i] = data[i].substring(n+1);
            }
            return data;
        }
    } catch (err) {
        console.error('Path DNE');
    }
}

function readSpotifyCredentials(path) {
    try {
        if (fs.existsSync(path)) {
            let data = fs.readFileSync(path).toString();
            let obj = JSON.parse(data);
            return [obj.access, obj.refresh];
        }
    } catch (err) {
        console.error('Path DNE');
    }
}

function refreshToken(uri) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", uri, false );
    return xmlHttp.responseText;
}

//const spotify_credentials = readSpotifyCredentials('./EE547_Team5_Final_Project/spotifytokens.json')
//const SPOTIFY_BEARER = spotify_credentials[0];
//const SPOTIFY_REFRESH = spotify_credentials[1];

/*function getAccessToken(exists, callback) {
    if (!exists) {
        let uri = 'http://172.16.42.131:3000/callback';

    }
}*/

//let res = refreshToken(refresh_uri);

const aws_credentials = readAWSCredentials('aws_secrets.csv');
const AWS_ACCESS = aws_credentials[0].split('\r')[0];
const AWS_SECRET = aws_credentials[1];

const BUCKET_NAME = 'ee547-final-project';

const s3 = new aws.S3({
    accessKeyId: AWS_ACCESS,
    secretAccessKey: AWS_SECRET
});

const path = 'spotifytokens.json';
const params = {
    Bucket: BUCKET_NAME,
    Key: path
};

s3.headObject(params, function (err, metadata) {  
    if (err && err.name === 'NotFound') {  
        console.log('runs');
    } else if (err) {
        console.error(err);
    } else {  
        s3.getSignedUrl('getObject', params, callback);
    }
});

function callback(err, res) {
    if (err) {
        console.error(err);
    } else {
        return res;
    }
}

async function getAlbumTrackData() {
    let limit = 50;
    let offset = 0;
    let spa = new spotify.SpotifyApi(BEARER_TOKEN);
    let data = {tracks: [], ids: [], danceability: [], energy: [], key: [], loudness: [], mode: [],
                valence: [], speechiness: [], acousticness: [], instrumentalness: [], liveness: [],
                tempo: [], popularity: []};
    try {
        var total = 1;
        while (offset < total) {
            let output = await spa.getCurrentUserAlbumTracks(limit, offset, callback);
            total = output.total;
            data.tracks = data.tracks.concat(output.tracks);
            data.ids = data.ids.concat(output.ids);
            offset += limit;
        }

        let numTracks = 50;
        let trackNum = 0;

        while (trackNum < data.ids.length) {
            let trackIds = data.ids.slice(trackNum, trackNum+numTracks).toString();
            let track_features = await spa.getTrackFeatures(trackIds, callback);
            let track_popularities = await spa.getTrackPopularities(trackIds, callback);
            data.danceability = data.danceability.concat(track_features.danceability);
            data.energy = data.energy.concat(track_features.energy);
            data.key = data.key.concat(track_features.key);
            data.loudness = data.loudness.concat(track_features.loudness);
            data.mode = data.mode.concat(track_features.mode);
            data.valence = data.valence.concat(track_features.valence);
            data.speechiness = data.speechiness.concat(track_features.speechiness);
            data.acousticness = data.acousticness.concat(track_features.acousticness);
            data.instrumentalness = data.instrumentalness.concat(track_features.instrumentalness);
            data.liveness = data.liveness.concat(track_features.liveness);
            data.tempo = data.tempo.concat(track_features.tempo);
            data.popularity = data.popularity.concat(track_popularities.popularity);
            trackNum += numTracks;
        }
    } catch (err) {
        console.error(err);
    }

    const obj = JSON.stringify(data);
    const params = {
        Bucket: BUCKET_NAME,
        Key: 'album_tracks.json',
        Body: obj
    };

    s3.upload(params, function(err, data) {
        if (err) {
            throw err;
        }
        console.log(`File uploaded successfully. ${data.Location}`);
    });
}

async function getLikedTracks() {
    let limit = 50;
    let offset = 0;
    let spa = new spotify.SpotifyApi(BEARER_TOKEN);
    let data = {tracks: [], ids: [], danceability: [], energy: [], key: [], loudness: [], mode: [],
                valence: [], speechiness: [], acousticness: [], instrumentalness: [], liveness: [],
                tempo: [], popularity: []};
    try {
        var total = 1;
        while (offset < total) {
            let output = await spa.getCurrentUserLikedTracks(limit, offset, callback);
            total = output.total;
            data.tracks = data.tracks.concat(output.tracks);
            data.ids = data.ids.concat(output.ids);
            offset += limit;
        }

        let numTracks = 50;
        let trackNum = 0;

        while (trackNum < data.ids.length) {
            let trackIds = data.ids.slice(trackNum, trackNum+numTracks).toString();
            let track_features = await spa.getTrackFeatures(trackIds, callback);
            let track_popularities = await spa.getTrackPopularities(trackIds, callback);
            data.danceability = data.danceability.concat(track_features.danceability);
            data.energy = data.energy.concat(track_features.energy);
            data.key = data.key.concat(track_features.key);
            data.loudness = data.loudness.concat(track_features.loudness);
            data.mode = data.mode.concat(track_features.mode);
            data.valence = data.valence.concat(track_features.valence);
            data.speechiness = data.speechiness.concat(track_features.speechiness);
            data.acousticness = data.acousticness.concat(track_features.acousticness);
            data.instrumentalness = data.instrumentalness.concat(track_features.instrumentalness);
            data.liveness = data.liveness.concat(track_features.liveness);
            data.tempo = data.tempo.concat(track_features.tempo);
            data.popularity = data.popularity.concat(track_popularities.popularity);
            trackNum += numTracks;
        }
    } catch (err) {
        console.error(err);
    }

    const obj = JSON.stringify(data);
    const params = {
        Bucket: BUCKET_NAME,
        Key: 'liked_tracks.json',
        Body: obj
    };

    s3.upload(params, function(err, data) {
        if (err) {
            throw err;
        }
        console.log(`File uploaded successfully. ${data.Location}`);
    });
}

async function getFeaturedPlaylistTracks() {
    let playlist_limit = 10;
    let spa = new spotify.SpotifyApi(BEARER_TOKEN);
    let data = {tracks: [], ids: [], danceability: [], energy: [], key: [], loudness: [], mode: [],
                valence: [], speechiness: [], acousticness: [], instrumentalness: [], liveness: [],
                tempo: [], popularity: []};
    try {
        let playlist_output = await spa.getFeaturedPlaylists(playlist_limit, callback);
        let playlist_ids = playlist_output.playlist_ids;

        let totals = [];
        for (playlist of playlist_ids) {
            let limit = 50;
            let offset = 0;
            var total = 1;
            while (offset < total) {
                let output = await spa.getPlaylistTracks(playlist, limit, offset, callback);
                total = output.total;
                data.tracks = data.tracks.concat(output.tracks);
                data.ids = data.ids.concat(output.ids);
                offset += limit;
            }
            totals.push(total);
        }

        for (total of totals) {
            let numTracks = 50;
            let trackNum = 0;
            while (trackNum < total) {
                let trackIds = "";
                if (trackNum+numTracks > total) {
                    trackIds = data.ids.slice(trackNum, total).toString();
                } else {
                    trackIds = data.ids.slice(trackNum, trackNum+numTracks).toString();
                }
                
                let track_features = await spa.getTrackFeatures(trackIds, callback);
                let track_popularities = await spa.getTrackPopularities(trackIds, callback);
                data.danceability = data.danceability.concat(track_features.danceability);
                data.energy = data.energy.concat(track_features.energy);
                data.key = data.key.concat(track_features.key);
                data.loudness = data.loudness.concat(track_features.loudness);
                data.mode = data.mode.concat(track_features.mode);
                data.valence = data.valence.concat(track_features.valence);
                data.speechiness = data.speechiness.concat(track_features.speechiness);
                data.acousticness = data.acousticness.concat(track_features.acousticness);
                data.instrumentalness = data.instrumentalness.concat(track_features.instrumentalness);
                data.liveness = data.liveness.concat(track_features.liveness);
                data.tempo = data.tempo.concat(track_features.tempo);
                data.popularity = data.popularity.concat(track_popularities.popularity);
                trackNum += numTracks;
            }
        }
    } catch (err) {
        console.error(err);
    }

    const obj = JSON.stringify(data);
    const params = {
        Bucket: BUCKET_NAME,
        Key: 'featured_playlist_tracks.json',
        Body: obj
    };

    s3.upload(params, function(err, data) {
        if (err) {
            throw err;
        }
        console.log(`File uploaded successfully. ${data.Location}`);
    });
}

function run(getAlbum, getLiked, getFeaturedPlaylist) {
    if (getAlbum) {
        getAlbumTrackData();
    }

    if (getLiked) {
        getLikedTracks();
    }

    if (getFeaturedPlaylist) {
        getFeaturedPlaylistTracks();
    }
}

run(false, false, true);