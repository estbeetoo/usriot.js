/**
 * Created by boba on 08.03.16.
 */
var config = require('./config.js')
var WiFiIO = require('../');
var connection = new WiFiIO(config);

function openIO(num) {
    return new Promise(function (resolve, reject) {
        connection.openIO(num, resolve);
    });
}
function closeIO(num) {
    return new Promise(function (resolve, reject) {
        connection.closeIO(num, resolve);
    });
}

connection.connect(function (error) {
    if (error)
        return console.log('Error connecting: %s', error);
    console.log('Connected successfully!');

    function err(error) {
        console.log('Error occured: %s', error);
    }

    openIO(3).
    then(function () {
        openIO(4);
    }, err).
    then(function () {
        openIO(5).
        then(function () {
            openIO(6);
        }, err);
    }).
    then(function () {
        closeIO(3);
        closeIO(4);
        closeIO(5);
        closeIO(6);
    }, err);
});