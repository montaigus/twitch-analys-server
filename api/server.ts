import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { ChatClient } from "@twurple/chat";
import fs from "fs";
import path from "path";
import { tmpdir } from "os";
import { channelAllMsg, storedMessage } from "./types.ts";

const app = express();
const port = 3000;
const server = app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

app.use(cors());
// Utilisation de body-parser pour analyser les corps des requêtes
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let chatMsg: any[] = [];
let banMsg: any[] = [];
const allChats: channelAllMsg[] = [];

app.get("/", (req, res) => {
  res.send("Express on Vercel");
});

app.get("/allchat", (req, res) => {
  res.json(allChats);
});

app.get("/channels", (req, res) => {
  const result = bot.currentChannels;
  if (!result) {
    res.json([]);
  }
  res.json(result);
});

const bot = new ChatClient({
  readOnly: true,
});

async function main() {
  await bot.connect();
  console.log("Bot connecté !");

  bot.onMessage((channel, user, message, msg) => {
    console.log(
      "\x1b[36m%s\x1b[0m",
      `${channel} : Nouveau message de ${user}: ${message}`
    );

    const newMsg = new storedMessage(msg.id, message, new Date(), user);

    //si il trouve l'objet channel dans allChats, il push le nouveau message
    allChats
      .find((c) => c.channel.toLowerCase() === channel.toLowerCase())
      ?.chatMsg.push(newMsg);

    // chatMsg.push({
    //   channel: channel,
    //   data: {
    //     id: msg.id,
    //     user: user,
    //     message: message,
    //   },
    // });
  });

  bot.onBan((channel, user, msg) => {
    console.log(
      "\x1b[33m%s\x1b[0m",
      `Cet utilisateur a été ban : ${user}, pour le message suivant : ${msg}`
    );
  });

  bot.onMessageRemove((channel, messageId, msg) => {
    let removedMsg = allChats
      .find((c) => c.channel.toLowerCase() === channel.toLowerCase())
      ?.chatMsg.find((c) => c.id === messageId);
    if (!removedMsg) {
      console.log("Message non trouvé");
      removedMsg = new storedMessage(messageId, "", new Date(), "");
      return;
    }
    const newRemovedMsg = new storedMessage(
      messageId,
      removedMsg.message || "",
      new Date(),
      removedMsg.user
    );
    //chatMsg
    //   .filter((c) => c.channel.toLowerCase() === channel.toLowerCase())
    //   .find((c) => {
    //     c.data.id === messageId;
    //   });

    console.log("\x1b[31m%s\x1b[0m", "message banni " + removedMsg.message);

    //si il trouve l'objet channel dans allChats, il push le message banni
    allChats
      .find((c) => c.channel.toLowerCase() === channel.toLowerCase())
      ?.removedMsg.push(newRemovedMsg);

    // banMsg.push({
    //   channel: channel,
    //   data: {
    //     id: messageId,
    //     message: removedMsg || "",
    //     date: new Date().toLocaleDateString(),
    //   },
    //});
    //if (msg.params) console.log("\x1b[32m%s\x1b[0m", msg.params);
  });
}

main();

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
    console.log(`connecté au chat de ${channel} !`);
    allChats.push(new channelAllMsg(channel));
    res.send("ok");
  } catch (error) {
    console.error("Erreur lors de la connexion du bot:", error);
    res
      .status(500)
      .send("Une erreur s'est produite lors de la connexion du bot");
  }
});

app.post("/disconnect", async (req, res) => {
  const channel = req.body.channel;
  bot.part(channel);
  console.log(`Bot déconnecté du canal ${channel}`);
  res.send("ok");
});

// Route pour générer et télécharger le fichier JSON
app.get("/download-json", (req, res) => {
  // const allData = {
  //   allChat: chatMsg,
  //   removedMsg: banMsg,
  // };

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
