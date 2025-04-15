const path = require('path');

module.exports = {
  'config': path.resolve('config/config.json'),
  'models-path': path.resolve('src/**/*.model.ts'),
  'migrations-path': path.resolve('migrations'),
  'seeders-path': path.resolve('seeders')
};