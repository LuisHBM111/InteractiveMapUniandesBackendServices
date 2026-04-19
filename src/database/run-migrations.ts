import 'reflect-metadata';
import dataSource from './data-source';

async function runMigrations() {
  await dataSource.initialize();
  await dataSource.runMigrations();
  await dataSource.destroy();
}

runMigrations()
  .then(() => {
    console.log('Database migrations completed successfully.');
  })
  .catch((error) => {
    console.error('Database migration execution failed.', error);
    process.exit(1);
  });
