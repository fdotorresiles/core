var request = require('request');
var builder = require('botbuilder');

module.exports = class Templates {

    constructor(session, message) {
        this.session = session;
        this.responseTexto(message);

        // switch (results[0][4].value) {
        //     case 'Prompt':
        //         this.responseTexto(results[0][3].value);
        //         this.responsePromptList(JSON.parse(results[0][5].value));
        //         break;
        //     case 'textual':
        //         this.responseTexto(results[0][3].value);
        //         break;
        //     default:
        //         break;
        // }
    }

    sendResponse(data) {
        this.session.send(data);
    }

    //Templates bellow
    responsePromptList(data) {


        const card = new builder.ThumbnailCard(this.session)
            .title(data.titulo)
            .buttons(data.opciones.map(item => new builder.CardAction.imBack(this.session, item.entity, item.titulo)));
        const message = new builder.Message(this.session)
            .addAttachment(card);
        builder.Prompts.choice(this.session, message, data.opciones);
    }

    responseTexto(data) {
        this.sendResponse(data);
    }

}