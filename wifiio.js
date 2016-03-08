/**
 * Created by boba on 08.03.16.
 * Protocol description: http://www.usriot.com/download/LonHand/GPIO%20control%20protocol%20V1.8.pdf
 */
var net = require('net');
var util = require('util');
var events = require('events');

function WiFiIO(options) {
    this.host = options.host || 'localhost';
    this.port = options.port || 8899;
    this.password = options.password || 'admin';
    this.debug = options.debug || false;
    this.socket = null;
    this.passportSent = false;
}
util.inherits(WiFiIO, events.EventEmitter);

WiFiIO.prototype.toString = function () {
    return 'WiFiIO[' + this.host + ':' + this.port + ']';
}

WiFiIO.prototype.connect = function (callback) {
    this.socket = new net.connect({host: this.host, port: this.port});
    this.socket.on('data', function (data) {
        this.debug && console.log('[%s] received: ' + JSON.stringify(data) + ', string:' + data.toString('ascii'), this);
        if (this.passportSent) {
            this.passportSent = false;
            if (data.toString('ascii') === 'OK') {
                callback && callback();
                this.emit('connected');
            }
            else {
                this.disconnect();
            }
        }
    }.bind(this));
    this.socket.on('error', function (error) {
        console.log('[%s] Error: ' + JSON.stringify(error), this);
        this.disconnect();
    }.bind(this));
    this.socket.on('end', function () {
        this.debug && console.log('[%s] Socket ended', this);
        this.disconnect();
    }.bind(this));
    this.socket.on('close', function () {
        this.debug && console.log('[%s] Socket closed', this);
        this.disconnect();
    }.bind(this));
    this.socket.on('connect', function () {
        this.debug && console.log('[%s] Socket connected', this);
        this.passportSent = true;
        var helloBuf = new Buffer(this.password.length + 2);
        helloBuf.write('admin');
        helloBuf.writeUInt8(0x0D, this.password.length);
        helloBuf.writeUInt8(0x0A, this.password.length + 1);
        this.socket.write(helloBuf);
    }.bind(this));
}

WiFiIO.prototype.invertIO = function (ioNumber, callback) {
    this.socket.write(this.preparePacketRS232(0x03, parseInt(ioNumber)), callback);
}
WiFiIO.prototype.openIO = function (ioNumber, callback) {
    this.socket.write(this.preparePacketRS232(0x02, parseInt(ioNumber)), callback);
}
WiFiIO.prototype.closeIO = function (ioNumber, callback) {
    this.socket.write(this.preparePacketRS232(0x01, parseInt(ioNumber)), callback);
}
WiFiIO.prototype.clearAll = WiFiIO.prototype.closeAll = function (callback) {
    this.socket.write(this.preparePacketRS232(0x04), callback);
}
WiFiIO.prototype.setAll = WiFiIO.prototype.openAll = function (callback) {
    this.socket.write(this.preparePacketRS232(0x05), callback);
}
WiFiIO.prototype.invertAll = function (callback) {
    this.socket.write(this.preparePacketRS232(0x06), callback);
}

WiFiIO.prototype.preparePacketRS232 = function (cmd, parameter) {
    var parameterBuf = null;
    if (parameter === null || parameter === undefined) {
        parameter = 0;
        parameterBuf = new Buffer(0);
    }
    else if (typeof(parameter) !== 'number')
        throw Error('Expecting parameter of number type');
    else {
        parameterBuf = new Buffer(1);
        parameterBuf.writeUInt8(parameter, 0);
    }

    var length = parameterBuf.length + 2;
    var packet = new Buffer(7 + parameterBuf.length);
    packet.writeUInt8(0x55, 0);
    packet.writeUInt8(0xAA, 1);
    packet.writeUInt8(0x00, 2);
    packet.writeUInt8(length, 3);
    packet.writeUInt8(0x00, 4);
    packet.writeUInt8(parseInt(cmd) & 255, 5);
    for (var i = 0; i < parameterBuf.length; i++)
        packet.writeUInt8(parameterBuf[i], 6 + i);
    packet.writeUInt8(length + parseInt(cmd) + parameter, 6 + parameterBuf.length);
    this.debug && console.log('Packet[%s] prepared', JSON.stringify(packet));
    return packet;
}
WiFiIO.prototype.preparePacketIP = function (cmd, parameter) {
    if (typeof(parameter) !== 'number')
        throw Error('Expecting parameter of number type');

    var parameterBuf = new Buffer(1);
    parameterBuf.writeUInt8(parseInt(parameter), 0);

    var packet = new Buffer(1 + parameterBuf.length);
    packet.writeUInt8(parseInt(cmd) & 255, 0);

    for (var i = 0; i < parameterBuf.length; i++)
        packet.writeUInt8(parameterBuf[i], 1 + i);
    this.debug && console.log('Packet[%s] prepared', JSON.stringify(packet));
    return packet;
}

WiFiIO.prototype.disconnect = function () {
    if (this.socket) {
        this.emit('disconnected');
        this.socket.end();
        this.socket = null;
    }
    this.passportSent = false;
}


module.exports = WiFiIO;