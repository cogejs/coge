import debugFactory from 'debug';
import * as fs from 'fs-extra';
import {sync as globbySync} from 'globby';
import * as path from 'path';
import {filter} from 'tily/array/filter';
import toArray from 'tily/array/toArray';
import {uniq} from 'tily/array/uniq';
import {identity} from 'tily/function/identity';

import {resolveNpmRoot, resolveYarnBase} from './paths';

const debug = debugFactory('coge:environment');

const win32 = process.platform === 'win32';
const nvm = process.env.NVM_HOME;

const PROJECT_ROOT = path.join(__dirname, '..');
const PACKAGE_NAME = require(path.join(PROJECT_ROOT, 'package.json')).name;

interface Alias {
  match: RegExp;
  value: string;
}

export interface PackageLookupOptions {
  localOnly: boolean;
  packagePaths: string | string[];
  npmPaths: string | string[];
  filePatterns: string | string[];
  packagePatterns: string | string[];
  reverse: boolean;
  globbyDeep: number;
}

export interface Package {
  filePath: string;
  packagePath: string;
}

export class PackageLookup {
  /**
   * Search for npm packages.
   *
   * @private
   * @method
   *
   * @param {boolean|Object} [options]
   * @param {boolean} [options.localOnly = false] - Set true to skip lookups of
   *                                               globally-installed generators.
   * @param {string|Array} [options.packagePaths] - Paths to look for generators.
   * @param {string|Array} [options.npmPaths] - Repository paths to look for generators packages.
   * @param {string|Array} [options.filePatterns='*\/index.js'] - File pattern to look for.
   * @param {string|Array} [options.packagePatterns='lookup'] - Package pattern to look for.
   * @param {boolean} [options.reverse = false] - Set true reverse npmPaths/packagePaths order
   * @param {function}     [find]  Executed for each match, return true to stop lookup.
   */
  sync(options: Partial<PackageLookupOptions> | boolean = {}, find = (module: any) => module): Package[] {
    if (typeof options === 'boolean') {
      options = {localOnly: options};
    }
    debug('Running lookup with options: %o', options);
    const opts = <PackageLookupOptions>options;
    opts.filePatterns = opts.filePatterns || 'package.json';

    if (opts.packagePaths) {
      opts.packagePaths = toArray(opts.packagePaths);
      if (opts.reverse) {
        opts.packagePaths = opts.packagePaths.reverse();
      }
    } else {
      opts.npmPaths = opts.npmPaths || this.getNpmPaths(opts);
      opts.npmPaths = Array.isArray(opts.npmPaths) ? opts.npmPaths : [opts.npmPaths];
      if (opts.reverse) {
        opts.npmPaths = opts.npmPaths.reverse();
      }
      opts.packagePaths = this.findPackagesIn(opts.npmPaths, opts);
    }

    debug('Lookup calculated opts: %o', opts);

    const modules: Package[] = [];
    for (const packagePath of opts.packagePaths) {
      if (
        !fs.existsSync(packagePath) ||
        (!fs.lstatSync(packagePath).isDirectory() && !fs.lstatSync(packagePath).isSymbolicLink())
      ) {
        continue;
      }
      const founds = globbySync(opts.filePatterns, {
        cwd: packagePath,
        absolute: true,
        deep: opts.globbyDeep,
      });
      for (const filePath of founds) {
        const module = {filePath, packagePath};
        if (find(module)) {
          return [module];
        }
        modules.push(module);
      }
    }
    return modules;
  }

  /**
   * Search npm for every available generators.
   * Generators are npm packages who's name start with `gen-` and who're placed in the
   * top level `node_module` path. They can be installed globally or locally.
   *
   * @method
   * @private
   *
   * @param {Array} searchPaths List of search paths
   * @param {Object}  [options]
   * @param {string|string[]} [options.packagePatterns='gen-*'] - Pattern pattern.
   * @return {Array} List of the generator modules path
   */
  findPackagesIn(searchPaths: string[], options: {packagePatterns?: string | string[]} = {}) {
    const packagePatterns = options.packagePatterns ?? PACKAGE_NAME;

    // Remove undefined values and convert paths to absolute
    searchPaths = searchPaths.filter(npmPath => npmPath).map(npmPath => path.resolve(npmPath));

    let modules: string[] = [];
    for (const root of searchPaths) {
      if (!fs.existsSync(root) || !fs.lstatSync(root).isDirectory()) {
        continue;
      }
      // Some folders might not be readable to the current user. For those, we add a try
      // catch to handle the error gracefully as globby doesn't have an option to skip
      // restricted folders.
      try {
        modules = modules.concat(
          globbySync(packagePatterns, {
            cwd: root,
            expandDirectories: false,
            onlyDirectories: true,
            absolute: true,
            deep: 0,
          }),
        );

        // To limit recursive lookups into non-namespace folders within globby,
        // fetch all namespaces in root, then search each namespace separately
        // for generator modules
        const scopes = globbySync(['@*'], {
          cwd: root,
          expandDirectories: false,
          onlyDirectories: true,
          absolute: true,
          deep: 0,
        });

        for (const scope of scopes) {
          modules = modules.concat(
            globbySync(packagePatterns, {
              cwd: scope,
              expandDirectories: false,
              onlyDirectories: true,
              absolute: true,
              deep: 0,
            }),
          );
        }
      } catch (error) {
        debug('Could not access %s (%s)', root, error);
      }
    }

    return modules;
  }

  /**
   * Get the npm lookup directories (`node_modules/`)
   *
   * @method
   * @private
   *
   * @param {boolean|Object} [options]
   * @param {boolean} [options.localOnly = false] - Set true to skip lookups of
   *                                               globally-installed generators.
   * @param {boolean} [options.filterPaths = false] - Remove paths that don't ends
   *                       with a supported path (don't touch at NODE_PATH paths).
   * @return {Array} lookup paths
   */
  getNpmPaths(
    options:
      | {
          localOnly?: boolean;
          filterPaths?: boolean;
        }
      | boolean = {},
  ) {
    // Resolve signature where options is boolean (localOnly).
    if (typeof options === 'boolean') {
      options = {localOnly: options};
    }
    // Start with the local paths.
    let paths = this._getLocalNpmPaths();

    // Append global paths, unless they should be excluded.
    if (!options.localOnly) {
      paths = paths.concat(this._getGlobalNpmPaths(options.filterPaths));
    }

    return uniq(paths);
  }

  /**
   * Get the local npm lookup directories
   * @private
   * @return {Array} lookup paths
   */
  _getLocalNpmPaths() {
    const paths: string[] = [];

    // Walk up the CWD and add `node_modules/` folder lookup on each level
    process
      .cwd()
      .split(path.sep)
      .forEach((part, i, parts) => {
        let lookup = path.join(...parts.slice(0, i + 1), 'node_modules');

        if (!win32) {
          lookup = `/${lookup}`;
        }

        paths.push(lookup);
      });

    return uniq(paths.reverse());
  }

  /**
   * Get the global npm lookup directories
   * Reference: https://nodejs.org/api/modules.html
   * @private
   * @return {Array} lookup paths
   */
  _getGlobalNpmPaths(filterPaths = true) {
    let paths: string[] = [];

    // Node.js will search in the following list of GLOBAL_FOLDERS:
    // 1: $HOME/.node_modules
    // 2: $HOME/.node_libraries
    // 3: $PREFIX/lib/node
    const filterValidNpmPath = function (p: string, ignore = false) {
      return ignore
        ? p
        : ['/node_modules', '/.node_modules', '/.node_libraries', '/node'].find(dir => p.endsWith(dir))
          ? p
          : '';
    };

    // Default paths for each system
    if (nvm) {
      paths.push(path.join(process.env.NVM_HOME!, process.version, 'node_modules'));
    } else if (win32) {
      paths.push(path.join(process.env.APPDATA!, 'npm/node_modules'));
    } else {
      paths.push('/usr/lib/node_modules');
      paths.push('/usr/local/lib/node_modules');
    }

    // Add NVM prefix directory
    if (process.env.NVM_PATH) {
      paths.push(path.join(path.dirname(process.env.NVM_PATH), 'node_modules'));
    }

    // Adding global npm directories
    // We tried using npm to get the global modules path, but it haven't work out
    // because of bugs in the parseable implementation of `ls` command and mostly
    // performance issues. So, we go with our best bet for now.
    if (process.env.NODE_PATH) {
      paths = filter(x => !!identity(x), process.env.NODE_PATH.split(path.delimiter)).concat(paths);
    }

    // Global node_modules should be 4 or 2 directory up this one (most of the time)
    // Ex: /usr/another_global/node_modules/coge-denerator/node_modules/@coge/environment/lib (1 level dependency)
    paths.push(filterValidNpmPath(path.join(PROJECT_ROOT, '../../..'), !filterPaths));
    // Ex: /usr/another_global/node_modules/@coge/environment/lib (installed directly)
    paths.push(path.join(PROJECT_ROOT, '..'));

    // Get yarn global directory and infer the module paths from there
    const bases = resolveYarnBase();
    for (const p of bases) {
      paths.push(path.resolve(p, 'node_modules'));
      paths.push(path.resolve(p, '../link/'));
    }

    // Get npm global prefix and infer the module paths from there
    const roots = resolveNpmRoot();
    for (const p of roots) {
      paths.push(path.resolve(p));
    }

    // Adds support for generator resolving when @coge/generator has been linked
    if (process.argv[1]) {
      paths.push(filterValidNpmPath(path.join(path.dirname(process.argv[1]), '../..'), !filterPaths));
    }

    return uniq(paths.filter(identity).reverse());
  }
}

export interface LookupOptions {
  localOnly: boolean;
  lookups: string[];
  packagePaths: string | string[];
  npmPaths: string | string[];
  filePatterns: string | string[];
  packagePatterns: string | string[];
  reverse: boolean;
  globbyDeep: number;
  singleResult: boolean;
  filterPaths: boolean;
}

export interface GeneratorItem {
  generatorPath: string;
  packagePath: string;
  namespace: string;
  registered: boolean;
}

export abstract class Resolver {
  protected packageLookup: PackageLookup;
  protected aliases: Alias[];
  protected lookups: string[];

  protected constructor() {
    this.packageLookup = new PackageLookup();
  }

  abstract namespace(filepath: string, lookups?: string[]): string;

  abstract register(name: string, namespace: string, packagePath?: string): this;

  /**
   * Search for generators and their sub generators.
   *
   * A generator is a `:lookup/:name/index.js` file placed inside an npm package.
   *
   * Defaults lookups are:
   *   - ./
   *   - generators/
   *   - lib/generators/
   *
   * So this index file `node_modules/gen-dummy/lib/generators/yo/index.js` would be
   * registered as `dummy:coge` generator.
   *
   * @param {boolean|Object} [options]
   * @param {boolean} [options.localOnly = false] - Set true to skip lookups of
   *                                               globally-installed generators.
   * @param {string|Array} [options.packagePaths] - Paths to look for generators.
   * @param {string|Array} [options.npmPaths] - Repository paths to look for generators packages.
   * @param {string|Array} [options.filePatterns='*\/index.js'] - File pattern to look for.
   * @param {string|Array} [options.packagePatterns='gen-*'] - Package pattern to look for.
   * @param {boolean}      [options.singleResult=false] - Set true to stop lookup on the first match.
   * @param {Number}       [options.globbyDeep] - Deep option to be passed to globby.
   * @return {Object[]} List of generators
   */
  lookup(options: Partial<LookupOptions> | boolean = {localOnly: false}) {
    let opts: LookupOptions;
    // Resolve signature where options is omitted.
    if (typeof options === 'boolean') {
      opts = <LookupOptions>{localOnly: options};
    } else {
      opts = <LookupOptions>(options || {});
    }

    const lookups: string[] = opts.lookups || this.lookups;
    // generators should be after, last will override registered one.
    opts.filePatterns =
      opts.filePatterns ||
      lookups.reduce((acc, prefix) => acc.concat([path.join(prefix, '*/template.toml')]), <string[]>[]);

    // Backward compatibility
    opts.filterPaths = opts.filterPaths === undefined ? false : opts.filterPaths;
    opts.packagePatterns = opts.packagePatterns || 'gen-*';
    // We want to register high priorities packages after.
    opts.reverse = opts.reverse === undefined ? !opts.singleResult : opts.reverse;

    const generators: GeneratorItem[] = [];
    this.packageLookup.sync(opts, module => {
      const generatorPath = module.filePath;
      const packagePath = module.packagePath;
      let repositoryPath = path.join(packagePath, '..');
      if (path.basename(repositoryPath).startsWith('@')) {
        // Scoped package
        repositoryPath = path.join(repositoryPath, '..');
      }
      const namespace = this.namespace(path.relative(repositoryPath, generatorPath), lookups);

      const registered = this._tryRegistering(generatorPath, packagePath, namespace);
      generators.push({generatorPath, packagePath, namespace, registered});
      return opts.singleResult && registered;
    });

    return generators;
  }

  /**
   * Search npm for every available generators.
   * Generators are npm packages who's name start with `gen-` and who're placed in the
   * top level `node_module` path. They can be installed globally or locally.
   *
   * @deprecated
   * @method
   *
   * @param {Array}  searchPaths List of search paths
   * @param {Object}  [options]
   * @param {boolean} [options.packagePatterns='gen-*'] - Pattern pattern.
   * @return {Array} List of the generator modules path
   */
  findGeneratorsIn(searchPaths: string | string[], options: {packagePatterns?: string} | string = {}) {
    if (typeof options === 'string') {
      options = {packagePatterns: options};
    }

    options.packagePatterns = options.packagePatterns ?? 'gen-*';
    searchPaths = Array.isArray(searchPaths) ? searchPaths : [searchPaths];

    return this.packageLookup.findPackagesIn(searchPaths, options);
  }

  /**
   * Try registering a GeneratorEntry to this environment.
   *
   * @private
   *
   * @param  {String} generatorReference A generator reference, usually a file path.
   * @param  {String} [packagePath] - GeneratorEntry's package path.
   * @param  {String} [namespace] - namespace of the generator.
   * @return {boolean} true if the generator have been registered.
   */
  _tryRegistering(generatorReference: string, packagePath?: string, namespace?: string) {
    const realPath = fs.realpathSync(generatorReference);

    try {
      debug('found %s, trying to register', generatorReference);

      if (!namespace && realPath !== generatorReference) {
        namespace = this.namespace(generatorReference);
      }

      this.register(realPath, namespace!, packagePath);
      return true;
    } catch (error) {
      console.error('Unable to register %s (Error: %s)', generatorReference, error.message);
      return false;
    }
  }

  /**
   * Get the npm lookup directories (`node_modules/`)
   *
   * @deprecated
   *
   * @param {boolean|Object} [options]
   * @param {boolean} [options.localOnly = false] - Set true to skip lookups of
   *                                               globally-installed generators.
   * @param {boolean} [options.filterPaths = false] - Remove paths that don't ends
   *                       with a supported path (don't touch at NODE_PATH paths).
   * @return {Array} lookup paths
   */
  getNpmPaths(
    options:
      | {
          localOnly?: boolean;
          filterPaths?: boolean;
        }
      | boolean = {},
  ) {
    // Resolve signature where options is boolean (localOnly).
    if (typeof options === 'boolean') {
      options = {localOnly: options};
    }

    // Backward compatibility
    options.filterPaths = options.filterPaths === undefined ? false : options.filterPaths;

    return this.packageLookup.getNpmPaths(options);
  }

  /**
   * Get or create an alias.
   *
   * Alias allows the `get()` and `lookup()` methods to search in alternate
   * filepath for a given namespaces. It's used for example to map `gen-*`
   * npm package to their namespace equivalent (without the gen- prefix),
   * or to default a single namespace like `angular` to `angular:app` or
   * `angular:all`.
   *
   * Given a single argument, this method acts as a getter. When both name and
   * value are provided, acts as a setter and registers that new alias.
   *
   * If multiple alias are defined, then the replacement is recursive, replacing
   * each alias in reverse order.
   *
   * An alias can be a single String or a Regular Expression. The finding is done
   * based on .match().
   *
   * @example
   *
   *     env.alias(/^([a-zA-Z0-9:\*]+)$/, 'gen-$1');
   *     env.alias(/^([^:]+)$/, '$1:app');
   *     env.alias(/^([^:]+)$/, '$1:all');
   *     env.alias('foo');
   *     // => gen-foo:all
   */
  alias(match: string | RegExp): string;
  alias(match: string | RegExp, value: string): this;
  alias(match: string | RegExp, value?: string) {
    if (match && value) {
      this.aliases.push({
        match: match instanceof RegExp ? match : new RegExp(`^${match}$`),
        value,
      });
      return this;
    }

    const aliases = this.aliases.slice(0).reverse();

    return aliases.reduce(
      (res, alias) => {
        if (!alias.match.test(res)) {
          return res;
        }

        return res.replace(alias.match, alias.value);
      },
      <string>match,
    );
  }
}
