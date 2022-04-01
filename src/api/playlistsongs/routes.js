const routes = (handler) => [
    {
        method: 'POST',
        path: '/playlists/{playlistId}/{any}',
        handler: handler.postPlaylistSongHandler,
        options: {
            auth: 'openmusicapp_jwt',
        },
    },
    {
        method: 'GET',
        path: '/playlists/{playlistId}/{any}',
        handler: handler.getPlaylistsSongHandler,
        options: {
            auth: 'openmusicapp_jwt',
        },
    },
    {
        method: 'DELETE',
        path: '/playlists/{playlistId}/{any}',
        handler: handler.deletePlaylistSongsHandler,
        options: {
            auth: 'openmusicapp_jwt',
        },
    },
];

module.exports = routes;