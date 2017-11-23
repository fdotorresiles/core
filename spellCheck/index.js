var request = require('request');
var cnf = require('../config/configuration');

module.exports = class SpellCheck {

    constructor() { }

    checkText(inutText, callbackReturn) {

        var globalCallback = callbackReturn;

        var options = {
            url: `https://api.cognitive.microsoft.com/bing/v5.0/spellcheck/?text=${inutText}`,
            headers: {
                'User-Agent': 'request',
                'Host': cnf.spelEndPoint,
                'Ocp-Apim-Subscription-Key': cnf.spellAPI
            }
        };

        function callback(error, response, body) {
            if (!error && response.statusCode == 200) {
                var info = JSON.parse(body);
                globalCallback(null, info.flaggedTokens[0] == undefined ? 'None' : info.flaggedTokens[0].suggestions[0].suggestion);
                return;
            }

            globalCallback(error, null);
        }

        request(options, callback);

    }
}