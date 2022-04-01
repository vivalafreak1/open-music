const PlaylistSongsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
    name: 'playlistssongs',
    version: '1.0.0',
    register: async (server, {
        playlistsSongsService,
        playlistsService,
        songsService,
        validator,
    }) => {
        const playlistSongHandler = new PlaylistSongsHandler(
            playlistsSongsService,
            playlistsService,
            songsService,
            validator,
        );
        server.route(routes(playlistSongHandler));
    },
};