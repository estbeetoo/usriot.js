/**
 * Created by boba on 08.03.16.
 */
var config = require('./config.js')
var WiFiIO = require('../');
var connection = new WiFiIO({host: config.host, port: config.port});
connection.connect(function (error) {
    if (error)
        return console.log('Error: %s', error);
    console.log('Connected successfully!');
    process.exit();
});