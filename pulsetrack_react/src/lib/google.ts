const CLIENT_ID = '944342285512-h6po4driasniqfk8svnnohvbop5pjkjp.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

export const initGoogle = async () => {
    return new Promise<void>((resolve) => {
        const checkInit = () => {
            if (gapiInited && gisInited) resolve();
        };

        // Load GAPI
        const gapiScript = document.createElement('script');
        gapiScript.src = 'https://apis.google.com/js/api.js';
        gapiScript.onload = () => {
            gapi.load('client', async () => {
                await gapi.client.init({
                    // apiKey: API_KEY, // Not needed for this flow if using access token directly, but usually good for quota. 
                    // For now we rely on access token from GIS.
                    discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4', 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
                });
                gapiInited = true;
                checkInit();
            });
        };
        document.body.appendChild(gapiScript);

        // Load GIS
        const gisScript = document.createElement('script');
        gisScript.src = 'https://accounts.google.com/gsi/client';
        gisScript.onload = () => {
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: '', // defined at request time
            });
            gisInited = true;
            checkInit();
        };
        document.body.appendChild(gisScript);
    });
};

export const signIn = (): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!tokenClient) {
            reject(new Error('Google Identity Services not initialized'));
            return;
        }

        tokenClient.callback = async (resp: any) => {
            if (resp.error !== undefined) {
                reject(resp);
            }
            resolve(resp.access_token);
        };

        if (gapi.client.getToken() === null) {
            // Prompt the user to select a Google Account and ask for consent to share their data
            // when establishing a new session.
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            // Skip display of account chooser and consent dialog for an existing session.
            tokenClient.requestAccessToken({ prompt: '' });
        }
    });
};

export const signOut = () => {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken(null);
    }
};

export const findSpreadsheet = async (name: string) => {
    const response = await gapi.client.drive.files.list({
        q: `name = '${name}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`,
        fields: 'files(id, name)',
    });
    return response.result.files?.[0];
};

export const createSpreadsheet = async (name: string) => {
    const response = await gapi.client.sheets.spreadsheets.create({
        properties: {
            title: name,
        },
    });
    return response.result;
};

export const readSheet = async (spreadsheetId: string, range: string) => {
    try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });
        return response.result.values || [];
    } catch (e) {
        console.error('Error reading sheet', e);
        return [];
    }
};

export const writeSheet = async (spreadsheetId: string, range: string, values: any[][]) => {
    await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values,
        },
    });
};

export const clearSheet = async (spreadsheetId: string, range: string) => {
    await gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId,
        range
    });
};

export const getSpreadsheet = async (spreadsheetId: string) => {
    const response = await gapi.client.sheets.spreadsheets.get({
        spreadsheetId,
    });
    return response.result;
};

export const addSheet = async (spreadsheetId: string, title: string) => {
    await gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
            requests: [
                {
                    addSheet: {
                        properties: {
                            title,
                        },
                    },
                },
            ],
        },
    });
};
