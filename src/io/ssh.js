const Buffer = require('buffer').Buffer;
const JSONRPC = require('../util/jsonrpc');

class SSH extends JSONRPC {
    constructor (runtime, deviceId, target, connectCallback = null, resetCallback = null) {
        super();

        this._socket = runtime.getScratchLinkSocket('SSH');
        this._socket.setOnOpen(this.requestConnect.bind(this));
        this._socket.setOnClose(this.handleDisconnectError.bind(this));
        this._socket.setOnError(this._handleRequestError.bind(this));
        this._socket.setHandleMessage(this._handleMessage.bind(this));

        this._sendMessage = this._socket.sendMessage.bind(this._socket);

        this._connectCallback = connectCallback;
        this._connected = false;
        this._resetCallback = resetCallback;
        this._deviceId = deviceId;
        this._target = target;
        this._runtime = runtime;

        this._socket.open();
    }

    requestConnect () {
        return this.sendRemoteRequest('connect', this._target)
            .then(() => {
                this._connected = true;
                this._runtime.emit(this._runtime.constructor.PERIPHERAL_CONNECTED);
                if (this._connectCallback) this._connectCallback();
            })
            .catch(e => {
                this._handleRequestError(e);
            });
    }

    disconnect () {
        if (this._connected) {
            this._connected = false;
        }

        if (this._socket && this._socket.isOpen()) {
            this._socket.close();
        }

        this._runtime.emit(this._runtime.constructor.PERIPHERAL_DISCONNECTED);
    }

    isConnected () {
        return this._connected;
    }

    write (message, encoding = null) {
        const params = {message};
        if (encoding) params.encoding = encoding;
        return this.sendRemoteRequest('write', params)
            .catch(e => {
                this.handleDisconnectError(e);
            });
    }

    upload (message, config, encoding = null) {
        config.library = this._runtime.getCurrentDeviceExtensionLibrary();
        const params = {message, config};
        if (encoding) params.encoding = encoding;
        return this.sendRemoteRequest('upload', params)
            .catch(e => {
                this.handleDisconnectError(e);
            });
    }

    abortUpload () {
        return this.sendRemoteRequest('abortUpload')
            .catch(e => {
                this.handleDisconnectError(e);
            });
    }

    didReceiveCall (method, params) {
        switch (method) {
        case 'connectError':
            this._runtime.emit(this._runtime.constructor.PERIPHERAL_REQUEST_ERROR, {
                message: params.message
            });
            break;
        case 'peripheralUnplug':
            this.handleDisconnectError();
            break;
        case 'uploadStdout':
            this._runtime.emit(this._runtime.constructor.PERIPHERAL_UPLOAD_STDOUT, {
                message: params.message
            });
            break;
        case 'setUploadAbortEnabled':
            this._runtime.emit(this._runtime.constructor.PERIPHERAL_SET_UPLOAD_ABORT_ENABLED, params);
            break;
        case 'uploadError':
            this._runtime.emit(this._runtime.constructor.PERIPHERAL_UPLOAD_ERROR, {
                message: params.message
            });
            break;
        case 'uploadSuccess':
            this._runtime.emit(
                this._runtime.constructor.PERIPHERAL_UPLOAD_SUCCESS,
                params ? params.aborted : false
            );
            break;
        case 'onMessage':
            this._runtime.emit(
                this._runtime.constructor.PERIPHERAL_RECIVE_DATA,
                Buffer.from(params.message, 'base64')
            );
            break;
        }
    }

    handleDisconnectError () {
        if (!this._connected) return;

        this.disconnect();

        if (this._resetCallback) {
            this._resetCallback();
        }
    }

    _handleRequestError (e) {
        this._runtime.emit(this._runtime.constructor.PERIPHERAL_REQUEST_ERROR, {
            message: e && e.message ? e.message : e
        });
    }
}

module.exports = SSH;
