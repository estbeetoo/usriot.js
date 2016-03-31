/**
 * Created by boba on 08.03.16.
 */
var config = require('./config.js')
var USRIoT = require('../');
var connection = new USRIoT(config);
var should = require('should');
connection.connect(function(error) {
  if (error)
    return console.log('Error connecting: ' + error);
  console.log('Connected successfully!');
  connection.readDeviceInfo(function(error, value) {
    if (error)
      throw new Error('Cannot read device info, cause: ' + error);
    console.log('Device info: %s', JSON.stringify(value));
    should.exist(value.functions.webpage_configurated);
    should.exist(value.functions.resource_number_configurable);
    should.exist(value.functions.wifi);
    should.exist(value.functions.wired);
    should.exist(value.functions.gprs);
    should.exist(value.functions.smartlink);
    should.exist(value.functions.timing_task);
    should.exist(value.functions.webpage_configurated);
    should.exist(value.model);
    should.exist(value.hardware_version);
    should.exist(value.software_version);
    connection.disconnect();
    process.exit();
  });
});