const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const { nanoid } = require('nanoid');
const notFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');
const NotFoundError = require('../../exceptions/NotFoundError');

class PlaylistsService{
    constructor() {
        this._pool = new Pool();
    }

    async addPlaylist({ name, owner }){
        const id = `playlist-${nanoid(16)}`;
        const query = {
            text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
            values: [id, name, owner]
        };
        const result = await this._pool.query(query);

        if(!result.rows[0].id){
            throw new InvariantError('Playlist gagal ditambahkan');
        }
        return result.rows[0].id;
    }

    async getPlaylists(owner) {
        const query = { 
            text: `SELECT playlists.id, playlists.name, users.username
            FROM playlists
            LEFT JOIN users ON users.id = playlists.owner
            WHERE playlists.owner = $1`,
            values: [owner],
        };
        const result = await this._pool.query(query);
        return result.rows;
    }

    async getPlaylistsForSong(playlistId, owner) {
        const query = {
            text: `SELECT playlists.*, users.username FROM playlists
            LEFT JOIN users ON playlists.owner = users.id
            WHERE playlists.id = $2 AND playlists.owner = $1`,
            values: [owner, playlistId],
        };
        const result = await this._pool.query(query);
        return result.rows[0];
    }

    async deletePlaylistById(id, credentialId) {
        const query = {
            text: 'DELETE FROM playlists WHERE id = $1 AND owner = $2 RETURNING id',
            values: [id, credentialId],
        };
        const result = await this._pool.query(query);
        if(!result.rows.length){
            throw new NotFoundError('Playlist gagal dihapus. Id tidak ditemukan');
        }
    }

    async verifyPlaylistOwner(playlistId, owner) {
        const query = {
            text: 'SELECT * FROM playlists WHERE id = $1',
            values: [playlistId],
        };

        const result = await this._pool.query(query);
        if(result.rows.length === 0){
            throw new NotFoundError('Playlist tidak ditemukan');
        }
        const playlist = result.rows[0];
        if(playlist.owner !== owner){
            throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
        }
    }
}

module.exports = PlaylistsService;