const Discord = require('discord.js');
var http = require('http');
const yt = require('ytdl-core');
const options = require('./options.json');
const fs = require('fs');

const bot = new Discord.Client();
var music_quality = 3; //quality; 1 lowest, 5 highest
const token = options.token;

/*TODO

 - implement persistent storage
 - implement playlist shuffle
 - implement single/playlist loop
 - implement welcome/farewell messages
 
*/

var errors = '';
let queue = {};
var state = {};

class GuildState {
  constructor() {
    this.abusing = {};
    return;
  }
}

saveState = function() {
  fs.writeFileSync('./state.sav', JSON.stringify(state));
}

loadState = function() {
  state = JSON.parse(fs.readFileSync('./state.sav'));
}
    
abuserFunction = function (params) {
  var abuseName = params.abuseName;
  var id = params.id;
  var guildId = params.guildId;
  var temp = new Promise((resolve, reject) => {
    if (state[guildId].abusing.some((e) => {return e.id === id && e.name === abuseName;})) {
      msg.guild.fetchMember(id).then((member) => {
        member.setNickname(abuseName).catch((e) => {console.error(e);});
      });
      setTimeout(resolve, Math.floor(Math.random()*10000)+10000, {"id": id, "guildId": guildId, "abuseName":abuseName});
    } else {
      reject();
    }
  }).then(abuserFunction).catch(() => {return;});
  return;
}

bot.on('ready', () => {
  bot.user.setGame('.help for, well, help!');
  loadState();
  console.log('Bot is ready!');
  setInterval(() => {
    Object.keys(state).forEach((guildId) => {
      bot.guilds[guildId].roles[state[guildId].rainbow].setColor(Math.floor(Math.random() * 16777216))
        .catch((e) => {console.error(e);});
    });
  }, 5000);
});


const admCommands = {
  'leave': (msg) => {
    msg.guild.channels.filter((n) => {return n.type === 'voice';}).array().forEach((n) => {n.leave();});
    msg.channel.sendMessage(`Leaving all voice channels on the server!`);
  },
  'join': (msg) => {
    return new Promise((resolve, reject) => {
      const voiceChannel = msg.member.voiceChannel;
      if (!voiceChannel || voiceChannel.type !== 'voice') {return msg.reply('I couldn\'t connect to your voice channel...');}
      voiceChannel.join().then((connection) => {resolve(connection);}).catch((err) => {reject(err);});
    });
  },
  'abuse': (msg) => {
    if (!state[msg.guild.id]) { state[msg.guild.id] = new GuildState()}
    var abuseMatch = msg.content.match(/.*<([0123456789]+)>.*name:(.*)/i);
    if (abuseMatch) {
      var abuseName = abuseMatch[2];
      var abuseId = abuseMatch[1];
    } else {
      msg.channel.send('Incorrect syntax!').catch((e) => {console.error(e);});
      return;
    }
    if (!state[msg.guild.id].abusing[abuseId]) { state[msg.guild.id].abusing[abuseId] = []; };
    state[msg.guild.id].abusing[abuseId].push(abuseName);
    saveState();
    msg.channel.send('Abusing has commenced and will continue until morale improves!').catch((e) => {console.error(e);});
    
    abuserFunction({"id": msg.mentions.users.firstKey(), "guildId":msg.guild.id, "abuseName":abuseName});
  },
  'unabuse': (msg) => {
    var abuseMatch = msg.content.match(/.*<([0123456789]+)>/i);
    if (abuseMatch) {
      var abuseId = abuseMatch[1];
    } else {
      msg.channel.send('Incorrect syntax!').catch((e) => {console.error(e);});
      return;
    }
    msg.guild.fetchMember(abuseId).then(() => {
      state[msg.guild.id].abusing[abuseId] = [];
      saveState();
    }).catch(() => {msg.channel.send('Not a valid user ID!');});
  },
  'rainbow': (msg) => {
    var rainbowMatch = msg.content.match(/.*<([&0123456789]+)>/i);
    if (rainbowMatch) {
      var roleId = rainbowMatch[1];
    } else {
      msg.channel.send('Incorrect syntax!').catch((e) => {console.error(e);});
      return;
    }
    if(msg.guild.roles[roleId]) {
      state[msg.guild.id].rainbow = roleId;
      saveState();
    } else {
      msg.channel.send('Not a valid role ID!');
    };
  }
};

const commands = {
  'clear': (msg) => {
    var authorRoles = msg.guild.member(msg.author).roles;
    var intersectingRoles = authorRoles.keyArray().filter(n => {return msg.guild.member(bot.user).roles.keyArray().indexOf(n) != -1});
    var setRolePromise = msg.guild.member(msg.author).setRoles(authorRoles.filter(n => {return (intersectingRoles.indexOf(n.id) == -1 )}));
    setRolePromise.then(() => {
      var sentMsgPromise = msg.channel.sendMessage('Cleared your color role(s), ' + msg.author.username + '!');
      sentMsgPromise.then(sent => {sent.delete(3000); msg.delete(3000);}).catch(sent => {sent.delete(); console.log('Failed delivery of msg ' + sent.content);});
    })
    .catch(() => {
      var sentMsgPromise = msg.channel.sendMessage('Clearing role failed for unknown reason - likely because of incorrect role hierachy! Please let your moderators know about this failure!');
      sentMsgPromise.then(sent => {sent.delete(3000); msg.delete(3000);}).catch(sent => {sent.delete(); console.log('Failed delivery of message ' + sent.content);});
    });
  },
  'iam': (msg) => {
    var authorRoles = msg.guild.member(msg.author).roles;
    var roleName = msg.content.match(/^.iam (.*)/i)[1];
    var paramRole = msg.guild.roles.find(n => {return n.name.toLowerCase() === roleName.toLowerCase()});
    if (!msg.guild.roles.find(n => {return n.name.toLowerCase() === roleName.toLowerCase()})) {
      var sentMsgPromise = msg.channel.sendMessage('Could not find role ' + roleName + ', ' + msg.author.username + '!');
      sentMsgPromise.then(sent => {sent.delete(3000); msg.delete(3000);}).catch(sent => {sent.delete(); console.log('Failed delivery of message ' + sent.content);});
    } else if (msg.guild.member(bot.user).roles.has(paramRole.id)) {
      var roleId = paramRole.id;
      roleName = paramRole.name;
      var intersectingColorRoles = authorRoles.keyArray().filter(n => {return (msg.guild.member(bot.user).roles.keyArray().indexOf(n) != -1) && (msg.guild.roles.get(n).color)});
      if (intersectingColorRoles.length > 0 && paramRole.color) {
        var setRolePromise = msg.guild.member(msg.author).setRoles(authorRoles.filter(n => {return intersectingColorRoles.indexOf(n.id) == -1}).concat(msg.guild.roles.filter(n => {return n  .id == roleId})));
        setRolePromise.then(() => {
          var sentMsgPromise = msg.channel.sendMessage('Replaced your color role(s) with ' + roleName + ', ' + msg.author.username + '!');
          sentMsgPromise.then(sent => {sent.delete(3000); msg.delete(3000);}).catch(sent => {sent.delete(); console.log('Failed delivery of message ' + sent.content);});
        })
        .catch(() => {
          var sentMsgPromise = msg.channel.sendMessage('Replacing role failed for unknown reason - likely because of incorrect role hierachy! Please let your moderators know about this failure!');
          sentMsgPromise.then(sent => {sent.delete(3000); msg.delete(3000);}).catch(sent => {sent.delete(); console.log('Failed delivery of message ' + sent.content);});
        });
      } else {
        var addRolePromise = msg.guild.member(msg.author).addRole(roleId);
        addRolePromise.then(() => {
          var sentMsgPromise = msg.channel.sendMessage('Gave you role ' + roleName + ', ' + msg.author.username + '!');
          sentMsgPromise.then(sent => {sent.delete(3000); msg.delete(3000);}).catch(sent => {sent.delete(); console.log('Failed delivery of message ' + sent.content);});
        })
        .catch(() => {
          var sentMsgPromise = msg.channel.sendMessage('Assigning role failed for unknown reason - likely because of incorrect role hierachy! Please let your moderators know about this failure!');
          sentMsgPromise.then(sent => {sent.delete(3000); msg.delete(3000);}).catch(sent => {sent.delete(); console.log('Failed delivery of message ' + sent.content);});
        });
      }
    } else {
      var sentMsgPromise = msg.channel.sendMessage('I do not have access to role ' + roleName + ', ' + msg.author.username + '!');
      sentMsgPromise.then(sent => {sent.delete(3000); msg.delete(3000);}).catch(sent => {sent.delete(); console.log('Failed delivery of message ' + sent.content);});
    }
  },
  'iamn': (msg) => {
    var authorRoles = msg.guild.member(msg.author).roles;
    var roleName = msg.content.match(/^.iamn (.*)/i)[1];
    var paramRole = msg.guild.roles.find(n => {return n.name.toLowerCase() === roleName.toLowerCase()});
    if (!msg.guild.roles.find(n => {return n.name.toLowerCase() === roleName.toLowerCase()})) {
      var sentMsgPromise = msg.channel.sendMessage('Could not find role ' + roleName + ', ' + msg.author.username + '!');
      sentMsgPromise.then(sent => {sent.delete(3000); msg.delete(3000);}).catch(sent => {sent.delete(); console.log('Failed delivery of message ' + sent.content);});
    } else if (msg.guild.member(bot.user).roles.has(paramRole.id)) {
      var roleId = paramRole.id;
      roleName = paramRole.name;
      var removeRolePromise = msg.guild.member(msg.author).removeRole(roleId);
      removeRolePromise.then(() => {
        var sentMsgPromise = msg.channel.sendMessage('Removed role ' + roleName + ' from you, ' + msg.author.username + '!');
        sentMsgPromise.then(sent => {sent.delete(3000); msg.delete(3000);}).catch(sent => {sent.delete(); console.log('Failed delivery of message ' + sent.content);});
      })
      .catch(() => {
        var sentMsgPromise = msg.channel.sendMessage('Removing role failed for unknown reason - likely because of incorrect role hierachy! Please let your moderators know about this failure!');
        sentMsgPromise.then(sent => {sent.delete(3000); msg.delete(3000);}).catch(sent => {sent.delete(); console.log('Failed delivery of message ' + sent.content);});
      });
    } else {
      var sentMsgPromise = msg.channel.sendMessage('I do not have access to role ' + roleName + ', ' + msg.author.username + '!');
      sentMsgPromise.then(sent => {sent.delete(3000); msg.delete(3000);}).catch(sent => {sent.delete(); console.log('Failed delivery of message ' + sent.content);});
    }
  },
  'play': (msg) => {
    if (queue[msg.guild.id] === undefined) return msg.channel.sendMessage(`Add some songs to the queue first with .add!`);
    if (!msg.guild.voiceConnection) {
      msg.channel.sendMessage('I am not in any voice channels! Please have an administrator add me to one with `.!join`.').then(sent => {sent.delete(3000); msg.delete(3000);});
      return;
    };
    if (queue[msg.guild.id].playing) return msg.channel.sendMessage('Already Playing!');
    let dispatcher;
    queue[msg.guild.id].playing = true;
    (function play(song) {
      if (song === undefined) return msg.channel.sendMessage('Queue is empty - add more with `.add <url>`!').then(() => {
        queue[msg.guild.id].playing = false;
        //msg.member.voiceChannel.leave();
      });
      msg.channel.sendMessage(`Playing: **${song.title}** as requested by: **${song.requester}**`);
      dispatcher = msg.guild.voiceConnection.playStream(yt(song.url, { audioonly: true }), { passes : music_quality });
      let collector = msg.channel.createCollector(m => m);
      collector.on('message', m => {
        if (m.content.toLowerCase().startsWith('.pause')) {
          msg.channel.sendMessage('Playback paused!').then(() => {dispatcher.pause();});
        } else if (m.content.toLowerCase().startsWith('.resume')){
          msg.channel.sendMessage('Playback resumed!').then(() => {dispatcher.resume();});
        } else if (m.content.toLowerCase().startsWith('.skip')){
          msg.channel.sendMessage('Current track skipped!').then(() => {dispatcher.end();});
        } else if (m.content.toLowerCase().startsWith('.volume+')){
          if (Math.round(dispatcher.volume*50) >= 100) return msg.channel.sendMessage(`Volume: ${Math.round(dispatcher.volume*50)}%`);
          dispatcher.setVolume(Math.min((dispatcher.volume*50 + (2*(m.content.split('+').length-1)))/50,2));
          msg.channel.sendMessage(`Volume changed to ${Math.round(dispatcher.volume*50)}%!`);
        } else if (m.content.toLowerCase().startsWith('.volume-')){
          if (Math.round(dispatcher.volume*50) <= 0) return msg.channel.sendMessage(`Volume: ${Math.round(dispatcher.volume*50)}%`);
          dispatcher.setVolume(Math.max((dispatcher.volume*50 - (2*(m.content.split('-').length-1)))/50,0));
          msg.channel.sendMessage(`Volume changed to ${Math.round(dispatcher.volume*50)}%!`);
        } else if (m.content.toLowerCase().startsWith('.volume')){
          var param = m.content.split(' ')[1];
          if (param%1 === 0) {
            dispatcher.setVolume(Math.max(Math.min(param,100),0)/50);
            msg.channel.sendMessage(`Volume changed to ${Math.round(dispatcher.volume*50)}%!`);
          } else {
            msg.channel.sendMessage(`Please enter a whole number between 0 and 100 inclusive; Current volume is ${Math.round(dispatcher.volume*50)}%.`);
          }
        } else if (m.content.toLowerCase().startsWith('.time')){
          msg.channel.sendMessage(`Time in track: ${Math.floor(dispatcher.time / 60000)}:${Math.floor((dispatcher.time % 60000)/1000) <10 ? '0'+Math.floor((dispatcher.time % 60000)/1000) : Math.floor((dispatcher.time % 60000)/1000)}`);
        }
      });
      dispatcher.on('end', () => {
        collector.stop();
        queue[msg.guild.id].songs.shift();
        play(queue[msg.guild.id].songs[0]);
      });
      dispatcher.on('error', (err) => {
        return msg.channel.sendMessage('Error: ' + err).then(() => {
          collector.stop();
          queue[msg.guild.id].songs.shift();
          play(queue[msg.guild.id].songs[0]);
        });
      });
    })(queue[msg.guild.id].songs[0]);
  },
  'quality': (msg) => {
    var param = msg.content.split(' ')[1];
    if (param >= 1 && param <= 5 && (param%1)===0) {
      music_quality = param;
      msg.channel.sendMessage(`Music quality set to **${music_quality}**!`)
    } else {
      msg.channel.sendMessage(`Music quality can only be set to a whole number between 1 and 5 inclusive.`)
    }
  },
  'add': (msg) => {
    let url = msg.content.split(' ')[1];
    if (url == '' || url === undefined) return msg.channel.sendMessage(`You must add a url, or youtube video id after .add!`);
    try {
      yt.getInfo(url, (err, info) => {
        if (err) {return;}
        if (!queue.hasOwnProperty(msg.guild.id)) queue[msg.guild.id] = {}, queue[msg.guild.id].playing = false, queue[msg.guild.id].songs = [];
        queue[msg.guild.id].songs.push({url: url, title: info.title, requester: msg.author.username});
        msg.channel.sendMessage(`Successfully added **${info.title}** to the queue!`).then(() => {msg.delete();});
      });
    } catch (e) {
      msg.channel.sendMessage('Invalid YouTube Link: `' + url + '`').then(sent => {sent.delete(3000); msg.delete(3000);});
    }
  },
  'queue': (msg) => {
    if (queue[msg.guild.id] === undefined) return msg.channel.sendMessage(`Add some songs to the queue first with .add!`);
    let tosend = [];
    queue[msg.guild.id].songs.forEach((song, i) => { tosend.push(`${i+1}. ${song.title} - Requested by: ${song.requester}`);});
    msg.channel.sendMessage(`__**${msg.guild.name}'s Music Queue:**__ Currently **${tosend.length}** songs queued ${(tosend.length > 15 ? '*[Only next 15 shown]*' : '')}\n${tosend.length==0?'':'\`\`\`'}${tosend.slice(0,15).join('\n')}${tosend.length==0?'':'\`\`\`'}`).then(() => {msg.delete();});
  },
  'help': (msg) => {
    let tosend = ['```',
    'Messages prefixed with ".!" will only work if given by an admin.',
    '',
    '.!join : The bot will join the voice channel of the message\'s sender.',
    '.!leave : The bot will leave all voice channels on the server.',
    '.iam <role>: Gives you a role. If you have any other roles with colours that the bot possesses, it will attempt to remove the others for you.',
    '.iamn <role>: Removes a role from you.',
    '.clear: Clears all the roles the bot can take off you.',
    '.quality <number>: Sets the music quality. Number must be between 1 and 5 inclusive. 5 is complete lossless.',
    '.add <url>: Adds a valid youtube link to the queue.', '.queue : Shows the current queue, up to 15 songs shown.',
    '.play : Play the music queue.',
    '.help : Displays this menu.',
    '',
    'the following commands only function while the play command is running:'.toUpperCase(),
    '.pause : Pauses the music.',
    '.resume : Resumes the music.',
    '.skip : Skips the current track.',
    '.time : Shows the playtime of the song.',
    '.volume+(+++) : Increases the volume by 2%/+.',
    '.volume-(---) : Decreases the volume by 2%/-.',
    '.volume <number> : Sets the volume to the percentage of the number',
    '```'];
    msg.channel.sendMessage(tosend.join('\n')).then(() => {msg.delete();});
  },
};

bot.on('message', msg => {
  if (!msg.content.startsWith('.')) return;
  if (msg.content.startsWith('.!') && msg.member.permissions.hasPermission("ADMINISTRATOR")) {
    try {
      if (admCommands.hasOwnProperty(msg.content.toLowerCase().slice(2).split(' ')[0])) admCommands[msg.content.toLowerCase().slice(2).split(' ')[0]](msg);
    } catch (e) {
      console.error(`\n-------\n${e}\n-------\n`);
      errors = errors + e + '\n-------\n';
    }
  } else {
    try {
      if (commands.hasOwnProperty(msg.content.toLowerCase().slice(1).split(' ')[0])) commands[msg.content.toLowerCase().slice(1).split(' ')[0]](msg);
    } catch (e) {
      console.error(`\n-------\n${e}\n-------\n`);
      errors = errors + e + '\n-------\n';
    }
  }
});

bot.login(token);

http.createServer(function (request, response) {
   response.writeHead(200, {'Content-Type': 'text/plain'});
   response.end(errors + '\n------------------\n' + JSON.stringify(state));
}).listen(process.env.PORT || 5000);
