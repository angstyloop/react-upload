import { Card, CardContent } from '@mui/material';
import Upload from './Upload';
import HttpsGet from './HttpsGet';
import './App.css';

export default function App({ client }) {
    return(
        <Card>
            <CardContent>
                <Upload client={client} />
                <HttpsGet
                    client={client}
                    url="https://localhost:3335"
                    fileName="mender_update_file"
                />
            </CardContent>
        </Card>
    );
}
