const Discord = require('discord.js');
var http = require('http');

const bot = new Discord.Client();
const token = 'Mjc0NzEzMjQ5NDk5NDQ3Mjk4.C22GLQ.toD09kvCfRefjAQADTXsEMsp5WE';

bot.on('ready', () => {
  bot.user.setGame('Living to serve');
  console.log('I am ready!');
});

bot.on('message', message => {
  var authorRoles = message.guild.member(message.author).roles;
    
  if (message.content.match(/^\.clear$/)) {
    var intersectingRoles = authorRoles.keyArray().filter(n => {return message.guild.member(bot.user).roles.keyArray().indexOf(n) != -1});
    var setRolePromise = message.guild.member(message.author).setRoles(authorRoles.filter(n => {return (intersectingRoles.indexOf(n.id) == -1 )}));
    setRolePromise.then(() => {
      var sentMsgPromise = message.channel.sendMessage('Cleared your color role(s), ' + message.author.username + '!');
      sentMsgPromise.then(sent => {sent.delete(3000); message.delete(3000);}).catch(sent => {sent.delete(); console.log('Failed delivery of message ' + sent.content);});
    })
    .catch(() => {
      var sentMsgPromise = message.channel.sendMessage('Clearing role failed for unknown reason - likely because of incorrect role hierachy! Please let your moderators know about this failure!');
      sentMsgPromise.then(sent => {sent.delete(3000); message.delete(3000);}).catch(sent => {sent.delete(); console.log('Failed delivery of message ' + sent.content);});
    });
  }
  
  if (message.content.match(/^\.iam .*$/)) {
    var roleName = message.content.match(/^.iam (.*)/)[1];
    var roleId = message.guild.roles.find(n => {return n.name.toLowerCase() === roleName.toLowerCase()}).id;
    roleName = message.guild.roles.get(roleId).name;
    if (!roleId) {
      var sentMsgPromise = message.channel.sendMessage('Could not find role ' + roleName + ', ' + message.author.username + '!');
      sentMsgPromise.then(sent => {sent.delete(3000); message.delete(3000);}).catch(sent => {sent.delete(); console.log('Failed delivery of message ' + sent.content);});
    } else if (message.guild.member(bot.user).roles.has(roleId)) {
      var intersectingRoles = authorRoles.keyArray().filter(n => {return message.guild.member(bot.user).roles.keyArray().indexOf(n) != -1});
      if (intersectingRoles.length > 1) {
        var setRolePromise = message.guild.member(message.author).setRoles(authorRoles.filter(n => {return (intersectingRoles.indexOf(n.id) == -1 )}).concat(message.guild.roles.filter(n => {return n.id == roleId})));
        setRolePromise.then(() => {
          var sentMsgPromise = message.channel.sendMessage('Replaced your color role(s) with ' + roleName + ', ' + message.author.username + '!');
          sentMsgPromise.then(sent => {sent.delete(3000); message.delete(3000);}).catch(sent => {sent.delete(); console.log('Failed delivery of message ' + sent.content);});
        })
        .catch(() => {
          var sentMsgPromise = message.channel.sendMessage('Replacing role failed for unknown reason - likely because of incorrect role hierachy! Please let your moderators know about this failure!');
          sentMsgPromise.then(sent => {sent.delete(3000); message.delete(3000);}).catch(sent => {sent.delete(); console.log('Failed delivery of message ' + sent.content);});
        });
      } else {
        var addRolePromise = message.guild.member(message.author).addRole(roleId);
        addRolePromise.then(() => {
          var sentMsgPromise = message.channel.sendMessage('Gave you role ' + roleName + ', ' + message.author.username + '!');
          sentMsgPromise.then(sent => {sent.delete(3000); message.delete(3000);}).catch(sent => {sent.delete(); console.log('Failed delivery of message ' + sent.content);});
        })
        .catch(() => {
          var sentMsgPromise = message.channel.sendMessage('Assigning role failed for unknown reason - likely because of incorrect role hierachy! Please let your moderators know about this failure!');
          sentMsgPromise.then(sent => {sent.delete(3000); message.delete(3000);}).catch(sent => {sent.delete(); console.log('Failed delivery of message ' + sent.content);});
        });
      }
    } else {
      var sentMsgPromise = message.channel.sendMessage('I do not have access to role ' + roleName + ', ' + message.author.username + '!');
      sentMsgPromise.then(sent => {sent.delete(3000); message.delete(3000);}).catch(sent => {sent.delete(); console.log('Failed delivery of message ' + sent.content);});
    }
  }
});

bot.login(token);

 http.createServer(function (request, response) {
   response.writeHead(200, {'Content-Type': 'text/plain'});
   response.end('Hello World\n');
}).listen(process.env.PORT || 5000);


//var request = require('request');
/*
request({
  url: 'https://discordapp.com/api/oauth2/token',
  method: 'POST',
  auth: {
    user: '274713249499447298',
    pass: '95Wga4537Y8NEY83azjJwXxvzLidnyzH'
  },
  form: {
    'grant_type': 'client_credentials'
  }
}, function(err, res) {
  var json = JSON.parse(res.body);
  console.log("Access Token:", json.access_token);
   
  request({
    url: 'https://discordapp.com/api/oauth2/authorize?client-id=274713249499447298',
    auth: {
      'bearer': json.access_token
    }
  }, function(err, res) {
    console.log(res.body);
  });
});
*/