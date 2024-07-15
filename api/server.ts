import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { ChatClient } from "@twurple/chat";
import fs from "fs";
import path from "path";
import { tmpdir } from "os";
import {
  ChannelDatas,
  StoredMessage,
  StreamData,
  StreamInfos,
  channelData,
} from "./types";
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

//let AllChannels: ChannelDatas[] = [];
const channels: channelData[] = [];
const allChats: StoredMessage[] = [];
const streamsInfos: StreamInfos[] = [];
const allRemovedMsg: StoredMessage[] = [];

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
  // const result: string[] = bot.currentChannels;
  // if (!result) {
  //   res.json([]);
  // }
  // const channels = result.map((channel) =>
  //   channel.substring(0, 1) === "#" ? channel.substring(1) : channel
  // );
  // res.json(channels);
  res.json(channels.map((chan) => chan.name));
});

const bot = new ChatClient({
  readOnly: true,
});

async function getStreamInfos(channel: string) {
  const userObject = await api.users.getUserByName(channel);
  const stream = await api.streams.getStreamByUserName(userObject);

  const streamInfos: StreamInfos = {
    id: stream.id,
    type: stream.type,
    title: stream.title,
    channel: channel,
    startDate: stream.startDate,
    endDate: null,
  };

  return streamInfos;
}

async function setNewStreamInfos(channel: string) {
  const streamInfos = await getStreamInfos(channel);
  //creation de la ligne du stream dans les data
  streamsInfos.push(streamInfos);
  //mise a jour du current stream
  const index = channels.findIndex((chan) => chan.name === channel);
  if (index === -1) {
    console.log("problème de chaine");
    return;
  } else {
    channels[index].currentStreamId = streamInfos.id;
  }
}

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
    channels.push(new channelData(channel.toLowerCase()));
    //Objets utilisé par les api
    const userObject = await api.users.getUserByName(channel);
    const stream = await api.streams.getStreamByUserName(userObject);
    console.log({ stream });

    //ajouts des listeners pour les stream on/off
    eventListener.onStreamOnline(userObject, async () => {
      console.log(`stream de ${channel} commencé`);
      setNewStreamInfos(channel);
    });
    eventListener.onStreamOffline(userObject, () => {
      console.log(`stream de ${channel} stoppé`);
      const streamIndex = streamsInfos.findIndex(
        (stream) => stream.endDate === null && stream.channel === channel
      );
      if (streamIndex === -1) {
        console.log("Problème de stream info");
        return;
      } else {
        streamsInfos[streamIndex].endDate = new Date();
      }
      const chanIndex = channels.findIndex(
        (chan) => chan.currentStreamId === channel
      );
      if (chanIndex === -1) {
        console.log("probleme de channel");
        return;
      } else {
        channels[chanIndex].currentStreamId = null;
      }
    });

    // Si le stream n'est pas commencé, on renvoie l'info
    if (!stream) {
      console.log("pas de stream");
      res.status(200);
      //.send(`pas de stream de la chaine ${channel} en cours`);
    }
    //sinon, process habituel
    else {
      console.log("enregistrement du chat");
      setNewStreamInfos(channel);
      res.status(200);
    }
    //.send(`connecté au stream de ${channel}`);
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

  const index = channels.findIndex((chan) => chan.name === partedChannel);
  if (index >= 0) {
    channels.splice(index);
  }

  //!on doit aussi clean les autres collections
  console.log(`Bot déconnecté du canal ${partedChannel}`);
  res.send("ok");
});

// Route pour générer et télécharger le fichier JSON
app.get("/download-json", (req, res) => {
  //!faut tout refaire pour recréer les bonnes données
  // Convertir les données en format JSON
  const jsonData = JSON.stringify(channels);
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

//fonction qui assure l'enregistrement des messages pour tous les channels
async function main() {
  //initiation
  await bot.connect();
  console.log("Bot connecté !");

  //quand un message arrive, on l'enregistre dans le stream correspondant, cad celui qui n'est pas terminé
  bot.onMessage((channel, user, message, msg) => {
    console.log(
      "\x1b[36m%s\x1b[0m",
      `${channel} : Nouveau message de ${user}: ${message}, ${msg}`
    );

    const newMsg = new StoredMessage(
      msg.id,
      message,
      new Date(),
      user,
      channel
    );

    //si il trouve l'objet channel dans AllChannels, il trouve le dernier stream en cours, puis push le nouveau message
    //!si on pouvait le faire par id de stream ce serait mieux
    const chanIndex = channels.findIndex((chan) => chan.name === channel);
    if (chanIndex === -1) {
      console.log("probleme de channel");
    } else {
      const streamId = channels[chanIndex].currentStreamId;
      if (!streamId) console.log("pas de stream en cours pour ce message");
      else {
        const streamInfo = streamsInfos.find(
          (stream) => stream.id === streamId
        );
        if (!streamInfo)
          console.log("pas de stream correspondant, c'est chiant");

        newMsg.streamId = streamId;
        if (streamInfo)
          newMsg.upTime =
            newMsg.date.getMilliseconds() -
            streamInfo.startDate.getMilliseconds();
      }
    }
  });

  bot.onBan((channel, user, msg) => {
    channels.find((chan) => chan.name == channel).banUsers.push(user);
    console.log(
      "\x1b[33m%s\x1b[0m",
      `Cet utilisateur a été ban : ${user}, pour le message suivant : ${msg}`
    );
  });

  bot.onMessageRemove((channel, messageId, msg) => {
    const removedMsg = allChats.find((message) => message.id === messageId);

    if (!removedMsg) {
      console.log("Message non trouvé");
      removedMsg.id = messageId;
      removedMsg.message = "";
      (removedMsg.date = new Date()), (removedMsg.user = "");
    }

    console.log("\x1b[31m%s\x1b[0m", "message banni " + removedMsg.message);

    allRemovedMsg.push(removedMsg);
  });
}
main();
//module.exports = app;
