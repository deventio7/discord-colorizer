const Discord = require('discord.js');
var http = require('http');
const yt = require('ytdl-core');

const bot = new Discord.Client();
const MUSIC_PASSES = 2;
const token = 'Mjc0NzEzMjQ5NDk5NDQ3Mjk4.C22GLQ.toD09kvCfRefjAQADTXsEMsp5WE';

bot.on('ready', () => {
  bot.user.setGame('Living to serve');
  console.log('I am ready!');
});

let queue = {};

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
    var roleName = msg.content.match(/^.iam (.*)/)[1];
    if (!msg.guild.roles.find(n => {return n.name.toLowerCase() === roleName.toLowerCase()})) {
      var sentMsgPromise = msg.channel.sendMessage('Could not find role ' + roleName + ', ' + msg.author.username + '!');
      sentMsgPromise.then(sent => {sent.delete(3000); msg.delete(3000);}).catch(sent => {sent.delete(); console.log('Failed delivery of message ' + sent.content);});
    } else if (msg.guild.member(bot.user).roles.has(roleId)) {
      var roleId = msg.guild.roles.find(n => {return n.name.toLowerCase() === roleName.toLowerCase()}).id;
      roleName = msg.guild.roles.get(roleId).name;  
      var intersectingRoles = authorRoles.keyArray().filter(n => {return msg.guild.member(bot.user).roles.keyArray().indexOf(n) != -1});
      if (intersectingRoles.length > 1) {
        var setRolePromise = msg.guild.member(msg.author).setRoles(authorRoles.filter(n => {return (intersectingRoles.indexOf(n.id) == -1 || !n.color)}).concat(msg.guild.roles.filter(n => {return n.id == roleId})));
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
	'play': (msg) => {
		if (queue[msg.guild.id] === undefined) return msg.channel.sendMessage(`Add some songs to the queue first with .add`);
		if (!msg.guild.voiceConnection) return commands.join(msg).then(() => commands.play(msg));
		if (queue[msg.guild.id].playing) return msg.channel.sendMessage('Already Playing');
		let dispatcher;
		queue[msg.guild.id].playing = true;

		console.log(queue);
		(function play(song) {
			console.log(song);
			if (song === undefined) return msg.channel.sendMessage('Queue is empty').then(() => {
				queue[msg.guild.id].playing = false;
				msg.member.voiceChannel.leave();
			});
			msg.channel.sendMessage(`Playing: **${song.title}** as requested by: **${song.requester}**`);
			dispatcher = msg.guild.voiceConnection.playStream(yt(song.url, { audioonly: true }), { passes : MUSIC_PASSES });
			let collector = msg.channel.createCollector(m => m);
			collector.on('message', m => {
				if (m.content.toLowerCase.startsWith('.pause')) {
					msg.channel.sendMessage('paused').then(() => {dispatcher.pause();});
				} else if (m.content.toLowerCase.startsWith('.resume')){
					msg.channel.sendMessage('resumed').then(() => {dispatcher.resume();});
				} else if (m.content.toLowerCase.startsWith('.skip')){
					msg.channel.sendMessage('skipped').then(() => {dispatcher.end();});
				} else if (m.content.toLowerCase.startsWith('.volume+')){
					if (Math.round(dispatcher.volume*50) >= 100) return msg.channel.sendMessage(`Volume: ${Math.round(dispatcher.volume*50)}%`);
					dispatcher.setVolume(Math.min((dispatcher.volume*50 + (2*(m.content.split('+').length-1)))/50,2));
					msg.channel.sendMessage(`Volume: ${Math.round(dispatcher.volume*50)}%`);
				} else if (m.content.toLowerCase.startsWith('.volume-')){
					if (Math.round(dispatcher.volume*50) <= 0) return msg.channel.sendMessage(`Volume: ${Math.round(dispatcher.volume*50)}%`);
					dispatcher.setVolume(Math.max((dispatcher.volume*50 - (2*(m.content.split('-').length-1)))/50,0));
					msg.channel.sendMessage(`Volume: ${Math.round(dispatcher.volume*50)}%`);
				} else if (m.content.toLowerCase.startsWith('.time')){
					msg.channel.sendMessage(`time: ${Math.floor(dispatcher.time / 60000)}:${Math.floor((dispatcher.time % 60000)/1000) <10 ? '0'+Math.floor((dispatcher.time % 60000)/1000) : Math.floor((dispatcher.time % 60000)/1000)}`);
				}
			});
			dispatcher.on('end', () => {
				collector.stop();
				queue[msg.guild.id].songs.shift();
				play(queue[msg.guild.id].songs[0]);
			});
			dispatcher.on('error', (err) => {
				return msg.channel.sendMessage('error: ' + err).then(() => {
					collector.stop();
					queue[msg.guild.id].songs.shift();
					play(queue[msg.guild.id].songs[0]);
				});
			});
		})(queue[msg.guild.id].songs[0]);
	},
	'join': (msg) => {
		return new Promise((resolve, reject) => {
			const voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel || voiceChannel.type !== 'voice') return msg.reply('I couldn\'t connect to your voice channel...');
			voiceChannel.join().then(connection => resolve(connection)).catch(err => reject(err));
		});
	},
	'add': (msg) => {
		let url = msg.content.split(' ')[1];
		if (url == '' || url === undefined) return msg.channel.sendMessage(`You must add a url, or youtube video id after .add`);
		yt.getInfo(url, (err, info) => {
			if(err) return msg.channel.sendMessage('Invalid YouTube Link: ' + err);
			if (!queue.hasOwnProperty(msg.guild.id)) queue[msg.guild.id] = {}, queue[msg.guild.id].playing = false, queue[msg.guild.id].songs = [];
			queue[msg.guild.id].songs.push({url: url, title: info.title, requester: msg.author.username});
			msg.channel.sendMessage(`added **${info.title}** to the queue`);
		});
	},
	'queue': (msg) => {
		if (queue[msg.guild.id] === undefined) return msg.channel.sendMessage(`Add some songs to the queue first with .add`);
		let tosend = [];
		queue[msg.guild.id].songs.forEach((song, i) => { tosend.push(`${i+1}. ${song.title} - Requested by: ${song.requester}`);});
		msg.channel.sendMessage(`__**${msg.guild.name}'s Music Queue:**__ Currently **${tosend.length}** songs queued ${(tosend.length > 15 ? '*[Only next 15 shown]*' : '')}\n\`\`\`${tosend.slice(0,15).join('\n')}\`\`\``);
	},
	'help': (msg) => {
		let tosend = ['```xl', '.iam : "Gives you a role. If you have any other roles that the bot possesses, it will attempt to remove the others for you."', '.clear: "Clears all the roles the bot can take off you."', '.join : "Join Voice channel of msg sender"',	'.add : "Add a valid youtube link to the queue"', '.queue : "Shows the current queue, up to 15 songs shown."', '.play : "Play the music queue if already joined to a voice channel"', '', 'the following commands only function while the play command is running:'.toUpperCase(), '.pause : "pauses the music"',	'.resume : "resumes the music"', '.skip : "skips the playing song"', '.time : "Shows the playtime of the song."',	'.volume+(+++) : "increases volume by 2%/+"',	'.volume-(---) : "decreases volume by 2%/-"',	'```'];
		msg.channel.sendMessage(tosend.join('\n'));
	},
};

bot.on('message', msg => {
	if (!msg.content.startsWith('.')) return;
	if (commands.hasOwnProperty(msg.content.toLowerCase().slice(1).split(' ')[0])) commands[msg.content.toLowerCase().slice(1).split(' ')[0]](msg);
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