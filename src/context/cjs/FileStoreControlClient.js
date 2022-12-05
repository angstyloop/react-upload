const { io } = require('socket.io-client');
const isEmptyObject = require('../isEmptyObject');

const CONFIG = require('../../config.json');

class FileStoreControlClient {
    /** FileStoreControlClient is a Socket.IO Client that communicates with
     * the FileStoreControl Socket.IO Server.
     */
    constructor(firmwareUpdateFileUrl = CONFIG.firmwareUpdateFileUrl,
                firmwareUpdateFileName = CONFIG.firmwareUpdateFileName) {

        if (!firmwareUpdateFileUrl || !firmwareUpdateFileName) {
            throw new Error(`Invalid name and/or URL for firmware update file. firmwareUpdateFileUrl="${firmwareUpdateFileUrl}", firmwareUpdateFileName=${firmwareUpdateFileName}`);
        }

        this.firmwareUpdateFileUrl = firmwareUpdateFileUrl;
        this.firmwareUpdateFileName = firmwareUpdateFileName;

        this.data = {};
        this.state = {
            progress: [],
        };
        this.sizeInBytes = {};
        this.maxSizeInBytes = {};
        this.dataHandlers = {};
        this.last = {};
        this.next = {}
        this.socket = io('http://localhost:3334');
        this.socket.on('delete', ({ fileId, fileName, code, message }) => {
            // Clean up.
            delete this.data[fileName];
            delete this.sizeInBytes[fileName];
            delete this.maxSizeInBytes[fileName];
            delete this.dataHandlers[fileName];
            delete this.last[fileName];
            delete this.next[fileName];
            //this.updateProgress();
        });

        this.socket.on('firmware-update', ({ fileId, code }) => {
            if (code) { // nonzero exit code means failure
                console.error('Firmware Update failed.\n' +
                              'Reverted to previous version.');
            } else {
                /** The server has completed the firmware update and rebooted.
                 * The socket.io client never stops polling, so when the
                 * server is back up, the connection will resume. When the
                 * server is ready it will send a 'firmware-update' event
                 * (TODO) to "unfreeze" the settings page.
                 */

                 /** Tell the parent object to update the UI.
                  */
                 this.emit('applyingFirmwareUpdate', false);
            }
        });

        // TODO use an EmitterFactory here
        this.eventHandlers = [];

        /** Received when after server has downloaded the firmware update to
         * the permanent FileStore, where it has been given a FileId @fileId.
         */
        this.socket.on('https-get', ({ fileId, fileName, code, message }) => {
            /** Tell the parent object to update the UI.
             */
            this.emit('downloadingFirmwareUpdate', false);
            this.emit('applyingFirmwareUpdate', true);

            /** Tell the server to start a firmware update using @fileId (the
             * FileId of the firmware update file we just downloaded.)
             */
            this.socket.emit('firmware-update', { fileId });
        });

        this.socket.on('upload', ({ fileId, fileName, code, message }) => {
            this.sizeInBytes[fileName] = 0;
            this.updateProgress(fileName);
            console.log(`(client) Received FileId ${fileId} from server.`);
            const _code = code || 0;
            switch (_code) {
                case 0: {
                    let done = false;
                    this.dataHandlers[`upload-${fileId}`] = () => {
                        if (this.last[fileName].data) {
                            this.sizeInBytes[fileName] += this.last[fileName].data.size;
                        }
                        this.updateProgress(fileName);
                        if (done) {
                            // Do something special when the
                            // `upload-${fileId}` event is received
                            // after the client sends the EOS event.
                            // At this point, the file is in the temp
                            // store, but not necessarily in the perm
                            // store yet.

                            // We want to remove the existing data handler...
                            this.socket.off(`upload-${fileId}`,
                                            this.dataHandlers[`upload-${fileId}`]);

                            //...and add a new one that does something
                            // with the new FileId when the file has
                            // been copied to the perm store.
                            //
                            // outside this function, the variable
                            // fileId refers to the old FileId.
                            this.dataHandlers[`upload-${fileId}`] = ({ fileId: newFileId }) => {
                                console.log(`This is where you ` +
                                            `make a call that does ` +
                                            `something with the file ` +
                                            `associated with FileId ` +
                                            `${fileId}\n`);

                                ////////////////////////////////////////
                                // MAKE THE CALL                      //
                                ////////////////////////////////////////

                                this.socket.emit('firmware-update', { fileId: newFileId });

                                ////////////////////////////////////////
                                //                                    //  
                                ////////////////////////////////////////

                                // Finally, we are done with this event,
                                // so we want to remove the data
                                // handler.
                                this.socket.off(`upload-${fileId}`,
                                                this.dataHandlers[`upload-${fileId}`]);
                            };
                            this.socket.on(`upload-${fileId}`,
                                            this.dataHandlers[`upload-${fileId}`]);
                        } else {
                            this.last[fileName] = this.next;
                            this.next = this.data[fileName].shift();
                            if (isEmptyObject(this.next)) {
                                done = true;
                            }
                            this.socket.emit(`upload-${fileId}`, this.next);
                        }
                    }

                    this.socket.on(`upload-${fileId}`,
                                    this.dataHandlers[`upload-${fileId}`]);

                    this.next = this.data[fileName].shift();

                    this.socket.emit(`upload-${fileId}`, this.next);

                    break;
                }
                default: {
                    console.error(`Error code ${code}`);
                    break;
                }
            }
        });
    }

    /** Split the data from the file into fragments and push them into the
     * array in @data for that fileName.
     */
    async processFile(file) {
        console.log(`Preparing file for transfer.`);
        const fragSize = Math.pow(2, 19);
        this.data[file.name] = [];
        this.sizeInBytes[file.name] = 0;
        this.maxSizeInBytes[file.name] = file.size;
        this.last[file.name] = { data: { size: 0 } };
        this.next[file.name] = { data: { size: 0 } };
        for (let start = 0; start < file.size; start += fragSize) {
            const end = start + fragSize;
            const fragment = file.slice(start, end);
            this.data[file.name].push({ data: fragment });
        }
        console.log(`Split file ${file.name} into ${this.data[file.name].length} fragments of ` +
                    `size ${fragSize} bytes.`);
        this.data[file.name].push({});
    }

    /** Upload all the files we've split up and cached.
     */
    upload() {
        Object.keys(this.data).forEach(fileName => {
            this.socket.emit('upload', { fileName });
        });
    };

    async onChange(e) {
      //console.log(processing selected files...);
      await this.processFiles([...e.target.files]);
      //console.log(processed selected files);
      //console.log([...e.target.files]);
    }

    async onDrop(e) {
      //console.log(processing dropped files...);
      await this.processFiles([...e.dataTransfer.files]);
      //console.log(processed dropped files);
      //console.log([...e.dataTransfer.files]);
    }

    /** Handle the event from the drop area.
     */
    async processFiles(filesArray) {
        /** process data (caching all files to be uploaded)
         */
        for (const file of filesArray) {
            await this.processFile(file);
            const expectedSize = file.size;
            let sum = 0;
            console.log(this.data[file.name]);
            for (const it of this.data[file.name].slice(0, -1)) {
                sum += it.data.size;
            }
            const actualSize = sum;
            console.log(`sizes match?`);
            console.log(expectedSize === actualSize);
            console.log(`actualSize=${actualSize}`);
            console.log(`expectedSize=${expectedSize}`);
        }

        /** data transfer
         */
        this.upload();
    };

    getState(keypath) {
        return this.states[keypath];
    }

    addState(useState) {
        /* eslint-disable */
        this.state.progress[0] = useState(0);
        this.state.progress[1] = useState(0);
        this.state.progress[2] = useState(0);
        this.state.progress[3] = useState(0);
        this.state.progress[4] = useState(0);
        /* eslint-enable */
    }

    updateProgress(fileName) {
        const index = Object.keys(this.data).findIndex(it => it === fileName);
        const numberOfDecimalPlaces = 0;
        if (index >= 0) {
            this.state.progress[index][1]((this.sizeInBytes[fileName] / this.maxSizeInBytes[fileName] * 100).toFixed(numberOfDecimalPlaces));
        }
    }

    getProgress(index) {
        return this.state.progress[index][0];
    }

    getSizeInBytes(fileName) {
        return this.sizeInBytes[fileName];
    }

    getSizeInMb(fileName) {
        const sizeInMb = (this.getSizeInBytes(fileName) / Math.pow(10, 6));
        return sizeInMb.toFixed(0) != 0
            ? sizeInMb.toFixed(0)
            : sizeInMb.toFixed(3) != 0
            ? sizeInMb.toFixed(3)
            : sizeInMb.toFixed(6) != 0
            ? sizeInMb.toFixed(6)
            : 0;
    }

    httpsGet(url, fileName) {
        this.socket.emit('https-get', { url, fileName });
    }

    deleteFile(fileName) {
        this.socket.emit('delete', { fileName });
    }

    downloadAndApplyFirmwareUpdate() {
        //this.emit('applyingFirmwareUpdate', false);
        this.emit('downloadingFirmwareUpdate', true);
        // TODO should firmwareUpdatePath be a user-modifiable setting, or
        // just a value in the config file?
        this.httpsGet(this.firmwareUpdateFileUrl, this.firmwareUpdateFileName);
    }

    // The `on` and `emit` methods let FileStoreControlClient communicate to
    // parent objects using an events API.
    // TODO use an EmitterFactory
    on(name, handlerFn) {
        if (!this.eventHandlers[name]) {
            this.eventHandlers[name] = [];
        }
        this.eventHandlers[name].push(handlerFn);
        return this;
    }
    emit(eventName, payload) {
        if (this.eventHandlers[eventName]) {
            this.eventHandlers[eventName]
                .forEach((handlerFn) => {
                    handlerFn(payload);
                });
        } else {
            console.warn(`(FileStoreControlClient#emit) No event named ${eventName}.`);
        }
        return this;
    }
}

module.exports = FileStoreControlClient;

async function test_FileStoreControlClient () {
    for (const syncTest of [
        () => {
            let pass = false;
            let err = '';
            let client = null;
            try {
                client = new FileStoreControlClient();
                pass = true;
            } catch (e) {
                err = e;
            }
            console.log([0], pass ? 'PASS' : 'FAIL', 'It runs.');
            if (!pass) {
                console.log(err);
            }
            if (client && client.socket) {
                client.socket.close();
            }
        },
        () => {},
    ]) {
        syncTest();
    }
    for (const asyncTest of [
        async () => {},
        async () => {},
    ]) {
        await asyncTest();
    }
}

//test_FileStoreControlClient();
