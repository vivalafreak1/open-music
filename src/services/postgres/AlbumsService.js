const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const { mapDBToModel } = require('../../utils/albums');

class AlbumsService {
    constructor(cacheService) { 
        this._pool = new Pool();
        this._cacheService = cacheService;
    }

    async addAlbum( { name, year } ) {
        const id = `album-${nanoid(16)}`;

        const query = {
            text: 'INSERT INTO albums VALUES($1, $2, $3) RETURNING id',
            values: [id, name, year],
        };

        const result = await this._pool.query(query);

        if(!result.rows[0].id){
            throw new InvariantError('Album gagal ditambahkan');
        }

        return result.rows[0].id;
    }

    async getAlbumById(id) {
        const query = {
            text: 'SELECT * FROM albums WHERE id = $1',
            values: [id],
        };
        const result = await this._pool.query(query);

        if(!result.rows.length){
            throw new NotFoundError('Album tidak ditemukan');
        }

        return result.rows.map(mapDBToModel)[0];
    }

    async editAlbumById(id, { name, year }) {
        const query = {
            text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
            values: [ name, year, id],
        };

        const result = await this._pool.query(query);

        if(!result.rows.length) {
            throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
        }
    }

    async deleteAlbumById(id) {
        const query = {
            text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
            values: [id],
        };

        const result = await this._pool.query(query);

        if(!result.rows.length) {
            throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
        }
    }

    //cover albums
    async addAlbumCover(albumId, coverUrl){
        const query = {
            text: 'UPDATE albums SET "coverUrl" = $1 WHERE id = $2 RETURNING id',
            values: [coverUrl, albumId],
        };
        const result = await this._pool.query(query);

        if(!result.rows.length){
            throw new InvariantError('Cover gagal ditambahkan');
        }

        await this._cacheService.delete(`album:${albumId}`);
    }

    //like albums
    async addLikeAlbum(albumId, userId){
        const getLikeQuery = {
            text: 'SELECT * FROM userslikealbum WHERE albumid = $1 AND userid = $2',
            values: [albumId, userId],
        };
        const getLikeResult = await this._pool.query(getLikeQuery);

        if(!getLikeResult.rowCount){
            const id = `likes-${nanoid(16)}`;
            const insertLikeQuery = {
                text: 'INSERT INTO userslikealbum(id, userid, albumid) VALUES($1, $2, $3)',
                values: [id, userId, albumId],
            };
            const insertLikeResult = await this._pool.query(insertLikeQuery);

            if(!insertLikeResult.rowCount){
                throw new InvariantError('Like gagal ditambahkan');
            }
        } else{
            //dislike album
            const deleteLikeQuery = {
                text: 'DELETE FROM userslikealbum WHERE albumid = $1 AND userid = $2',
                values: [albumId, userId],
            };
            const deleteLikeResult = await this._pool.query(deleteLikeQuery);

            if(!deleteLikeResult.rowCount){
                throw new InvariantError('Dislike gagal');
            }
        }
        await this._cacheService.delete(`likes:${albumId}`);
    }

    async getLikeAlbum(albumId){
        try{
            //get cache
            const result = await this._cacheService.get(`likes:${albumId}`);
            return { likes: JSON.parse(result), isCache: 1 };
        } catch(error){
            //Jika cache gak ada
            const query = {
                text: 'SELECT * FROM userslikealbum WHERE albumid = $1',
                values: [albumId],
            };
            const result = await this._pool.query(query);

            //Simpan di cache
            await this._cacheService.set(
                `likes:${albumId}`,
                JSON.stringify(result.rows),
            );
            return { likes: result.rows };
        }
    }
}

module.exports = AlbumsService;