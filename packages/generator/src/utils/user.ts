import shell from 'shelljs';
import githubUsername = require('github-username');

const nameCache = new Map();
const emailCache = new Map();

// interface User {
//   git: {
//     name(): string;
//     email(): string;
//   },
//   github: {
//     username(): Promise<string>;
//   }
// }

export const clear = () => {
  nameCache.clear();
  emailCache.clear();
};

export const git = {
  /**
   * Retrieves user's name from Git in the global scope or the project scope
   * (it'll take what Git will use in the current context)
   * @return {String} configured git name or undefined
   */
  name: () => {
    let name = nameCache.get(process.cwd());

    if (name) {
      return name;
    }

    if (shell.which('git')) {
      name = shell
        .exec('git config --get user.name', {silent: true})
        .stdout.trim();
      nameCache.set(process.cwd(), name);
    }

    return name;
  },

  /**
   * Retrieves user's email from Git in the global scope or the project scope
   * (it'll take what Git will use in the current context)
   * @return {String} configured git email or undefined
   */
  email: () => {
    let email = emailCache.get(process.cwd());

    if (email) {
      return email;
    }

    if (shell.which('git')) {
      email = shell
        .exec('git config --get user.email', {silent: true})
        .stdout.trim();
      emailCache.set(process.cwd(), email);
    }

    return email;
  },
};

/**
 * Retrieves GitHub's username from the GitHub API
 * @return {Promise} Resolved with the GitHub username or rejected if unable to
 *                   get the information
 */
export const github = {
  username: () => githubUsername(git.email()),
};

// const user: User = {git, github};
//
// export = user;
