import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';
import { ncp } from 'ncp';

import type { Bundle } from '../compiler/bundler';

import { renderPage } from '../ssr/markup';
import { appContextBundleRef } from '../compiler/bundler/bundles';
import { buildPathClient, staticAssetsPath } from '../compiler';

async function exportPages() {
  const buildManifest = require(path.join(
    process.cwd(),
    '.nicessr',
    'build.manifest.json',
  ));
  if (!buildManifest) {
    console.error(
      `⛔️\tCannot find build manifest. Run ${process.argv[0]} build command to create production bundle.`,
    );
    process.exit(1);
  }

  await new Promise((resolve) =>
    rimraf(path.join(process.cwd(), 'out'), () => resolve()),
  );

  const pages: [string, Bundle][] = Object.entries(buildManifest);
  for (let i = 0; i < pages.length; i += 1) {
    const [page, bundle] = pages[i];
    console.log(`⚡️\tExporting page ${page}`);

    appContextBundleRef.current = bundle.appContext ?? [];
    const markup = await renderPage(page, null, bundle);

    await fs.promises.mkdir(
      path.join(...['out', ...page.split(path.sep).slice(0, -1)]),
    );
    await fs.promises.writeFile(path.join('out', `${page}.html`), markup, {
      encoding: 'utf-8',
    });
  }

  await new Promise((resolve, reject) =>
    ncp(buildPathClient, path.join('out', '.nicessr'), (err) =>
      err ? reject(err) : resolve(),
    ),
  );
  await new Promise((resolve, reject) =>
    ncp(staticAssetsPath, path.join('out', '.nicessr', 'static'), (err) =>
      err ? reject(err) : resolve(),
    ),
  );

  console.log('\n✅\tDone! Exported pages to out/ folder');
  process.exit(0);
}

exportPages();
