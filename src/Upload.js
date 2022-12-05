import { Button, Box, Card, CardContent, CircularProgress, Typography } from '@mui/material';
import { useState } from 'react';
import { CheckCircleOutline } from "@mui/icons-material";
import './Upload.css';

export default function Upload({ client }) {
    client.addState(useState);
    const onDragOver = (e) => {
        e.preventDefault();
        e.target.classList.add('dragover');
    };
    const onDragEnter = (e) => {
        e.preventDefault();
        e.target.classList.add('dragover');
    };
    const onDragLeave = (e) => {
        e.preventDefault();
        e.target.classList.remove('dragover');
    };
    const onDrop = async (e) => {
        e.preventDefault();
        e.target.classList.remove('dragover');
        await client.onDrop(e);
    };
    const onChange = async (e) => {
      await client.onChange(e);
    }
    return (
        <Card
            className={`Upload-root`}
            onDragOver={onDragOver}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            <Typography className="upload-header">UPLOAD</Typography>
            <CardContent>
                <Box
                    className="item-header-container"
                >
                    <Typography
                        className="item-header label"
                    >
                        File Name
                    </Typography>
                    <Typography
                        className="item-header bytes"
                    >
                        Bytes
                    </Typography>
                    <Typography
                        className="item-header mb"
                    >
                        MB
                    </Typography>
                    <Typography
                        className="item-header uploaded"
                    >
                        Uploaded
                    </Typography>
                    <Typography
                        className="item-header actions"
                    >
                        Actions
                    </Typography>
                </Box>
                {[Object.keys(client.data).map((fileName, index) => {
                    const progress = client.getProgress(index);
                    return (
                        <Box
                            className="progress-container"
                            key={`${fileName}-${index}-box`}
                        >
                            <Typography
                                key={`${fileName}-${index}-label`}
                                className="progress-label"
                            >
                                {fileName}
                            </Typography>

                            <Typography
                                key={`${fileName}-${index}-bytes`}
                                className="progress-bytes"
                            >
                                {client.getSizeInBytes(fileName)}
                            </Typography>

                            <Typography
                                key={`${fileName}-${index}-mb`}
                                className="progress-mb"
                            >
                                {client.getSizeInMb(fileName)}
                            </Typography>

                            {progress != 100 ? (
                                <>
                                    <Box className="progress-percentage-container">
                                        <CircularProgress
                                            className="progress-circular"
                                            variant="determinate"
                                            value={
                                                isNaN(parseInt(progress))
                                                    ? 0
                                                    : progress
                                            }
                                        />
                                        <Typography className="progress-percentage">
                                            {progress}%
                                        </Typography>
                                    </Box>
                                    <Button
                                        disabled
                                        variant="contained"
                                        className="delete-button"
                                        onClick={() => client.deleteFile(fileName)}
                                    >
                                       Delete 
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Box className="progress-percentage-container">
                                        <CheckCircleOutline
                                            className="progress-percentage"
                                            style={
                                                {
                                                    fontSize: 32,
                                                    color: 'green',
                                                }
                                            }
                                        />
                                    </Box>
                                    <Button
                                        variant="contained"
                                        className="delete-button"
                                        onClick={() => client.deleteFile(fileName)}
                                    >
                                       Delete 
                                    </Button>
                                </>
                            )}
                        </Box>
                    );
                })]}
                <Box
                    className="upload-button-container"
                >
                    <Button
                        variant="contained"
                        component="label"
                        className="upload-button"
                    >
                        Upload File
                        <input
                            onChange={onChange}
                            type="file"
                            hidden
                            multiple
                        />
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
}
