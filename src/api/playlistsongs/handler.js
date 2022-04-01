const ClientError = require('../../exceptions/ClientError');
const NotFoundError = require('../../exceptions/NotFoundError');

class PlaylistSongsHandler{
    constructor(playlistSongsService, playlistsService, songsService, validator){
        
        this._playlistSongsService = playlistSongsService;
        this._playlistsService = playlistsService;
        this._songsService = songsService;
        this._validator = validator;

        //BINDING HANDLER AGAR TIDAK NULL
        this.postPlaylistSongHandler = this.postPlaylistSongHandler.bind(this);
        this.getPlaylistsSongHandler = this.getPlaylistsSongHandler.bind(this);
        this.deletePlaylistSongsHandler = this.deletePlaylistSongsHandler.bind(this);
    }

    async postPlaylistSongHandler(request, h){
        try{
            const { playlistId, any } = request.params;

            if( any !== 'songs' ){
                throw new NotFoundError('Resource not found')
            }
            this._validator.validatePlaylistSongPayload(request.payload);
            const { id: credentialId } = request.auth.credentials;
            const { songId } = request.payload;

            await this._playlistsService.verifyPlaylistOwner(playlistId, credentialId);
            await this._songsService.getSongById(songId);
            const playlistSongId = await this._playlistSongsService.addPlaylistSong(playlistId, songId);

            const response = h.response({
                status: 'success',
                message: 'Lagu berhasil ditambahkan',
                data: {
                    playlistSongId
                }
            });
            response.code(201);
            return response;
        } catch(error){
            if(error instanceof ClientError){
                const response = h.response({
                    status: 'fail',
                    message: error.message,
                });
                response.code(error.statusCode);
                return response;
            }
            const response = h.response({
                status: 'error',
                message: 'Maaf, terjadi kegagalan pada server kami.',
            });
            response.code(500);
            console.error(error);
            return response;
        }
    }

    async getPlaylistsSongHandler(request, h){
        try{
            const { id: credentialId } = request.auth.credentials;
            const { playlistId, any } = request.params;
            
            if( any !== 'songs' ){
                throw new NotFoundError('Resource not found');
            }

            await this._playlistsService.verifyPlaylistOwner(playlistId, credentialId);
            const playlist = await this._playlistsService.getPlaylistsForSong(playlistId, credentialId);
            const songs = await this._playlistSongsService.getPlaylistSongs(playlistId);

            return{
                status: 'success',
                data: {
                    playlist: {
                        id: playlist.id,
                        name: playlist.name,
                        username: playlist.username,
                        songs,
                    }
                },
            };
        } catch(error){
            if(error instanceof ClientError){
                const response = h.response({
                    status: 'fail',
                    message: error.message,
                });
                response.code(error.statusCode);
                return response;
            }
            const response = h.response({
                status: 'error',
                message: 'Maaf, terjadi kegagalan pada server kami.',
            });
            response.code(500);
            console.error(error);
            return response;
        }
    }

    async deletePlaylistSongsHandler(request, h){
        try{
            const {id: credentialId } = request.auth.credentials;
            const { playlistId, any } = request.params;

            if(any !== 'songs') {
                throw new NotFoundError('Resource not found');           
            }
            const { songId } = request.payload;
            await this._playlistsService.verifyPlaylistOwner(playlistId, credentialId);
            await this._playlistSongsService.deleteSongFromPlaylist(playlistId, songId);
            return{
                status: 'success',
                message: 'Playlist lagu berhasil dihapus.',
            };
        } catch(error) {
            if(error instanceof ClientError){
                const response = h.response({
                    status: 'fail',
                    message: error.message,
                });
                response.code(error.statusCode);
                return response;
            }
            const response = h.response({
                status: 'error',
                message: 'Maaf, terjadi kegagalan pada server kami.',
            });
            response.code(500);
            console.error(error);
            return response;
        }
    }
}
module.exports = PlaylistSongsHandler;