const ClientError = require('../../exceptions/ClientError');

class ExportsHandler{
    constructor(service, playlistsService, validator){
        this._service = service;
        this._validator = validator;
        this._playlistsService = playlistsService;

        this.postExportPlaylistsHandler = this.postExportPlaylistsHandler.bind(this);
    }

    async postExportPlaylistsHandler(request, h){
        try{
            this._validator.validateExportPlaylistsPayload(request.payload);

            const userId = request.auth.credentials.id;
            const playlistId = request.params.playlistId;

            //validasi pemilik
            await this._playlistsService.getPlaylists(playlistId);
            await this._playlistsService.verifyPlaylistOwner(playlistId, userId);

            const message = {
                playlistId,
                targetEmail: request.payload.targetEmail,
            };

            await this._service.sendMessage('export:playlists', JSON.stringify(message));

            const response = h.response({
                status: 'success',
                message: 'Permintaan Anda sedang kami proses',
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

            //SERVER ERROR!
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

module.exports = ExportsHandler;