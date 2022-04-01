const InvariantError = require('../../exceptions/InvariantError');
const { ImageAlbumsCoverSchema } = require('./schema');

const UploadsValidator = {
    validateImageHeaders: (headers) => {
        const validationResult = ImageAlbumsCoverSchema.validate(headers);

        if(!validationResult.error){
            throw new InvariantError(validationResult.error.message);
        }
    },
};

module.exports = UploadsValidator;