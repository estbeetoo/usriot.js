/**
 * Created by boba on 08.03.16.
 */
var config = require('./config.js')
var USRIoT = require('../');
var connection = new USRIoT(config);
connection.connect(function () {
    console.log('Connected successfully!');
    connection.readAllIO(function (value, error) {
        if (error)
            throw new Error('Cannot read IO status, cause: ' + error);
        console.log('Status[%s] red', value);
        connection.on('input.all', function (value) {
            console.log('Status[%s] red', value);
        });
    });
});