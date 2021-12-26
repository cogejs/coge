#!/usr/bin/env node

/**
 * This is an internal script to update docs/site MONOREPO.md file with filling
 * up all packages with lexicographical order
 */
'use strict';

const path = require('path');
const fs = require('fs-extra');
const {Project} = require('@lerna/project');
const createMarkdownTable = require('markdown-table');

const MONOREPO_FILE_DIST = 'docs/site';
const MONOREPO_FILE_NAME = 'MONOREPO.md';

function getPackageRelativeUri(pkg) {
  return path.relative(pkg.rootPath, pkg.location);
}

async function getSortedPackages() {
  const project = new Project(process.cwd());
  const packages = await project.getPackages();
  packages.sort((p1, p2) =>
    getPackageRelativeUri(p1).localeCompare(getPackageRelativeUri(p2)),
  );
  return packages;
}

function getPackageFields(pkg) {
  const packageJson = fs.readJsonSync(path.join(pkg.location, 'package.json'));

  const relativeUri = getPackageRelativeUri(pkg);
  const pkgUrl = `https://github.com/strongloop/loopback-next/tree/master/${relativeUri}`;

  return [
    `[${relativeUri}](${pkgUrl})`,
    pkg.private ? '_(private)_' : pkg.name,
    packageJson.description,
  ];
}

function updateTable(packages) {
  const header = ['Package', 'npm', 'Description'];
  const rows = packages.map(getPackageFields);

  return createMarkdownTable([header, ...rows]);
}

async function updateMonorepoFile() {
  const packages = await getSortedPackages();
  const markdownTable = updateTable(packages);
  const monorepoFilePath = path.join(MONOREPO_FILE_DIST, MONOREPO_FILE_NAME);

  const content = [
    '<!-- Do not edit this file. It is automatically generated by update-monorepo-file script -->',
    '',
    '# Monorepo overview',
    '',
    'The [loopback-next](https://github.com/strongloop/loopback-next) repository uses',
    '[lerna](https://lernajs.io/) to manage multiple packages for LoopBack 4.',
    '',
    'Please run the following command to update packages information after adding new',
    'one in the monorepo: `npm run update-monorepo-file`',
    '',
    markdownTable,
    '',
    'We use npm scripts declared in',
    '[package.json](https://github.com/strongloop/loopback-next/blob/master/package.json)',
    'to work with the monorepo managed by lerna. See',
    '[Developing LoopBack](./DEVELOPING.md) for more details.',
  ].join('\n');

  fs.writeFileSync(monorepoFilePath, content + '\n', {encoding: 'utf-8'});
}

if (require.main === module) {
  updateMonorepoFile().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
