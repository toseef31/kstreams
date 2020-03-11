// IceServersHandler.js

var IceServersHandler = (function() {
    function getIceServers(connection) {
        // resiprocate: 3344+4433
        // pions: 7575
        var iceServers = [
            // {'urls': [
            //     //'stun:pl_zD4H7uQH7knjmjBXK999m6Y221Ytd08i3rN1_olJMgD21YRzzm9vlkQTrXwr0AAAAAFzw_yFsaW5rc2hhcmU=:3d7d3ed8-838d-11e9-9a3a-7a7a3a22eac8@178.128.19.180:3478?transport=udp',
            //     'stun:stun1.l.google.com:19302',
            //     'stun:stun2.l.google.com:19302',
            //     'stun:stun.l.google.com:19302?transport=udp',
            // ]}

            // url: 'turn:178.128.19.180:3478?transport=udp',
            // credential: '3d7d3ed8-838d-11e9-9a3a-7a7a3a22eac8',
            // username: 'pl_zD4H7uQH7knjmjBXK999m6Y221Ytd08i3rN1_olJMgD21YRzzm9vlkQTrXwr0AAAAAFzw_yFsaW5rc2hhcmU='
            {
                url: 'turn:178.128.19.180:3478?transport=udp',
                credential: '3d7d3ed8-838d-11e9-9a3a-7a7a3a22eac8',
                username: 'pl_zD4H7uQH7knjmjBXK999m6Y221Ytd08i3rN1_olJMgD21YRzzm9vlkQTrXwr0AAAAAFzw_yFsaW5rc2hhcmU='
            }

        ];

        return iceServers;
    }

    return {
        getIceServers: getIceServers
    };
})();