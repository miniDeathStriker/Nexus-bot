
const discord = require('discord.js');
const client = new discord.Client();
client.commands = new discord.Collection()
const request = require("request")
const fs = require('fs')
const util = require('util')
const fivem = require("fivem-api");
const WebSocket = require('ws');
let filters = require('./settings.json')
const EventEmitter = require('events');
const cassandra = require('cassandra-driver'); 
const authProvider = new cassandra.auth.PlainTextAuthProvider('cassandra', 'cassandra');
const contactPoints = ['127.0.0.1'];
const casClient = new cassandra.Client({localDataCenter:'datacenter1', contactPoints: contactPoints, authProvider: authProvider, keyspace:'nexus'});
let experienceData = [];
let economyData = [];

casClient.on('log', (level, className, message, furtherInfo) => {
  if(level === 'verbose')return;//cut down on log spam
  console.log('log event: %s -- %s', level, message);
});




class eventhandler extends EventEmitter {}

//Easiest way to add compatibillity for status page.
const wss = new WebSocket.Server({
  port: 1337
})


fs.readdir("./commands/", (err, files) => {
    if(err) console.log(err);
    let jsfile = files.filter(f => f.split(".").pop() === "js");
    if(jsfile.length <= 0){
      console.log("Couldn't find commands.");
      return;
    }
  
    jsfile.forEach((f, i) =>{
      let props = require(`./commands/${f}`);
      client.commands.set(props.help.name, props);
      if(i+1 == jsfile.length){
        console.log(`${i+1} commands loaded!`);
      }
    });
});
fs.readdir("./commands/music/", (err, files) => {
  if(err) console.log(err);
  let jsfile = files.filter(f => f.split(".").pop() === "js");
  if(jsfile.length <= 0){
    console.log("Couldn't find commands.");
    return;
  }

  jsfile.forEach((f, i) =>{
    let props = require(`./commands/music/${f}`);
    client.commands.set(props.help.name, props);
    if(i+1 == jsfile.length){
      console.log(`${i+1} music commands loaded!`);
    }
  });
});

client.on('ready', () => {
    console.log(client.user.username + ' Is ready!')
    client.user.setPresence({ game: { name: 'over nexus! | !help | Eating bamboo', type: "WATCHING" }, status: 'online' })



      //https://www.tutorialspoint.com/cassandra/cassandra_cql_datatypes.htm -- Table data types.
      casClient.execute('CREATE TABLE IF NOT EXISTS nexus.discord_player_data (id text PRIMARY KEY, firstname text, lastname text, birthday text, hobbys text, pets text, country text)')
      .then(()=>{console.log('Executed first database check.');})
      .catch((err)=>{console.log(err)})
      casClient.execute('CREATE TABLE IF NOT EXISTS nexus.punishment_history (id text PRIMARY KEY, staffid text, punishmenttype text, date text, reason text)')
      .then(()=>{console.log('Executed second database check.');})
      .catch((err)=>{console.log(err)})
      casClient.execute('CREATE TABLE IF NOT EXISTS nexus.economy (id text PRIMARY KEY, cash float, bank float)')
      .then(()=>{console.log('Executed third database check.');})
      .catch((err)=>{console.log(err)})
      casClient.execute('CREATE TABLE IF NOT EXISTS nexus.experience (id text PRIMARY KEY, xp float, level float)')
      .then(()=>{console.log('Executed third database check.');})
      .catch((err)=>{console.log(err)})
      casClient.execute('CREATE TABLE IF NOT EXISTS nexus.items (id text PRIMARY KEY, itemname text, amount float)')
      .then(()=>{console.log('Executed fourth database check.');})
      .catch((err)=>{console.log(err)})
      client.guilds.forEach(guild => {
        guild.members.forEach(member => {
          casClient.execute('INSERT INTO discord_player_data (id, firstname, lastname, birthday, hobbys, pets, country) VALUES (?,?,?,?,?,?,?) IF NOT EXISTS', [member.id,'Unknown','Unknown','Unknown','[]','[]','Unknown'])
          .then(res => {})
          .catch(err => {
            console.log(err)
          })
          casClient.execute('INSERT INTO economy (id, cash, bank) VALUES (?,?,?) IF NOT EXISTS', [member.id,parseFloat('0.00'),parseFloat('0.00')], {hints: ['text', 'float', 'float']})
          .then(res => {})
          .catch(err => {
            console.log(err)
          })
          casClient.execute('INSERT INTO experience (id, xp, level) VALUES (?,?,?) IF NOT EXISTS', [member.id,parseFloat('0.00'),parseFloat('0.00')], {hints: ['text', 'float', 'float']})
          .then(res => {})
          .catch(err => {
            console.log(err)
          })
        })
      })
      casClient.execute('SELECT * FROM economy')
      .then(res => {
        economyData = res.rows
      })
      .catch(err => {
        console.log(err)
      })
      casClient.execute('SELECT * FROM experience')
      .then(res => {
        experienceData = res.rows
      })
      .catch(err => {
        console.log(err)
      })
})

// setInterval(async () => {
//   fivem.getServerInfo("nexusroleplay.net:30110").then((server)  => {
//       client.guilds.get('543750620369387523').channels.get('593784846120124439').edit({name: `Server 1: ${server.players.length}/32`})
//     })
// }, 10000)


client.on('guildMemberAdd', (member) => {
  casClient.execute('INSERT INTO discord_player_data (id,firstname,lastname,birthday,hobbys,pets,country) VALUES (?,?,?,?,?,?,?)', [member.id,'Unknown','Unknown','Unknown','[]','[]','Unknown'])
  .then(res => {
    console.log(`Created database account for ${member.user.username}`);
    let chan = member.guild.channels.find(c => c.name === 'welcome')
    let welcomeEmbed = new discord.RichEmbed()
    .setAuthor(`Welcome ${member.user.username}`, client.user.displayAvatarURL)
    .setColor('#36393f')
    .setDescription(`Please welcome ${member.user.username} to the nexus discord!`)
    .setFooter(`Welcome ${member.user.username}`, client.user.displayAvatarURL)
    if(chan)chan.send(welcomeEmbed)
  })
})


setInterval(function(){
  let msgArray = ['Held hostage!', 'Send help!', 'Eating bamboo!', 'Stroking a panda!', 'Stealing candy!', 'Eating chips', 'Being a bot!', 'Hating mini!', 'Joining nexus!']

  let random = Math.floor((Math.random() * msgArray.length));

  client.user.setPresence({ game: { name: 'over nexus! | !help | '+msgArray[random], type: "WATCHING" }, status: 'online' })
}, 120000)


client.on('guildBanAdd', (guild, user) => {

})
client.on('messageDelete', (msg) => {

})

const event = new eventhandler();
event.on('clearfiltercache', () => {
  let package = require.resolve('./settings.json');
  delete require.cache[package];
  filters = require('./settings.json')
});





setInterval(function(){
  let guilds = ['543750620369387523', '588329736585871360', '560147541459599360', '591351812267835441']
  let guild1 = guilds[0]
  let guild2 = guilds[1]
  let guild3 = guilds[2]
  let guild4 = guilds[3]
  client.guilds.get(guild1).members.forEach(member => {
    if(member.presence.game !== null || undefined){
      if(member.user.bot)return;
      let presence = member.presence.game.name
      if(presence.toUpperCase().includes('WWW.') || presence.toUpperCase().includes('HTTP://') || presence.toUpperCase().includes('HTTPS://')){
        if(presence.toUpperCase().includes('NEXUSROLEPLAY.NET') || presence.toUpperCase().includes('ny3nvRk'))return;
        client.guilds.get('543750620369387523').channels.get('543750620369387523').send('<@&544162172218114052> \nPotential status advertising by: '+member+'\nStatus: '+presence)
      }
    }
  })
}, 30000)

client.on('error', (err) => {console.log(err)});


client.on('messageUpdate', (oldmsg, msg) => {
  if(msg.channel.type == 'dm')return;
  if(msg.author.bot)return;




  let msgArray = msg.content.split(" ");
  let cmd = msgArray[0].toUpperCase();
  let args = msgArray.slice(1);

  // let msglength = msg.content.length;
  // let capslength = msg.content.replace(/[^A-Z]/g, "").length
  // console.log(capslength/100*msglength)
  // if(capslength/100*msglength >= 10){
  //   msg.delete()
  //   msg.channel.send('Too much capslock '+msg.member)
  //   return;
  // }


  if(msg.content.toUpperCase().includes('HTTPS://') || msg.content.toUpperCase().includes('HTTP://') || msg.content.toUpperCase().includes('WWW.') && !msg.content.toUpperCase().includes('DISCORD.GG/NY3NVRk') && !msg.content.toUpperCase().includes('DISCORDAPP.COM/INVITE/NY3NVRk')  && !msg.content.toUpperCase().includes('DISCORD.GG/Q7EQMUN') && !msg.content.toUpperCase().includes('DISCORDAPP.COM/INVITE/Q7EQMUN')  && !msg.content.toUpperCase().includes('DISCORD.GG/NY3NVRk') && !msg.content.toUpperCase().includes('DISCORDAPP.COM/INVITE/NY3NVRk')  && !msg.content.toUpperCase().includes('DISCORD.GG/YFXAAGZ') && !msg.content.toUpperCase().includes('DISCORDAPP.COM/INVITE/YFXAAGZ')){
    filters.linkarr.forEach(link => {
      if(msg.content.toUpperCase().includes(link) && !msg.member.hasPermission('MANAGE_MESSAGES')){
        msg.delete();
        msg.channel.send(`${msg.member} That link is blacklisted.`)
      }else{
        args.forEach(arg => {
          if(arg.toUpperCase().includes('HTTP://') || arg.toUpperCase().includes('HTTPS://') || arg.toUpperCase().includes('WWW.')){
            request({uri:arg,timeout:2500,followAllRedirects:true, strictSSL: false}, function(error, response, body) {
              if(response === undefined)return;
              let url = response.request.uri;
              if(url.href.includes(link)){
                msg.delete();
                msg.channel.send(`${msg.member} That link is blacklisted.`)
              }
            })
          }
        })
      }
    })
    }

    filters.wordarr.forEach(word => {
      if(msg.content.toUpperCase().includes(word)){
        msg.delete();
        msg.channel.send(`${msg.member} You are not allowed to say that.`)
      }
    })
})

client.on('message', async (msg) => {
  if(msg.channel.type == 'dm')return;
  if(msg.author.bot)return;

    let prefix = '!!';
    let msgArray = msg.content.split(" ");
    let cmd = msgArray[0].toUpperCase();
    let args = msgArray.slice(1);

    let msglength = Math.floor(msg.content.split(' ').join('').length);
    let capslength = Math.floor(msg.content.split(' ').join('').replace(/[A-Z0-9]/g, "").length);
    console.log(msg.content.split(' ').join(''))
    console.log(msg.content.split(' ').join('').replace(/[A-Z0-9]/g, ""))
    console.log(Math.floor(msglength/100 * capslength))
    if(msglength/100 * capslength >= 3){
      // msg.delete()
      // msg.channel.send('Too much capslock '+msg.member)
      // return;
    }

    if(msg.content.toUpperCase().includes('HTTPS://') || msg.content.toUpperCase().includes('HTTP://') || msg.content.toUpperCase().includes('WWW.') && !msg.content.toUpperCase().includes('DISCORD.GG/NY3NVRk') && !msg.content.toUpperCase().includes('DISCORDAPP.COM/INVITE/NY3NVRk')  && !msg.content.toUpperCase().includes('DISCORD.GG/Q7EQMUN') && !msg.content.toUpperCase().includes('DISCORDAPP.COM/INVITE/Q7EQMUN')  && !msg.content.toUpperCase().includes('DISCORD.GG/NY3NVRk') && !msg.content.toUpperCase().includes('DISCORDAPP.COM/INVITE/NY3NVRk')  && !msg.content.toUpperCase().includes('DISCORD.GG/YFXAAGZ') && !msg.content.toUpperCase().includes('DISCORDAPP.COM/INVITE/YFXAAGZ')){
    filters.linkarr.forEach(link => {
      if(msg.content.toUpperCase().includes(link) && !msg.member.hasPermission('MANAGE_MESSAGES')){
        msg.delete();
        msg.channel.send(`${msg.member} That link is blacklisted.`)
      }else{
        args.forEach(arg => {
          if(arg.toUpperCase().includes('HTTP://') || arg.toUpperCase().includes('HTTPS://') || arg.toUpperCase().includes('WWW.')){
            request({uri:arg,timeout:2500,followAllRedirects:true, strictSSL: false}, function(error, response, body) {
              if(response === undefined)return;
              let url = response.request.uri;
              if(url.href.includes(link)){
                msg.delete();
                msg.channel.send(`${msg.member} That link is blacklisted.`)
              }
            })
          }
        })
      }
    })
    }

    filters.wordarr.forEach(word => {
      if(msg.content.toUpperCase().includes(word)){
        msg.delete();
        msg.channel.send(`${msg.member} You are not allowed to say that.`)
      }
    })

    if(!msg.content.startsWith(prefix)){

      let num = Math.floor(Math.random() * Math.floor(16))
      if(num === 7){//coins
        let coins = Math.floor(Math.random() * Math.floor(250))
        economyData.forEach(data => {
          if(data.id === msg.member.id){
            let curCash = data.cash
            let newCash = Math.floor(curCash+coins)
        let moneyEmbed = new discord.RichEmbed()
        .setAuthor('Nexus community | Economy', client.user.avatarURL)
        .setColor('#36393f')
        .setDescription(`${msg.member.user.username} gained ${coins}$ cash!\nNew cash amount: ${coins} + ${curCash} = ${newCash}`)
        .setFooter('Nexus community | Economy', client.user.avatarURL)
        msg.channel.send(moneyEmbed)

        casClient.execute('UPDATE nexus.economy SET cash = ? WHERE id = ?',[newCash, msg.member.id], {hints: ['float', 'text']})
        .then(res => {

        })
        .catch(err => {
          console.log(err)
        })
        casClient.execute('SELECT * FROM economy')
        .then(res => {
          console.log('Updating economyData')
          economyData = [];
          economyData = res.rows
        })
        .catch(err => {
          console.log(err)
        })
      }
    })
      }else if(num === 15){//experience
        let xp = Math.floor(Math.random() * Math.floor(250))
        experienceData.forEach(data => {
          if(data.id === msg.member.id){
            let curxp = data.xp
            let lvl = data.level
            let newxp = Math.floor(xp+curxp)
            let rankupXP = 2000
            let newlvl = Math.floor(data.level + 1)
            if(newxp >= Math.floor(rankupXP + lvl*3000)){
              let xpEmbed = new discord.RichEmbed()
              .setAuthor('Nexus community | Experience', client.user.avatarURL)
              .setColor('#36393f')
              .setDescription(`${msg.member.user.username} gained ${xp} XP!\nNew xp amount: ${xp} + ${curxp} = ${newxp}\n\nAdditionally you also ranked up!\nNew level: ${Math.floor(data.level + 1)}`)
              .setFooter('Nexus community | Experience', client.user.avatarURL)
              msg.channel.send(xpEmbed)
              casClient.execute('UPDATE nexus.experience SET xp = ?, level = ? WHERE id = ?',[newxp,newlvl,msg.member.id], {hints: ['float','float','text']})
              .then(res => {
  
              })
              .catch(err => {
                console.log(err)
              })
            }else{
            let xpEmbed1 = new discord.RichEmbed()
            .setAuthor('Nexus community | Experience', client.user.avatarURL)
            .setColor('#36393f')
            .setDescription(`${msg.member.user.username} gained ${xp} XP!\nNew xp amount: ${xp} + ${curxp} = ${newxp}`)
            .setFooter('Nexus community | Experience', client.user.avatarURL)
            msg.channel.send(xpEmbed1)
            casClient.execute('UPDATE nexus.experience SET xp = ? WHERE id = ?',[newxp, msg.member.id], {hints: ['float', 'text']})
            .then(res => {

            })
            .catch(err => {
              console.log(err)
            })
            }
            casClient.execute('SELECT * FROM experience')
            .then(res => {
              console.log('Updating experienceData')
              experienceData = [];
              experienceData = res.rows
            })
            .catch(err => {
              console.log(err)
            })
          }
        })
      }

    }else{
    let commandfile = client.commands.get(cmd.slice(prefix.length));
    if(commandfile) commandfile.run(client,msg,args,event);
    }
})
const token = require('./token.json');
client.login(token.token)