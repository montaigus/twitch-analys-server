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
const auth_1 = require("@twurple/auth");
const api_1 = require("@twurple/api");
const dotenv_1 = require("dotenv");
const eventsub_http_1 = require("@twurple/eventsub-http");
const eventsub_ngrok_1 = require("@twurple/eventsub-ngrok");
const app = (0, express_1.default)();
const port = 3000;
const server = app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
app.use((0, cors_1.default)());
// Utilisation de body-parser pour analyser les corps des requêtes
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use(body_parser_1.default.json());
let AllChannels = [];
//getting the token
(0, dotenv_1.configDotenv)();
const clientId = process.env.CLIENTID;
const clientSecret = process.env.CLIENTSECRET;
const eventSecret = process.env.EVENTSECRET;
const authProvider = new auth_1.AppTokenAuthProvider(clientId, clientSecret);
const api = new api_1.ApiClient({ authProvider });
const eventListener = new eventsub_http_1.EventSubHttpListener({
    apiClient: api,
    secret: eventSecret,
    adapter: new eventsub_ngrok_1.NgrokAdapter(),
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
    const result = bot.currentChannels;
    if (!result) {
        res.json([]);
    }
    const channels = result.map((channel) => channel.substring(0, 1) === "#" ? channel.substring(1) : channel);
    res.json(channels);
});
const bot = new chat_1.ChatClient({
    readOnly: true,
});
function getStreamInfos(channel) {
    return __awaiter(this, void 0, void 0, function* () {
        const userObject = yield api.users.getUserByName(channel);
        const channelInfo = yield api.channels.getChannelInfoById(userObject);
        const stream = yield api.streams.getStreamByUserName(userObject);
        const streamInfos = {
            id: stream.id,
            type: stream.type,
            title: stream.title,
            startDate: stream.startDate,
            endDate: null,
        };
        return streamInfos;
    });
}
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
        console.log(`connecté à ${channel} !`);
        AllChannels.push(new types_1.ChannelDatas(channel.toLowerCase()));
        //Objets utilisé par les api
        const userObject = yield api.users.getUserByName(channel);
        const stream = yield api.streams.getStreamByUserName(userObject);
        console.log({ stream });
        //ajouts des listeners pour les stream on/off
        eventListener.onStreamOnline(userObject, () => __awaiter(void 0, void 0, void 0, function* () {
            console.log(`stream de ${channel} commencé`);
            const streamInfos = yield getStreamInfos(channel);
            //creation de la ligne du stream dans les data
            AllChannels.find((chan) => {
                chan.channel === channel;
            }).streamsData.push(new types_1.StreamData(streamInfos));
        }));
        eventListener.onStreamOffline(userObject, () => {
            var _a;
            console.log(`stream de ${channel} stoppé`);
            (_a = AllChannels.find((chan) => {
                chan.channel === channel;
            })
                .streamsData.find((stream) => stream.streamInfos.endDate === null)) === null || _a === void 0 ? void 0 : _a.streamInfos.endDate.setDate(Date.now());
        });
        // Si le stream n'est pas commencé, on renvoie l'info
        if (!stream) {
            console.log("pas de stream");
            res.status(200);
            //.send(`pas de stream de la chaine ${channel} en cours`);
        }
        //sinon, process habituel
        else
            console.log("enregistrement du chat");
        res.status(200);
        //.send(`connecté au stream de ${channel}`);
    }
    catch (error) {
        console.error("Erreur lors de la connexion du bot:", error);
        res
            .status(500)
            .send("Une erreur s'est produite lors de la connexion du bot");
    }
}));
app.post("/disconnect", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const partedChannel = req.body.channel;
    bot.part(partedChannel);
    const index = AllChannels.findIndex((chat) => {
        return chat.channel === partedChannel;
    });
    if (index >= 0) {
        AllChannels.splice(index);
    }
    console.log(`Bot déconnecté du canal ${partedChannel}`);
    res.send("ok");
}));
// Route pour générer et télécharger le fichier JSON
app.get("/download-json", (req, res) => {
    // Convertir les données en format JSON
    const jsonData = JSON.stringify(AllChannels);
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
//fonction qui assure l'enregistrement des messages pour tous les channels
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        //initiation
        yield bot.connect();
        console.log("Bot connecté !");
        //quand un message arrive, on l'enregistre dans le stream correspondant, cad celui qui n'est pas terminé
        bot.onMessage((channel, user, message, msg) => {
            var _a, _b, _c;
            console.log("\x1b[36m%s\x1b[0m", `${channel} : Nouveau message de ${user}: ${message}, ${msg}`);
            const newMsg = new types_1.StoredMessage(msg.id, message, new Date(), user);
            //si il trouve l'objet channel dans AllChannels, il trouve le dernier stream en cours, puis push le nouveau message
            //!si on pouvait le faire par id de stream ce serait mieux
            const stream = (_a = AllChannels.find((chat) => chat.channel.toLowerCase() === channel.toLowerCase())) === null || _a === void 0 ? void 0 : _a.streamsData.find((stream) => !stream.streamInfos.endDate);
            console.log({ stream });
            (_c = (_b = AllChannels.find((chat) => chat.channel.toLowerCase() === channel.toLowerCase())) === null || _b === void 0 ? void 0 : _b.streamsData.find((stream) => !stream.streamInfos.endDate)) === null || _c === void 0 ? void 0 : _c.chatData.chatMsg.push(newMsg);
        });
        bot.onBan((channel, user, msg) => {
            var _a;
            (_a = AllChannels.find((chat) => chat.channel.toLowerCase() === channel.toLowerCase())) === null || _a === void 0 ? void 0 : _a.banUsers.push({ user: user, banDate: new Date() });
            console.log("\x1b[33m%s\x1b[0m", `Cet utilisateur a été ban : ${user}, pour le message suivant : ${msg}`);
        });
        bot.onMessageRemove((channel, messageId, msg) => {
            var _a, _b, _c, _d;
            let removedMsg = (_b = (_a = AllChannels.find((chat) => chat.channel.toLowerCase() === channel.toLowerCase())) === null || _a === void 0 ? void 0 : _a.streamsData.find((stream) => !stream.streamInfos.endDate)) === null || _b === void 0 ? void 0 : _b.chatData.chatMsg.find((msg) => msg.id === messageId);
            if (!removedMsg) {
                console.log("Message non trouvé");
                removedMsg = new types_1.StoredMessage(messageId, "", new Date(), "");
                return;
            }
            const newRemovedMsg = new types_1.StoredMessage(messageId, removedMsg.message || "", new Date(), removedMsg.user);
            console.log("\x1b[31m%s\x1b[0m", "message banni " + removedMsg.message);
            //si il trouve l'objet channel dans AllChannels, il push le message banni
            (_d = (_c = AllChannels.find((chat) => chat.channel.toLowerCase() === channel.toLowerCase())) === null || _c === void 0 ? void 0 : _c.streamsData.find((stream) => !stream.streamInfos.endDate)) === null || _d === void 0 ? void 0 : _d.chatData.removedMsg.push(newRemovedMsg);
        });
    });
}
main();
//module.exports = app;
//# sourceMappingURL=server.js.map