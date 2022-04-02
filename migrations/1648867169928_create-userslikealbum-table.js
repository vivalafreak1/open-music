exports.up = pgm => {
    pgm.createTable('userslikealbum', {
        id: {
            type: 'VARCHAR(50)',
            primaryKey: true,
        },
        userid: {
            type: 'VARCHAR(50)',
            references: 'users',
            onDelete: 'cascade',
        },
        albumid: {
            type: 'VARCHAR(50)',
            references: 'albums',
            onDelete: 'cascade',
        },
    });
};

exports.down = pgm => {
    pgm.dropTable('userslikealbum');
};
