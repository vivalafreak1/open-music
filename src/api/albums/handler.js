const { response } = require("@hapi/hapi/lib/validation");

const ClientError = require("../../exceptions/ClientError");

class AlbumsHandler {
    constructor(service, validator, storageService, uploadValidator) {
        this._service = service;
        this._validator = validator;
        this._storageService = storageService;
        this._uploadValidator = uploadValidator;
        
        this.postAlbumHandler = this.postAlbumHandler.bind(this);
        this.getAlbumByIdHandler = this.getAlbumByIdHandler.bind(this);
        this.putAlbumByIdHandler = this.putAlbumByIdHandler.bind(this);
        this.deleteAlbumByIdHandler = this.deleteAlbumByIdHandler.bind(this);
        this.postAlbumCoverHandler = this.postAlbumCoverHandler.bind(this);
        this.postAlbumLikeHandler = this.postAlbumLikeHandler.bind(this);
        this.getAlbumLikeHandler = this.getAlbumLikeHandler.bind(this);
    }

    async postAlbumHandler(request, h) {
        try { 
            this._validator.validateAlbumPayload(request.payload);
            const { name, year } = request.payload;

            const albumId = await this._service.addAlbum( { name, year });

            const response = h.response ({
                status: 'success',
                message: 'Album berhasil ditambahkan',
                data: {
                    albumId,
                },
            });
            response.code(201);
            return response;
        } catch(error){
            if(error instanceof ClientError) {
                const response = h.response ({
                    status: 'fail',
                    message: error.message,
                });
                response.code(error.statusCode);
                return response;
            }

            //SERVER ERROR!
            const response = h.response ({
                status: 'error',
                message: 'Maaf, terjadi kegagalan pada server kami.',
            });
            response.code(500);
            console.error(error);
            return response;
        }
    }

    async getAlbumByIdHandler(request, h) {
        try {
            const { id } = request.params;
            const album = await this._service.getAlbumById(id);
            return {
                status: 'success',
                data: {
                    album,
                },
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

    async putAlbumByIdHandler(request, h){
        try {
            this._validator.validateAlbumPayload(request.payload);
            const { id } = request.params;
            const { name, year } = request.payload;

            await this._service.editAlbumById(id, { name, year });

            return {
                status: 'success',
                message: 'Album berhasil diperbarui',
            };
        } catch (error){
            if(error instanceof ClientError) {
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

    async deleteAlbumByIdHandler(request, h) {
        try {
            const { id } = request.params;

            await this._service.deleteAlbumById(id);
            return {
                status: 'success',
                message: 'Album berhasil dihapus',
            };

        } catch(error) {
            if(error instanceof ClientError) {
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
                message: 'Maaf, terjadi kagagalan pada server kami.',
            });
            response.code(500);
            console.error(error);
            return response;
        }
    }

    //Album Cover
    async postAlbumCoverHandler(request, h){
        try{
            const { cover } = request.payload;
            const { id } = request.params;

            this._uploadValidator.validateImageHeaders(cover.hapi.headers);

            const filename = await this._storageService.writeFile(cover, cover.hapi);
            const path = `http://${process.env.HOST}:${process.env.PORT}/upload/images/${filename}`;
            await this._service.addAlbumCover(id, path);
            const response = h.response({
                status: 'success',
                message: 'Sampul berhasil diunggah',
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

    //Album like
    async postAlbumLikeHandler(request, h){
        try{
            const { id: albumId } = request.params;
            const { id: userId } = request.auth.credentials;

            await this._service.getAlbumById(albumId);

            await this._service.addLikeAlbum(albumId, userId);
            const response = h.response({
                status: 'success',
                message: 'Berhasil menyukai album ini',
            });
            response.code(201);
            return response;
        }catch(error){
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

    async getAlbumLikeHandler(request, h){
        try{
            const { id } = request.params;
            const { likes, isCache } = await this._service.getLikeAlbum(id);
            const response = h.response({
                status: 'success',
                data: {
                    likes: likes.length,
                },
            });
            response.code(200);
            
            if(isCache) response.header('X-Data-Source', 'cache');

            return response;
        }catch(error){
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

module.exports = AlbumsHandler;