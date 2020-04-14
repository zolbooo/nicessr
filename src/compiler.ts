import webpack from 'webpack';
import chokidar from 'chokidar';

function handlePageUpdate(path: string) {
  const page = path.slice('src/pages'.length).split('.').slice(0, -1).join('.');
  console.log(`⚡️ Page ${page} updated, recompiling`);
}

const pagesWatcher = chokidar
  .watch('./src/pages')
  .on('change', handlePageUpdate);

process.on('SIGINT', () => {
  pagesWatcher.close();
});
