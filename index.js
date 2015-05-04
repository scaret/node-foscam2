var dgram = require('dgram');

module.exports.search = function (cb)
{
    var text = "\0\0\0\1"; // Search Req

    var msg  = "MO_I"                 ; // TCP HEADER
        msg += "\0\0"                 ; // Operation Code
        msg += "\0"                   ; // Reserve Int8
        msg += "\0\0\0\0\0\0\0\0"     ; // Reserve Binary String
        msg += String.fromCharCode(text.length) + "\0\0\0"; // text length workaround < 256
        msg += "\0\0\0\0"             ; // Reserve Int32
        msg += text                   ;

    var buf  = new Buffer(msg);

    var socket = dgram.createSocket('udp4');
    

    socket.on('error', function(err){
        cb(err);
    });
    socket.on('message', function (buf, rinfo){
        if (buf.toString('utf8', 0, 4) == "MO_I")
        {
            var info     = {};
            var textlen  = buf.readUInt32LE(15);
            var body     = buf.slice(23, 23 + textlen);

            info.cameraId           = body.toString('utf8', 0 , 13).split("\0")[0];
            info.cameraName         = body.toString('utf8', 13, 34).split("\0")[0];
            info.ip                 = [body.readUInt8(34), body.readUInt8(35), body.readUInt8(36), body.readUInt8(37)];
            info.mask               = [body.readUInt8(38), body.readUInt8(39), body.readUInt8(40), body.readUInt8(41)];
            info.gatewayIp          = [body.readUInt8(42), body.readUInt8(43), body.readUInt8(44), body.readUInt8(45)];
            info.dns                = [body.readUInt8(46), body.readUInt8(47), body.readUInt8(48), body.readUInt8(49)];
            info.sysSoftwareVersion = [body.readUInt8(54), body.readUInt8(55), body.readUInt8(56), body.readUInt8(57)];
            info.appSoftwareVersion = [body.readUInt8(58), body.readUInt8(59), body.readUInt8(60), body.readUInt8(61)];
            info.cameraPort         = body.readUInt16BE(62);
            info.dhcpEnabled        = body.readUInt8(64);
            
            info.rinfo = rinfo;
            cb(null, info);
        }
        else
        {
            // invalid packet
        }
    });
    
    socket.bind(null, function (){
        socket.setBroadcast(true);
        socket.send(buf, 0, buf.length, 10000, "255.255.255.255");
    });
    return socket;
};
