var cnf = require('../config/configuration');
var ConnectionPool = require('tedious-connection-pool');

var Connection = require('tedious').Connection;
var Request = require('tedious').Request
var TYPES = require('tedious').TYPES;

module.exports = class Templates {

    constructor() {
        var config = {
            userName: cnf.sqlserver.userName,
            password: cnf.sqlserver.password,
            server: cnf.sqlserver.server,
            options: {
                database: cnf.sqlserver.options.database,
                encrypt: cnf.sqlserver.options.encrypt,
            }
        };

        var poolConfig = {
            min: 1,
            max: 3,
            log: true
        };

        this.pool = new ConnectionPool(poolConfig, config);

        this.pool.on('error', function (err) {
            console.error(err);
        });
    }

    select(data) {

        return new Promise((resolve, reject) => {
            var statement;
            if (data.result == "None" || data.result == null) {
                statement = "Select * from dbo.luismodelrespuestas where intent = 'None'";
            } else {
                //data.session.message.user.id == undefined ? 0 : data.session.message.user.id
                statement = `exec bot.sp_respuestas_modelo 
                                ${0}, 
                                ${data.session.id == undefined ? 0 : data.session.id}, 
                                '${data.session.userData.id == undefined ? 0 : data.session.userData.id}',
                                '${data.session.message.text}',
                                '${data.result.intent}',
                                '${data.result.entities[0] == undefined ? "" : data.result.entities[0].type}', 
                                ${data.result.score}`;
                //statement = "exec bot.sp_respuestas_modelo 23422323423, 3453445545, '34FR567KJPP5556YU77U7UI8', 'Donde se Ubican?', 'Info basica', 'ubicacion', 99.70";
                // if (result.entities.length > 0) {
                //     statement += " and entity = '" + result.entities[0].type + "'"
                // } else {
                //     statement += " and entity is null";
                // }
                console.log(statement)
                this.pool.acquire((err, connection) => {
                    var results = [];
                    var request = new Request(statement, function (error) {
                        if (error) {
                            return reject(error);
                        }
                        connection.release();
                        resolve(results);
                    });

                    request.on("row", function (rowObject) {
                        results.push(rowObject);
                    });
                    connection.execSql(request);
                });
            }
        });
    }

    insertDialog(dialogo, callback) {

        this.pool.acquire(function (err, connection) {

            var request = new Request("INSERT INTO chatbotlog (usuario_id, conversacion, estado_animo, nombre_usuario) VALUES (@usuario_id, @conversacion, @estado_animo, @nombre_usuario)", function (err) {
                if (err) {
                    callback(err);
                }

                callback(null, 200);
            });

            request.on('doneProc', function (estate) {
                console.log(estate);
            });

            request.addParameter('usuario_id', TYPES.NVarChar, dialogo.idUsuario == "default-user" ? 0 : dialogo.idUsuario);
            request.addParameter('conversacion', TYPES.NVarChar, dialogo.conversacion);
            request.addParameter('estado_animo', TYPES.Float, dialogo.animo);
            request.addParameter('nombre_usuario', TYPES.NVarChar, dialogo.nombre_usuario);

            connection.execSql(request);

        });
    }
}