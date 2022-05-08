const axios = require('axios');
const { config } = require('chai');
const { response } = require('express');
//const { EntityNotFoundError } = require('./error');
const BASE_URL = 'http://api.spotify.com/v1/';

class SpotifyApi {
    
    constructor(bearerToken) {
        this.spotify = axios.create({
            baseURL: BASE_URL,
            headers: {'Authorization': `Bearer ${bearerToken}`}
        });
    }

    _formatAlbumTracks(data) {
        let res = {};
        res["tracks"] = [];
        res["ids"] = [];
        for (let d of data) {
            for (let t of d.album.tracks.items) {
                res["tracks"].push(t.name);
                res["ids"].push(t.id);
            }
        }
        return res;
    }

    _formatTrackFeatures(data) {
        let res = {};
        res["danceability"] = [];
        res["energy"] = [];
        res["key"] = [];
        res["loudness"] = [];
        res["mode"] = [];
        res["valence"] = [];
        res["speechiness"] = [];
        res["acousticness"] = [];
        res["instrumentalness"] = [];
        res["liveness"] = [];
        res["tempo"] = [];
        for (let d of data) {
            res["danceability"].push(d.danceability);
            res["energy"].push(d.energy);
            res["key"].push(d.key);
            res["loudness"].push(d.loudness);
            res["mode"].push(d.mode);
            res["valence"].push(d.valence);
            res["speechiness"].push(d.speechiness);
            res["acousticness"].push(d.acousticness);
            res["instrumentalness"].push(d.instrumentalness);
            res["liveness"].push(d.liveness);
            res["tempo"].push(d.tempo);
        }
        return res;
    }

    _formatTrackPopularities(data) {
        let res = {};
        res["popularity"] = [];
        for (let d of data) {
            res["popularity"].push(d.popularity);
        }
        return res;
    }

    getCurrentUserAlbumTracks(limit, offset, callback) {
        let res = this.spotify.get(`/me/albums?limit=${limit}&offset=${offset}`, {})
            .then(response => {
                if (response.data.error) {
                    console.log(response.data.error);
                }
                
                let album_data = this._formatAlbumTracks(response.data.items);
                album_data["total"] = response.data.total;
                return album_data;
            })
            .then(val => callback(null, val))
            .catch(err => callback(err));
        return res;
    }

    getTrackFeatures(trackIds, callback) {
        let res = this.spotify.get(`/audio-features?ids=${trackIds}`, {})
            .then(response => {
                if (response.data.error) {
                    console.log(response.data.error);
                }
                
                let track_features = this._formatTrackFeatures(response.data.audio_features);
                return track_features;
            })
            .then(val => callback(null, val))
            .catch(err => callback(err));
        return res;
    }

    getTrackPopularities(trackIds, callback) {
        let res = this.spotify.get(`/tracks?ids=${trackIds}`, {})
            .then(response => {
                if (response.data.error) {
                    console.log(response.data.error);
                }
                
                let popularities = this._formatTrackPopularities(response.data.tracks);
                return popularities;
            })
            .then(val => callback(null, val))
            .catch(err => callback(err));
        return res;
    }
}

exports.SpotifyApi = SpotifyApi;