const path = require('path');
const mm = require('micromatch');

exports.questions = () => [
  {
    type: 'input',
    name: 'license',
    message: 'Which license?',
  },
];

exports.filter = function (files, locals) {
  const license = (locals.license || 'gpl').toLowerCase();
  return mm(files, ['**', `!**/licenses${path.sep}*.ejs`, `**/licenses${path.sep}${license}.ejs`]);
};
