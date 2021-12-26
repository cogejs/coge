# coge

[![build status](https://img.shields.io/travis/cogejs/coge/master.svg)](https://travis-ci.org/cogejs/coge)
[![npm version](https://img.shields.io/npm/v/coge.svg)](https://www.npmjs.com/package/coge)

> An efficient code generator.

`coge` is a fork of `hygen`. It aims to provide more flexible and efficient code
generator tool.

`hygen` is the simple, fast, and scalable code generator that lives _in_ your
project.

## Features

✅ Build ad-hoc generators quickly and full on project scaffolds.  
✅ Local generators per project (and global, if you must)  
✅ Built-in scaffolds to quickly create generators  
✅ Full logic templates and rendering  
✅ Prompts and flows for taking in arguments  
✅ Automatic CLI arguments  
✅ Adding new files  
✅ Injecting into existing files  
✅ Running shell commands  
✅ Super fast, constantly optimized for speed  
✅ **Support global and local generator module with `gen-` prefix**  
✅ **Support deep attribute options with CLI arguments**  
✅ **Automatic attribute value type inference**

## Quick Start

Coge can be used to supercharge your workflow with
[Redux](http://www.coge.io/redux),
[React Native](http://www.coge.io/react-native),
[Express](http://www.coge.io/express) and more, by allowing you avoid manual
work and generate, add, inject and perform custom operations on your codebase.

If you're on macOS and have Homebrew:

```
$ brew tap cogejs/tap
$ brew install coge
```

If you have node.js installed, you can install globally with `npm` (or Yarn):

```
$ npm i -g coge
```

If you like a no-strings-attached approach, you can use `npx` without installing
globally:

```
$ npx coge ...
```

For other platforms, see [releases](https://github.com/cogejs/coge/releases).

Initialize `coge` in your project (do this once per project):

```
$ cd your-project
$ coge init
```

Build your first generator, called `mygen`:

```
$ coge generator:new mygen

  create: generators/mygen/new/hello.ejs.t
```

Now you can use it:

```
$ coge mygen:gen

  create: app/hello.js
```

You've generated content into the current working directory in `app/`. To see
how is the generator built, look at `generators` (which you should check-in to
your project from now on, by the way).

You can build a generator that uses an interactive prompt to fill in a variable:

```
$ coge generator:prompt mygen

  create: generators/mygen/prompt/hello.ejs.t
  create: generators/mygen/prompt/prompt.js
```

Done! Now let's use `mygen`:

```
$ coge mygen:prompt
? What's your message? hello

  create: app/hello.js
```
