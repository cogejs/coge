import assign from 'tily/assign';
import dargs from 'dargs';
import chalk from 'chalk';
import fse from 'fs-extra';
import {Constructor} from '../types';

export interface InstallOptions {
  npm?: boolean | Record<string, any>;
  bower?: boolean | Record<string, any>;
  yarn?: boolean | Record<string, any>;
  skipMessage?: boolean;
}

export function InstallMixin<T extends Constructor<any>>(superClass: T) {
  return class extends superClass {
    opts: any;

    constructor(...args: any[]) {
      super(...args);
    }

    /**
     * Runs `npm` and `bower`, in sequence, in the generated directory and prints a
     * message to let the user know.
     *
     * @example
     * this.installDependencies({
     *   bower: true,
     *   npm: true
     * });
     *
     * @example
     * this.installDependencies({
     *   yarn: {force: true},
     *   npm: false
     * });
     *
     * @param {Object} [options]
     * @param {Boolean|Object} [options.npm=true] - whether to run `npm install` or can be options to pass to `dargs` as arguments
     * @param {Boolean|Object} [options.bower=true] - whether to run `bower install` or can be options to pass to `dargs` as arguments
     * @param {Boolean|Object} [options.yarn=false] - whether to run `yarn install` or can be options to pass to `dargs` as arguments
     * @param {Boolean} [options.skipMessage=false] - whether to log the used commands
     */
    async installDependencies(options?: InstallOptions) {
      options = options ?? {};
      const msg = {
        commands: <string[]>[],
        template: ({skipInstall, commands}: any) => `
I'm all done. ${skipInstall ? 'Just run' : 'Running'} ${commands} \
${skipInstall ? '' : 'for you '}to install the required dependencies.\
${skipInstall ? '' : ' If this fails, try running the command yourself.'}
`,
      };

      const getOptions = (o: any) => {
        return typeof o === 'object' ? o : null;
      };

      if (options.npm !== false) {
        msg.commands.push('npm install');
        await this.npmInstall(null, getOptions(options.npm));
      }

      if (options.yarn) {
        msg.commands.push('yarn install');
        await this.yarnInstall(null, getOptions(options.yarn));
      }

      if (options.bower) {
        msg.commands.push('bower install');
        await this.bowerInstall(null, getOptions(options.bower));
      }

      if (!msg.commands.length)
        throw new Error(
          'installDependencies needs at least one of `npm`, `bower` or `yarn` to run.',
        );

      if (!options.skipMessage) {
        const tplValues = assign(
          {
            skipInstall: false,
          },
          this.opts,
          {
            commands: chalk.yellow.bold(msg.commands.join(' && ')),
          },
        );
        this.log(msg.template(tplValues));
      }
    }

    /**
     * Combine package manager cmd line arguments and run the `install` command.
     *
     * During the `install` step, every command will be scheduled to run once, on the
     * run loop.
     *
     * @param {String} installer Which package manager to use
     * @param {String|Array} [paths] Packages to install. Use an empty string for `npm install`
     * @param {Object} [options] Options to pass to `dargs` as arguments
     * @param {Object} [spawnOptions] Options to pass `child_process.spawn`. ref
     *                                https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
     */
    async scheduleInstall(
      installer: string,
      paths: string | string[] | null | undefined,
      options: Record<string, any>,
      spawnOptions?: Record<string, any>,
    ) {
      options = options ?? {};
      spawnOptions = spawnOptions ?? {};
      paths = Array.isArray(paths) ? paths : paths?.split(' ') ?? [];

      let args: string[] = ['install'].concat(paths).concat(dargs(options));

      // Yarn uses the `add` command to specifically add a package to a project
      if (installer === 'yarn' && paths.length > 0) {
        args[0] = 'add';
      }

      // Only for npm, use a minimum cache of one day
      if (installer === 'npm') {
        args = args.concat(['--cache-min', (24 * 60 * 60).toString()]);
      }

      // Return early if we're skipping installation
      if (this.opts.skipInstall || this.opts['skip-install']) {
        this.log(
          'Skipping install command: ' +
            chalk.yellow(installer + ' ' + args.join(' ')),
        );
        return;
      }

      try {
        await this.spawn(installer, args, spawnOptions);
        // this.log(installer + ' ' + args.join(' ') + ' ' + JSON.stringify(spawnOptions));
      } catch (e: any) {
        if (
          e.exitStatus &&
          e.exitSignal &&
          (this.opts.forceInstall || this.opts['force-install'])
        ) {
          throw new Error(
            `Installation of ${installer} failed with code ${
              e.exitStatus || e.exitSignal
            }`,
          );
        }
        this.log(
          chalk.red('Could not finish installation. \n') +
            'Please install ' +
            installer +
            ' with ' +
            chalk.yellow('npm install -g ' + installer) +
            ' and try again. \n' +
            'If ' +
            installer +
            ' is already installed, try running the following command manually: ' +
            chalk.yellow(installer + ' ' + args.join(' ')),
        );
        if (this.opts.forceInstall || this.opts['force-install']) {
          throw e;
        }
      }
    }

    /**
     * Receives a list of `components` and an `options` object to install through bower.
     *
     * The installation will automatically run during the run loop `install` phase.
     *
     * @param {String|Array} [cmpnt] Components to install
     * @param {Object} [options] Options to pass to `dargs` as arguments
     * @param {Object} [spawnOptions] Options to pass `child_process.spawn`.
     */
    async bowerInstall(
      cmpnt: string | string[] | null,
      options: any,
      spawnOptions?: any,
    ) {
      return this.scheduleInstall('bower', cmpnt, options, spawnOptions);
    }

    /**
     * Receives a list of `packages` and an `options` object to install through npm.
     *
     * The installation will automatically run during the run loop `install` phase.
     *
     * @param {String|Array} [pkgs] Packages to install
     * @param {Object} [options] Options to pass to `dargs` as arguments
     * @param {Object} [spawnOptions] Options to pass `child_process.spawn`.
     */
    async npmInstall(
      pkgs: string | string[] | null,
      options: any,
      spawnOptions?: any,
    ) {
      return this.scheduleInstall('npm', pkgs, options, spawnOptions);
    }

    /**
     * Receives a list of `packages` and an `options` object to install through yarn.
     *
     * The installation will automatically run during the run loop `install` phase.
     *
     * @param {String|Array} [pkgs] Packages to install
     * @param {Object} [options] Options to pass to `dargs` as arguments
     * @param {Object} [spawnOptions] Options to pass `child_process.spawn`.
     */
    async yarnInstall(
      pkgs: string | string[] | null,
      options: any,
      spawnOptions?: any,
    ) {
      await this.yarnUpgrade(spawnOptions);
      return this.scheduleInstall('yarn', pkgs, options, spawnOptions);
    }

    async yarnUpgrade(spawnOptions?: any) {
      // upgrade yarn from 1.x
      if (!fse.existsSync('.yarn')) {
        await this.spawn('yarn', ['set', 'version', 'berry'], spawnOptions);
        await this.spawn('yarn', ['set', 'version', 'stable'], spawnOptions);
        await this.spawn(
          'yarn',
          ['plugin', 'import', 'interactive-tools'],
          spawnOptions,
        );
        await this.spawn('git', ['add', '.yarn'], spawnOptions);
      }
    }
  };
}
