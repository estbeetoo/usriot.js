/**
 * Created by boba on 08.03.16.
 */
var config = require('./config.js')
var USRIoT = require('../');
var assert = require('assert');
var connection = new USRIoT({host: config.host, port: config.port});
connection.connect(function () {
    console.log('Connected successfully!');
    connection.clearAll(function (error, result) {
        if (error)
            return console.log('Error: %s', error);
        console.log('All closed, result:' + result);
        assert.strictEqual(result, '00000000');
        connection.disconnect();
        process.exit();
    });
});