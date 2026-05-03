const RemoteLinuxDeviceBase = require('./remoteLinuxBase');

class RemoteLinuxRkDevice extends RemoteLinuxDeviceBase {
    get DEVICE_ID () {
        return 'remoteLinuxRk';
    }
}

module.exports = RemoteLinuxRkDevice;
