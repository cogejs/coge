import {join} from 'path';
import {readFileSync} from 'fs';
import cac from 'cac';

export async function cli(argv: string[]): Promise<void> {
  const program = cac('coge');

  program
    .option('--debug', 'Display debug logs')
    .option('-v, --version', 'Display coge version')
    .option('-h, --help', 'Display coge usages');

  program.parse(process.argv, {run: false});

  if (program.options.version && program.args.length === 0) {
    const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));
    console.log(`coge: ${pkg.version}`);
    console.log(`node: ${process.versions.node}`);
    console.log(`os: ${process.platform}`);
  } else if (program.matchedCommand?.name !== '' && program.options.help) {
    program.outputHelp();
  } else {
    await program.runMatchedCommand();
  }
}

if (require.main === module) {
  cli(process.argv).catch(console.error);
}
