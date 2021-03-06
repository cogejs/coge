---
to: given/app/mailers/<%= name || 'unnamed-mailer' %>.js
---
<% name = name || 'unnamed'
   Name = h.capitalize(name)
   message = message || 'unnamed'
   Message = h.capitalize(message)
%>const {Mailer} = require('cogework');

class <%= Name %> extends Mailer {
  static defaults = {
    from: 'acme <acme@acme.org>',
  };

  static send<%= Message %>(user) {
    // https://nodemailer.com/message/
    this.mail({
      to: user.email,
      template: '<%= message %>',
      locals: {
        bill: '$13',
      },
    });
  }
}

module.exports = <%= Name %>;
