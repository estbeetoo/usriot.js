/**
 * Created by boba on 08.03.16.
 */
var config = require('./config.js')
var WiFiIO = require('../');
var connection = new WiFiIO(config);
connection.connect(function (error) {
    if (error)
        return console.log('Error connecting: %s', error);
    connection.invertAll(function (error, status) {
        if (error)
            return console.log('Error inverting: %s', error);
        console.log('Invert done! Result: ' + status);
        connection.disconnect();
        process.exit();
    });
});