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
//let AllChannels: ChannelDatas[] = [];
const channels = [];
const allChats = [];
const streamsInfos = [];
const allRemovedMsg = [];
const removedMsgIds = [];
const users = [];
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
app.get("/", (req, res) => {
    res.send("Express on Vercel");
});
app.get("/allchat", (req, res) => {
    res.json(allChats);
});
app.get("/channels", (req, res) => {
    res.json(channels.map((chan) => chan.name));
});
const bot = new chat_1.ChatClient({
    readOnly: true,
});
function getStreamInfos(channel) {
    return __awaiter(this, void 0, void 0, function* () {
        const userObject = yield api.users.getUserByName(channel);
        const stream = yield api.streams.getStreamByUserName(userObject);
        const streamInfos = {
            id: stream.id,
            type: stream.type,
            title: stream.title,
            channel: channel,
            startDate: stream.startDate,
            endDate: null,
        };
        return streamInfos;
    });
}
function setNewStreamInfos(channel) {
    return __awaiter(this, void 0, void 0, function* () {
        const streamInfos = yield getStreamInfos(channel);
        //creation de la ligne du stream dans les data
        streamsInfos.push(streamInfos);
        //mise a jour du current stream
        const index = channels.findIndex((chan) => chan.name === channel);
        if (index === -1) {
            console.log("problème de chaine");
            return;
        }
        else {
            channels[index].currentStreamId = streamInfos.id;
        }
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
    const user = yield api.users.getUserByName(channel);
    if (!user) {
        console.log("mauvaise chan");
        res.send("mauvaise chaine");
        return;
    }
    //!Mettre une vérif de l'existence de la chaine
    try {
        // Connexion du nouveau bot
        yield bot.join(channel);
        console.log(`connecté à ${channel} !`);
        channels.push(new types_1.channelData(channel.toLowerCase()));
        //Objets utilisé par les api
        const userObject = yield api.users.getUserByName(channel);
        const stream = yield api.streams.getStreamByUserName(userObject);
        console.log({ stream });
        //ajouts des listeners pour les stream on/off
        eventListener.onStreamOnline(userObject, () => __awaiter(void 0, void 0, void 0, function* () {
            console.log(`stream de ${channel} commencé`);
            setNewStreamInfos(channel);
        }));
        eventListener.onStreamOffline(userObject, () => {
            console.log(`stream de ${channel} stoppé`);
            const streamIndex = streamsInfos.findIndex((stream) => stream.endDate === null && stream.channel === channel);
            if (streamIndex === -1) {
                console.log("Problème de stream info");
                return;
            }
            else {
                streamsInfos[streamIndex].endDate = new Date();
            }
            const chanIndex = channels.findIndex((chan) => chan.currentStreamId === channel);
            if (chanIndex === -1) {
                console.log("probleme de channel");
                return;
            }
            else {
                channels[chanIndex].currentStreamId = null;
            }
        });
        // Si le stream n'est pas commencé, on renvoie l'info
        if (!stream) {
            console.log("pas de stream");
            res.status(201).send(channel);
            //.send(`pas de stream de la chaine ${channel} en cours`);
        }
        //sinon, process habituel
        else {
            console.log("enregistrement du chat");
            setNewStreamInfos(channel);
            res.status(200).send(channel);
        }
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
    const index = channels.findIndex((chan) => chan.name === partedChannel);
    if (index >= 0) {
        channels.splice(index);
    }
    //!on doit aussi clean les autres collections
    console.log(`Bot déconnecté du canal ${partedChannel}`);
    res.send("ok");
}));
function getOrganizedData() {
    const allData = {
        Data: [],
        removedMsg: removedMsgIds,
        users: users.map((us) => {
            return {
                N: us.userName,
                BI: us.badgeInfo,
                B: us.badges,
                UT: us.userType,
                IM: us.isMod,
            };
        }),
    };
    channels.forEach((chan) => {
        const chanData = new types_1.OrganizedInfos(chan.name, chan.banUsers);
        const chanStreams = streamsInfos.filter((stream) => stream.channel === chan.name);
        if (chanStreams) {
            chanStreams.forEach((stream) => {
                const streamData = new types_1.StreamData(stream);
                const allMsg = allChats
                    .filter((msg) => msg.streamId === stream.id)
                    .map((msg) => new types_1.ReadableMsgData(msg));
                streamData.chatData.chatMsg = allMsg;
                const readableRemovedMsg = allRemovedMsg
                    .filter((msg) => msg.streamId === stream.id)
                    .map((msg) => new types_1.ReadableMsgData(msg));
                streamData.chatData.removedMsg = readableRemovedMsg;
                chanData.allStreams.push(streamData);
            });
        }
        const allwildMsg = allChats.filter((msg) => msg.streamId === null || undefined);
        const allReadableWild = allwildMsg.map((msg) => new types_1.ReadableMsgData(msg));
        chanData.wildMsgs = allReadableWild;
        allData.Data.push(chanData);
    });
    return allData;
}
// Route pour générer et télécharger le fichier JSON
app.get("/download-json", (req, res) => {
    //!faut tout refaire pour recréer les bonnes données
    // Convertir les données en format JSON
    const jsonData = JSON.stringify(getOrganizedData());
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
        bot.onMessage((channel, user, message, msg) => {
            if (!users.find((us) => us === msg.userInfo))
                users.push(msg.userInfo);
            console.log("\x1b[36m%s\x1b[0m", `${channel} : Nouveau message de ${user}: ${message}`);
            const newMsg = new types_1.StoredMessage(msg.id, message, msg.date, user, channel);
            const chanIndex = channels.findIndex((chan) => chan.name === channel);
            if (chanIndex === -1) {
                console.log("probleme de channel");
            }
            else {
                const streamId = channels[chanIndex].currentStreamId;
                if (!streamId)
                    console.log("pas de stream en cours pour ce message");
                else {
                    const streamInfo = streamsInfos.find((stream) => stream.id === streamId);
                    if (!streamInfo)
                        console.log("pas de stream correspondant, c'est chiant");
                    newMsg.streamId = streamId;
                    if (streamInfo)
                        newMsg.upTime =
                            newMsg.date.getTime() - streamInfo.startDate.getTime();
                }
            }
            allChats.push(newMsg);
        });
        bot.onBan((channel, user, msg) => {
            channels.find((chan) => chan.name == channel).banUsers.push(user);
            console.log("\x1b[33m%s\x1b[0m", `Cet utilisateur a été ban : ${user}, pour le message suivant : ${msg}`);
        });
        bot.onMessageRemove((channel, messageId, msg) => {
            const removedMsg = allChats.find((message) => message.id === messageId);
            console.log({ removedMsg });
            // if (!removedMsg) {
            //   console.log("Message non trouvé");
            //   removedMsg.id = messageId;
            //   removedMsg.message = "";
            //   (removedMsg.date = new Date()), (removedMsg.user = "");
            // }
            if (removedMsg)
                allRemovedMsg.push(removedMsg);
            console.log({ messageId });
            removedMsgIds.push(messageId);
            //console.log("\x1b[31m%s\x1b[0m", "message banni " + removedMsg.message);
            //allRemovedMsg.push(removedMsg);
        });
    });
}
main();
//module.exports = app;
//# sourceMappingURL=server.js.map