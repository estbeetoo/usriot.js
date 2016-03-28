/**
 * Created by boba on 08.03.16.
 */
var config = require('./config.js')
var WiFiIO = require('../');
var connection = new WiFiIO(config);
connection.connect(function(error) {
  if (error)
    return console.log('Error connecting: ' + error);
  console.log('Connected successfully!');
  connection.readDeviceInfo(function(error, value) {
    if (error)
      throw new Error('Cannot read device info, cause: ' + error);
    console.log('Device info: %s', JSON.stringify(value));
    connection.disconnect();
    process.exit();
  });
});