import { Button, Box, Card, CardContent, Typography } from '@mui/material';
import './HttpsGet.css';

export default function HttpsGet({ client, url, fileName, className }) {
    const onClick = () => {
        client.downloadAndApplyFirmwareUpdate();
    }
    return (
        <Card
            className={`HttpsGet-root ${className || ''}`}
        >
            <Typography className="HttpsGet-header">HTTPS GET</Typography>
            <CardContent>
                <Box
                    className="HttpsGet-button-container"
                >
                    <Button
                        variant="contained"
                        className="https-get-button"
                        onClick={onClick}
                    >
                        Get Latest
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
}
