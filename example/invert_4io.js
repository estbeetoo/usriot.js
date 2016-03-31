/**
 * Created by boba on 08.03.16.
 */
var config = require('./config.js')
var USRIoT = require('../');
var connection = new USRIoT(config);
var assert = require('assert');
connection.connect(function (error) {
    if (error)
        return console.log('Error connecting: %s', error);
    connection.closeIO(4, function (error, status) {
        if (error)
            return console.log('Error inverting: %s', error);
        console.log('Success, current status: ' + status);
        assert.strictEqual(status, 0);
        connection.invertIO(4, function (error, status) {
            if (error)
                return console.log('Error inverting: %s', error);
            console.log('Success, current status: ' + status);
            assert.strictEqual(status, 1);
            connection.disconnect();
            process.exit();
        });
    });
});