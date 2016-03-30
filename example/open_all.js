/**
 * Created by boba on 08.03.16.
 */
var config = require('./config.js')
var WiFiIO = require('../');
var connection = new WiFiIO(config);
var assert = require('assert');
connection.connect(function () {
    console.log('Connected successfully!');
    connection.setAll(function (error, result) {
        if (error)
            return console.log('Error: %s', error);
        console.log('All opened, result:' + result);
        assert.strictEqual(result, '11111111');
        connection.disconnect();
        process.exit();
    });
});