/**
 * Created by boba on 08.03.16.
 */
var config = require('./config.js')
var WiFiIO = require('../');
var connection = new WiFiIO(config);
var assert = require('assert');
connection.connect(function (error) {
    if (error)
        return console.log('Error connecting: %s', error);
    connection.openIO(4, function (error, status) {
        if (error)
            return console.log('Error inverting: %s', error);
        console.log('Success, current status: ' + status);
        assert.strictEqual(status, 1);
        connection.disconnect();
        process.exit();
    });

});