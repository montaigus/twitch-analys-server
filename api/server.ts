import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { ChatClient } from "@twurple/chat";
import fs from "fs";
import path from "path";
import { tmpdir } from "os";
import { ChannelDatas, StoredMessage, StreamInfo } from "./types";
import { AuthProvider, AppTokenAuthProvider } from "@twurple/auth";
import { ApiClient } from "@twurple/api";
import { config, configDotenv } from "dotenv";
import { EventSubHttpListener } from "@twurple/eventsub-http";
import { NgrokAdapter } from "@twurple/eventsub-ngrok";

const app = express();
const port = 3000;
const server = app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

app.use(cors());
// Utilisation de body-parser pour analyser les corps des requêtes
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let allChats: ChannelDatas[] = [];

//getting the token
configDotenv();
const clientId = process.env.CLIENTID;
const clientSecret = process.env.CLIENTSECRET;
const eventSecret = process.env.EVENTSECRET;

const authProvider = new AppTokenAuthProvider(clientId, clientSecret);
const api = new ApiClient({ authProvider });

const eventListener = new EventSubHttpListener({
  apiClient: api,
  secret: eventSecret,
  adapter: new NgrokAdapter(),
});

// async function tryApiConnect() {
//   try {
//     await api.games.getGameByName("Hearthstone");
//   } catch (error) {
//     return false;
//   }
// }
// if (!tryApiConnect()) console.log("error connecting to API");

app.get("/", (req, res) => {
  res.send("Express on Vercel");
});

app.get("/allchat", (req, res) => {
  res.json(allChats);
});

app.get("/channels", (req, res) => {
  const result: string[] = bot.currentChannels;
  if (!result) {
    res.json([]);
  }
  const channels = result.map((channel) =>
    channel.substring(0, 1) === "#" ? channel.substring(1) : channel
  );
  res.json(channels);
});

const bot = new ChatClient({
  readOnly: true,
});

async function getStreamInfos(channel: string) {
  const userObject = await api.users.getUserByName(channel);
  const channelInfo = await api.channels.getChannelInfoById(userObject);
  const stream = await api.streams.getStreamByUserName(userObject);

  const streamInfos: StreamInfo = {
    id: stream.id,
    type: stream.type,
    title: stream.title,
    startDate: stream.startDate,
  };
}

// async function logChannelInfo(channelName: string) {
//   const userObject = await api.users.getUserByName(channelName);
//   const channelInfo = await api.channels.getChannelInfoById(userObject);
//   const stream = await api.streams.getStreamByUserName(userObject);
//   const badges = await api.chat.getChannelBadges(userObject);
//   console.log("channel info :");
//   console.log(channelInfo.delay);
//   console.log(channelInfo.name);
//   console.log(channelInfo.title);
//   console.log("stream info :");
//   console.log(stream.startDate);
//   console.log(stream.tags);
//   console.log(stream.title);
//   console.log(stream.type);
//   console.log(stream.viewers);
//   console.log("badges :");
//   console.log(badges.length);
//   console.log(
//     badges.reduce((a, b) => {
//       const allVersion = b.versions.reduce((c, d) => {
//         const info = {
//           action: d.clickAction,
//           url: d.clickUrl,
//           descr: d.description,
//           title: d.title,
//         };
//         Object.assign(c, info);
//         return c;
//       }, {});
//       Object.assign(a, allVersion);
//       return a;
//     }, {})
//   );
// }

app.post("/connect", async (req, res) => {
  if (!bot) {
    console.log("Bot non connecté");
    res.status(500).send("Bot non connecté");
  }

  const channel: string = req.body.channel;

  if (channel === "" || channel.substring(0, 1) === "_") {
    res.status(400).send("Mauvaise chaine");
  }

  try {
    // Connexion du nouveau bot
    await bot.join(channel);
    console.log(`connecté à ${channel} !`);
    const userObject = await api.users.getUserByName(channel);
    const stream = await api.streams.getStreamByUserName(userObject);
    //! Si le stream n'est pas commencé, c'est null, on peut donc vérifier ça
    console.log({ stream });
    if (!stream) console.log("pas de stream");
    else console.log("enregistrement du chat");
    eventListener.onStreamOnline(userObject, () => {
      console.log(`stream de ${channel} commencé`);
    });
    eventListener.onStreamOffline(userObject, () => {
      console.log(`stream de ${channel} stoppé`);
    });
    allChats.push(new ChannelDatas(channel.toLowerCase()));
    res.send("ok");
  } catch (error) {
    console.error("Erreur lors de la connexion du bot:", error);
    res
      .status(500)
      .send("Une erreur s'est produite lors de la connexion du bot");
  }
});

app.post("/disconnect", async (req, res) => {
  const partedChannel: string = req.body.channel;
  bot.part(partedChannel);

  const index = allChats.findIndex((chat) => {
    return chat.channel === partedChannel;
  });
  if (index >= 0) {
    allChats.splice(index);
  }
  console.log(`Bot déconnecté du canal ${partedChannel}`);
  res.send("ok");
});

// Route pour générer et télécharger le fichier JSON
app.get("/download-json", (req, res) => {
  // Convertir les données en format JSON
  const jsonData = JSON.stringify(allChats);
  // Vérifie si le dossier existe, s'il n'existe pas, le crée
  if (!fs.existsSync(tmpdir())) {
    console.log("Création du dossier temporaire...");
  }

  const filePath = path.join(tmpdir(), "temp.json");

  // Écrire le contenu JSON dans un fichier temporaire
  fs.writeFile(filePath, jsonData, (err) => {
    if (err) throw err;

    const date = new Date().toLocaleDateString().split("/").join("_");
    const fileName = `msgData_${date}.json`;

    // Envoyer le fichier au client en tant que téléchargement
    res.download(filePath, fileName, (err) => {
      if (err) throw err;

      // Supprimer le fichier temporaire après le téléchargement
      fs.unlink(filePath, (err) => {
        if (err) throw err;
        console.log("Fichier temporaire supprimé.");
      });
    });
  });
});

async function main() {
  await bot.connect();
  console.log("Bot connecté !");

  bot.onMessage((channel, user, message, msg) => {
    console.log(
      "\x1b[36m%s\x1b[0m",
      `${channel} : Nouveau message de ${user}: ${message}`
    );

    const newMsg = new StoredMessage(msg.id, message, new Date(), user);

    //si il trouve l'objet channel dans allChats, il push le nouveau message
    allChats
      .find((chat) => chat.channel.toLowerCase() === channel.toLowerCase())
      ?.chatMsg.push(newMsg);
  });

  bot.onBan((channel, user, msg) => {
    allChats
      .find((chat) => chat.channel.toLowerCase() === channel.toLowerCase())
      ?.banUsers.push(user);
    console.log(
      "\x1b[33m%s\x1b[0m",
      `Cet utilisateur a été ban : ${user}, pour le message suivant : ${msg}`
    );
  });

  bot.onMessageRemove((channel, messageId, msg) => {
    let removedMsg = allChats
      .find((chat) => chat.channel.toLowerCase() === channel.toLowerCase())
      ?.chatMsg.find((msg) => msg.id === messageId);
    if (!removedMsg) {
      console.log("Message non trouvé");
      removedMsg = new StoredMessage(messageId, "", new Date(), "");
      return;
    }
    const newRemovedMsg = new StoredMessage(
      messageId,
      removedMsg.message || "",
      new Date(),
      removedMsg.user
    );

    console.log("\x1b[31m%s\x1b[0m", "message banni " + removedMsg.message);

    //si il trouve l'objet channel dans allChats, il push le message banni
    allChats
      .find((chat) => chat.channel.toLowerCase() === channel.toLowerCase())
      ?.removedMsg.push(newRemovedMsg);
  });
}
main();
//module.exports = app;
