#!/usr/bin/env node
const fs = require('fs-extra');
const execa = require('execa');
const path = require('path');

const pkg = require(path.join(__dirname, '../package.json'));
const wd = path.join(__dirname, '../standalone');
const v = pkg.version;
const name = pkg.name;

const plats = ['macos', 'win.exe', 'linux'];
const repo = 'github.com/taoyuan/homebrew-tap';

const brewFormula = (sha, ver) => `
VER = "${ver}"
SHA = "${sha}"

class Coge < Formula
  desc "An efficient code generator."
  homepage "http://www.coge.dev"
  url "https://github.com/cogejs/coge/releases/download/v#{VER}/coge.macos.v#{VER}.tar.gz"
  version VER
  sha256 SHA

  def install
    bin.install "coge"
  end
end
`;

async function main() {
  for (const plat of plats) {
    console.log(`standalone: packing ${plat}`);
    const file = `${name}-${plat}`;

    await fs.remove(`${wd}/tar-${file}`);
    await fs.mkdir(`${wd}/tar-${file}`);
    // give Windows special treatment: it should be a zip file and keep an .exe suffix
    if (plat === 'win.exe') {
      await fs.move(`${wd}/${file}`, `${wd}/tar-${file}/coge.exe`);
      await execa(
        `cd ${wd}/tar-${file} && zip ../coge.${plat}.v${v}.zip coge.exe`,
        {shell: true},
      );
    } else {
      await fs.move(`${wd}/${file}`, `${wd}/tar-${file}/coge`);
      await execa(
        `cd ${wd}/tar-${file} && tar -czvf ../coge.${plat}.v${v}.tar.gz coge`,
        {shell: true},
      );
    }
    await fs.remove(`${wd}/tar-${file}`);
  }

  console.log('standalone: done.');
  console.log((await execa(`ls ${wd}`, {shell: true})).stdout);

  console.log('standalone: publishing to homebrew tap...');
  const matches = (
    await execa(`shasum -a 256 ${wd}/coge.macos.v${v}.tar.gz`, {shell: true})
  ).stdout.match(/([a-f0-9]+)\s+/);
  console.log(matches);
  if (matches && matches.length > 1) {
    const sha = matches[1];
    await fs.writeFile('/tmp/coge.rb', brewFormula(sha, v));
    const cmd = [
      `cd /tmp`,
      `git clone git://${repo} brew-tap`,
      `cd brew-tap`,
      `mv /tmp/coge.rb .`,
      `git config user.email towyuan@outlook.com`,
      `git config user.name 'Tao Yuan'`,
      `git add .`,
      `git commit -m 'coge: auto-release'`,
      `git push https://${process.env.GITHUB_TOKEN}@${repo}`,
    ].join(' && ');
    console.log((await execa(cmd, {shell: true})).stdout);
    console.log('standalone: publish done.');
  }
}

main().catch(console.error);
