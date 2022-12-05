import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import FileStoreControlClient from './context/cjs/FileStoreControlClient';

const client = new FileStoreControlClient()

    .on('downloadingFirmwareUpdate',
        it => console.log(`downloadingFirmwareUpdate=${it}`))

    .on('applyingFirmwareUpdate',
        it => console.log(`applyingFirmwareUpdate=${it}`));

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App client={client} />
  </React.StrictMode>
);
