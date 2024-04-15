"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const chat_1 = require("@twurple/chat");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = require("os");
const types_1 = require("./types");
const app = (0, express_1.default)();
const port = 3000;
const server = app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
app.use((0, cors_1.default)());
// Utilisation de body-parser pour analyser les corps des requêtes
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use(body_parser_1.default.json());
let chatMsg = [];
let banMsg = [];
const allChats = [];
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
const bot = new chat_1.ChatClient({
    readOnly: true,
});
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        yield bot.connect();
        console.log("Bot connecté !");
        bot.onMessage((channel, user, message, msg) => {
            var _a;
            console.log("\x1b[36m%s\x1b[0m", `${channel} : Nouveau message de ${user}: ${message}`);
            const newMsg = new types_1.storedMessage(msg.id, message, new Date(), user);
            //si il trouve l'objet channel dans allChats, il push le nouveau message
            (_a = allChats
                .find((c) => c.channel.toLowerCase() === channel.toLowerCase())) === null || _a === void 0 ? void 0 : _a.chatMsg.push(newMsg);
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
            console.log("\x1b[33m%s\x1b[0m", `Cet utilisateur a été ban : ${user}, pour le message suivant : ${msg}`);
        });
        bot.onMessageRemove((channel, messageId, msg) => {
            var _a, _b;
            let removedMsg = (_a = allChats
                .find((c) => c.channel.toLowerCase() === channel.toLowerCase())) === null || _a === void 0 ? void 0 : _a.chatMsg.find((c) => c.id === messageId);
            if (!removedMsg) {
                console.log("Message non trouvé");
                removedMsg = new types_1.storedMessage(messageId, "", new Date(), "");
                return;
            }
            const newRemovedMsg = new types_1.storedMessage(messageId, removedMsg.message || "", new Date(), removedMsg.user);
            //chatMsg
            //   .filter((c) => c.channel.toLowerCase() === channel.toLowerCase())
            //   .find((c) => {
            //     c.data.id === messageId;
            //   });
            console.log("\x1b[31m%s\x1b[0m", "message banni " + removedMsg.message);
            //si il trouve l'objet channel dans allChats, il push le message banni
            (_b = allChats
                .find((c) => c.channel.toLowerCase() === channel.toLowerCase())) === null || _b === void 0 ? void 0 : _b.removedMsg.push(newRemovedMsg);
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
    });
}
main();
app.post("/connect", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!bot) {
        console.log("Bot non connecté");
        res.status(500).send("Bot non connecté");
    }
    const channel = req.body.channel;
    if (channel === "" || channel.substring(0, 1) === "_") {
        res.status(400).send("Mauvaise chaine");
    }
    try {
        // Connexion du nouveau bot
        yield bot.join(channel);
        console.log(`connecté au chat de ${channel} !`);
        allChats.push(new types_1.channelAllMsg(channel));
        res.send("ok");
    }
    catch (error) {
        console.error("Erreur lors de la connexion du bot:", error);
        res
            .status(500)
            .send("Une erreur s'est produite lors de la connexion du bot");
    }
}));
app.post("/disconnect", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const channel = req.body.channel;
    bot.part(channel);
    console.log(`Bot déconnecté du canal ${channel}`);
    res.send("ok");
}));
// Route pour générer et télécharger le fichier JSON
app.get("/download-json", (req, res) => {
    // const allData = {
    //   allChat: chatMsg,
    //   removedMsg: banMsg,
    // };
    // Convertir les données en format JSON
    const jsonData = JSON.stringify(allChats);
    // Vérifie si le dossier existe, s'il n'existe pas, le crée
    if (!fs_1.default.existsSync((0, os_1.tmpdir)())) {
        console.log("Création du dossier temporaire...");
    }
    const filePath = path_1.default.join((0, os_1.tmpdir)(), "temp.json");
    // Écrire le contenu JSON dans un fichier temporaire
    fs_1.default.writeFile(filePath, jsonData, (err) => {
        if (err)
            throw err;
        const date = new Date().toLocaleDateString().split("/").join("_");
        const fileName = `msgData_${date}.json`;
        // Envoyer le fichier au client en tant que téléchargement
        res.download(filePath, fileName, (err) => {
            if (err)
                throw err;
            // Supprimer le fichier temporaire après le téléchargement
            fs_1.default.unlink(filePath, (err) => {
                if (err)
                    throw err;
                console.log("Fichier temporaire supprimé.");
            });
        });
    });
});
//module.exports = app;
//# sourceMappingURL=server.js.map