/**
 * Created by boba on 08.03.16.
 */
var config = require('./config.js')
var WiFiIO = require('../');
var connection = new WiFiIO(config);
var assert = require('assert');

function openIO(num) {
    return new Promise(function (resolve, reject) {
        connection.openIO(num, function (error, response) {
            if (error)
                return reject(error);
            resolve(response);
        });
    });
}
function closeIO(num) {
    return new Promise(function (resolve, reject) {
        connection.closeIO(num, function (error, response) {
            if (error)
                return reject(error);
            resolve(response);
        });
    });
}

function tryFunc(callback) {

    connection.connect(function (error) {
        if (error)
            return console.log('Error connecting: %s', error);
        console.log('Connected successfully!');

        function err(error) {
            console.log('Error occured: %s', error);
        }

        connection.clearAll(function (error, result) {
            if (error)
                return console.log('Error: %s', error);
            assert.strictEqual(result, '00000000');
            openIO(3).
            then(function (response3) {
                assert.strictEqual(response3, 1);
                openIO(4).then(function (response4) {
                    assert.strictEqual(response4, 1);
                }, err);
            }, err).
            then(function () {
                openIO(5).
                then(function (response) {
                    assert.strictEqual(response, 1);
                }, err).then(function () {
                    openIO(6).then(function (response) {
                        assert.strictEqual(response, 1);
                        closeIO(3).then(function (response) {
                            assert.strictEqual(response, 0);
                        });
                        closeIO(4).then(function (response) {
                            assert.strictEqual(response, 0);
                        });
                        closeIO(5).then(function (response) {
                            assert.strictEqual(response, 0);
                        });
                        closeIO(6).then(function (response) {
                            assert.strictEqual(response, 0);
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
                                    callback();
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

tryFunc(function(){
    tryFunc();
});