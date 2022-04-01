//Import library
require('dotenv').config();

const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');

// albums
const albums = require('./api/albums');
const AlbumsService = require('./services/postgres/AlbumsService');
const AlbumsValidator = require('./validator/albums');

//songs
const songs = require('./api/songs');
const SongsService = require('./services/postgres/SongsService');
const SongsValidator = require('./validator/songs');

//users
const users = require('./api/users');
const UsersService = require('./services/postgres/UsersService');
const UserValidator = require('./validator/users');

//playlists
const playlists = require('./api/playlists');
const PlaylistsService = require('./services/postgres/PlaylistsService');
const PlaylistsValidator = require('./validator/playlists');

//playlist>song
const playlistSongs = require('./api/playlistsongs');
const PlaylistSongsService = require('./services/postgres/PlaylistSongsService');
const PlaylistSongValidator = require('./validator/playlistsongs');

// authentications
const authentications = require('./api/authentications');
const AuthenticationsService = require('./services/postgres/AuthenticationsService');
const TokenManager = require('./tokenize/TokenManager');
const AuthenticationsValidator = require('./validator/authentications');

// Exports
const _exports = require('./api/exports');
const ProducerService = require('./services/rabbitmq/ProducerService');
const ExportsValidator = require('./validator/exports');

//const ClientError = require('./exceptions/ClientError');

const init = async () => {
    const albumsService = new AlbumsService();
    const songsService = new SongsService();
    const usersService = new UsersService();
    const authenticationsService = new AuthenticationsService();
    const playlistsService = new PlaylistsService();
    const playlistsSongsService = new PlaylistSongsService();

    const server = Hapi.server({
        port: process.env.PORT,
        host: process.env.HOST,
        routes: {
            cors: {
                origin: ['*'],
            },
        },
    });

    //registrasi plugin eksternal
    await server.register([
      {
        plugin: Jwt,
      },
    ]);

    //Mendefinisikan strategi authentikasi jwt
    server.auth.strategy('openmusicapp_jwt', 'jwt', {
      keys: process.env.ACCESS_TOKEN_KEY,
      verify: {
        aud: false,
        iss: false,
        sub: false,
        maxAgeSec: process.env.ACCESS_TOKEN_AGE,
      },
      validate: (artifacts) => ({
        isValid: true,
        credentials: {
          id: artifacts.decoded.payload.id,
        },
      }),
    });

    await server.register([
        {
          plugin: albums,
            options: {
              service: albumsService,
              validator: AlbumsValidator,
            },
          },
          {
            plugin: songs,
            options: {
              service: songsService,
              validator: SongsValidator,
            },
          },
          {
            plugin: users,
            options: {
              service: usersService,
              validator: UserValidator,
            },
          },
          {
            plugin: authentications,
            options: {
              authenticationsService,
              usersService,
              tokenManager: TokenManager,
              validator: AuthenticationsValidator,
            },
          },
          {
            plugin: playlists,
            options: {
              service: playlistsService,
              validator: PlaylistsValidator,
            },
          },
          {
            plugin: playlistSongs,
            options: {
              playlistsSongsService: playlistsSongsService,
              playlistsService: playlistsService,
              songsService: songsService,
              validator: PlaylistSongValidator,
            },
          },
          {
            plugin: _exports,
            options: {
              service: ProducerService,
              validator: ExportsValidator,
            },
          },
    ]);
/*
    //biar gak perlu nulis lagi dihandler, lebih efisien
    server.ext('onPreResponse', (request, h) => {
      //mendapatkan konteks response dari request
      const { response } = request;
      if (response instanceof ClientError){
          //membuat response baru dari response toolkit sesuai kebutuhan error handling
          const newResponse = h.response({
            status: 'fail',
            message: response.message,
        });
        newResponse.code(response.statusCode);
        return newResponse;
      }
      // jika bukan ClientError, lanjutkan dengan response sebelumnya (tanpa terinvensi)
      return response.continue || response;
    })
*/
    await server.start();
    console.log(`Server berjalan pada ${server.info.uri}`);
};

init();