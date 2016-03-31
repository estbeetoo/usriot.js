/**
 * Created by boba on 08.03.16.
 */
var config = require('./config.js')
var USRIoT = require('../');
var connection = new USRIoT(config);
connection.connect(function (error) {
    if (error)
        return console.log('Error: %s', error);
    console.log('Connected successfully!');
    process.exit();
});