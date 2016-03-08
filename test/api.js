/**
 * Created by boba on 08.03.16.
 */
var should = require('should');
var WiFiIO = require('../');
describe('WiFiIO', function () {
    it('All appropriate methods fir API should be defined', function () {
        WiFiIO.prototype.connect.should.be.type('function');
        WiFiIO.prototype.disconnect.should.be.type('function');
        WiFiIO.prototype.preparePacketRS232.should.be.type('function');
        WiFiIO.prototype.preparePacketIP.should.be.type('function');
        WiFiIO.prototype.invertIO.should.be.type('function');
        WiFiIO.prototype.openIO.should.be.type('function');
        WiFiIO.prototype.closeIO.should.be.type('function');
        WiFiIO.prototype.closeAll.should.be.type('function');
        WiFiIO.prototype.clearAll.should.be.type('function');
        WiFiIO.prototype.openAll.should.be.type('function');
        WiFiIO.prototype.setAll.should.be.type('function');
        WiFiIO.prototype.readIO.should.be.type('function');
        WiFiIO.prototype.readAllIO.should.be.type('function');
    });
});
