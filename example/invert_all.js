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
    connection.clearAll(function (error, result) {
        if (error)
            return console.log('Error: %s', error);
        console.log('All closed, result:' + result);
        assert.strictEqual(result, '00000000');
        connection.invertAll(function (error, invert_result) {
            if (error)
                return console.log('Error inverting: %s', error);
            console.log('Invert done! Result: ' + invert_result);
            if (invert_result === '11111111') {
                connection.disconnect();
                process.exit();
                return;
            }
            connection.once('intput.all', function (data) {
                assert.strictEqual(invert_result, '11111111');
                connection.disconnect();
                process.exit();
            });
        });
    });
});