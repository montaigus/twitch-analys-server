import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { ChatClient } from "@twurple/chat";
import fs from "fs";
import path from "path";
import { tmpdir } from "os";
import { ChannelDatas, StoredMessage, StreamData, StreamInfos } from "./types";
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

let AllChannels: ChannelDatas[] = [];

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
  res.json(AllChannels);
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

  const streamInfos: StreamInfos = {
    id: stream.id,
    type: stream.type,
    title: stream.title,
    startDate: stream.startDate,
    endDate: null,
  };

  return streamInfos;
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
    AllChannels.push(new ChannelDatas(channel.toLowerCase()));
    //Objets utilisé par les api
    const userObject = await api.users.getUserByName(channel);
    const stream = await api.streams.getStreamByUserName(userObject);
    console.log({ stream });
    //ajouts des listeners pour les stream on/off
    eventListener.onStreamOnline(userObject, async () => {
      console.log(`stream de ${channel} commencé`);
      const streamInfos = await getStreamInfos(channel);
      //creation de la ligne du stream dans les data
      AllChannels.find((chan) => {
        chan.channel === channel;
      })!.streamsData.push(new StreamData(streamInfos));
    });
    eventListener.onStreamOffline(userObject, () => {
      console.log(`stream de ${channel} stoppé`);
      AllChannels.find((chan) => {
        chan.channel === channel;
      })!
        .streamsData.find((stream) => stream.streamInfos.endDate === null)
        ?.streamInfos.endDate.setDate(Date.now());
    });

    // Si le stream n'est pas commencé, on renvoie l'info
    if (!stream) {
      console.log("pas de stream");
      res.status(200);
      //.send(`pas de stream de la chaine ${channel} en cours`);
    }
    //sinon, process habituel
    else console.log("enregistrement du chat");
    res.status(200);
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

  const index = AllChannels.findIndex((chat) => {
    return chat.channel === partedChannel;
  });
  if (index >= 0) {
    AllChannels.splice(index);
  }
  console.log(`Bot déconnecté du canal ${partedChannel}`);
  res.send("ok");
});

// Route pour générer et télécharger le fichier JSON
app.get("/download-json", (req, res) => {
  // Convertir les données en format JSON
  const jsonData = JSON.stringify(AllChannels);
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

    const newMsg = new StoredMessage(msg.id, message, new Date(), user);

    //si il trouve l'objet channel dans AllChannels, il trouve le dernier stream en cours, puis push le nouveau message
    //!si on pouvait le faire par id de stream ce serait mieux
    const stream = AllChannels.find(
      (chat) => chat.channel.toLowerCase() === channel.toLowerCase()
    )?.streamsData.find((stream) => !stream.streamInfos.endDate);

    console.log({ stream });

    AllChannels.find(
      (chat) => chat.channel.toLowerCase() === channel.toLowerCase()
    )
      ?.streamsData.find((stream) => !stream.streamInfos.endDate)
      ?.chatData.chatMsg.push(newMsg);
  });

  bot.onBan((channel, user, msg) => {
    AllChannels.find(
      (chat) => chat.channel.toLowerCase() === channel.toLowerCase()
    )?.banUsers.push({ user: user, banDate: new Date() });
    console.log(
      "\x1b[33m%s\x1b[0m",
      `Cet utilisateur a été ban : ${user}, pour le message suivant : ${msg}`
    );
  });

  bot.onMessageRemove((channel, messageId, msg) => {
    let removedMsg = AllChannels.find(
      (chat) => chat.channel.toLowerCase() === channel.toLowerCase()
    )
      ?.streamsData.find((stream) => !stream.streamInfos.endDate)
      ?.chatData.chatMsg.find((msg) => msg.id === messageId);
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

    //si il trouve l'objet channel dans AllChannels, il push le message banni
    AllChannels.find(
      (chat) => chat.channel.toLowerCase() === channel.toLowerCase()
    )
      ?.streamsData.find((stream) => !stream.streamInfos.endDate)
      ?.chatData.removedMsg.push(newRemovedMsg);
  });
}
main();
//module.exports = app;
