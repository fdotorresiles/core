// This loads the environment variables from the .env file
require('dotenv-extended').load();
var botActions = require('../templates');
var cnf = require('../config/configuration');

var builder = require('botbuilder');
var restify = require('restify');
var locationDialog = require('botbuilder-location');

var database = require('../database');
var spellCheck = require('../spellCheck');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create connector and listen for messages
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

var recognizer = new builder.LuisRecognizer(process.env.LUIS_MODEL_URL);
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

server.get('/', (req, res) => {
    res.json({ 'Name': cnf.appName });
});


bot.use({
    botbuilder: function (session, next) {
        recognizer.recognize(session, function (err, result) {

            if(err) {
                new botActions(session, "Ups, intente mejor luego");
                return;
            }

            session.sendTyping();
            var newCnx = new database();

            if (result && result.intent !== 'None') {

                // newCnx.insertDialog({
                //     idUsuario: session.message.user.id == undefined ? 0 : session.message.user.id,
                //     nombre_usuario: session.message.user.name == undefined ? "undefined" : session.message.user.name,
                //     conversacion: session.message.text,
                //     animo: 50.1
                // }, function (error, results) {
                //     if (error != null) {
                //         console.log(error);
                //         return
                //     }
                //     console.log(results);
                // });

                newCnx.select({ session, result })
                    .then((result) => {
                        if (result.length == 0) {
                            newCnx.select({session, result})
                                .then((result) => {
                                    new botActions(session, results[0][0].value);
                                })

                            return;
                        }
                        new botActions(session, results[0][0].value);
                    })
                    .catch((err) => {
                        return;
                    });
            } else {

                var newSpellCheck = new spellCheck();

                newSpellCheck.checkText(session.message.text, function (error, resultPredic) {

                    if (error != undefined || error != null) {
                        console.log(error);
                        return;
                    }

                    if (resultPredic == "None") {
                        newCnx.select(null, function (error, results) {
                            if (error != null) {
                                console.log(error);
                                return
                            }

                            new botActions(session, results);
                        });
                        return;
                    }

                    session.message.text = resultPredic;
                    recognizer.recognize(session, function (err, result) {


                        if (result && result.intent !== 'None') {

                            newCnx.insertDialog({
                                idUsuario: session.message.user.id == undefined ? 0 : session.message.user.id,
                                nombre_usuario: session.message.user.name == undefined ? "undefined" : session.message.user.name,
                                conversacion: session.message.text,
                                animo: 50.1
                            }, function (error, results) {
                                if (error != null) {
                                    console.log(error);
                                    return
                                }
                                console.log(results);
                            });

                            newCnx.select(result, function (error, results) {
                                if (error != null) {
                                    console.log(error);
                                    return
                                }

                                if (results.length == 0) {
                                    newCnx.select(null, function (error, results) {
                                        if (error != null) {
                                            console.log(error);
                                            return
                                        }

                                        new botActions(session, results);
                                    });

                                    return;
                                }

                                new botActions(session, results);
                            });
                        } else {

                            newCnx.select(result.intent, function (error, results) {
                                if (error != null) {
                                    console.log(error);
                                    return
                                }

                                new botActions(session, results);
                            });

                        }


                    });

                });
            }
        });
    },
    send: function (event, next) {
        myMiddleware.logOutgoingMessage(event, next);
    }
})


// newCnx.select(result.intent, function (error, results) {
//     if (error != null) {
//         console.log(error);
//         return
//     }

//     new botActions(session, results);
// });