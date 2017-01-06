function getAlbumInfo(artist, album, cb) {
    var http = require('http');
    var parsed = {};

    var host = 'ws.audioscrobbler.com';
    var path = '/2.0/?method=album.getinfo'
        + '&api_key=' + '440bf0a9b4d27b27e11698e6c940de24'
        + '&artist=' + encodeURI(artist)
        + '&album=' + encodeURI(album)
        + '&format=json';

    //console.log(path);

    return http.get({
        host: host,
        path: path
    }, function (response) {
        // Continuously update stream with data
        var body = '';
        response.on('data', function (d) {
            body += d;
        });
        response.on('end', function () {
            // Data reception is done
            parsed = JSON.parse(body);
            cb(parsed.album);
        });
    });
}

module.exports = {
    getAlbumInfo: getAlbumInfo
}
