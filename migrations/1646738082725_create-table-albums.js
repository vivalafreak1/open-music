exports.up = (pgm) => {
    pgm.createTable('albums', {
      id: {
        type: 'VARCHAR(50)',
        primaryKey: true,
      },
      name: {
        type: 'TEXT',
        notNull: true,
      },
      year: {
        type: 'INTEGER',
        notNull: true,
      },
      coverUrl: {
        type: 'VARCHAR(255)',
      },
    });
  };
  
  exports.down = (pgm) => {
    pgm.dropTable('albums');
};