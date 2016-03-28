/**
 * Created by boba on 08.03.16.
 */
var config = require('./config.js')
var WiFiIO = require('../');
var connection = new WiFiIO({host: config.host, port: config.port});
connection.connect(function (error) {
    if (error)
        return console.log('Error connecting: %s', error);
    connection.invertIO(4, function (error) {
        if (error)
            return console.log('Error inverting: %s', error);
        connection.disconnect();
        process.exit();
    });

});