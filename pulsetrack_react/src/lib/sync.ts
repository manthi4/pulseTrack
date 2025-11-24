import {
    getActivities,
    getSessions,
    createActivity,
    updateActivity,
    createSession,
    updateSession,
    type Activity,
    type Session
} from './db';
import {
    findSpreadsheet,
    createSpreadsheet,
    readSheet,
    writeSheet,
    clearSheet,
    getSpreadsheet,
    addSheet
} from './google';

const SPREADSHEET_NAME = 'PulseTrack Data';
const ACTIVITIES_SHEET = 'Activities';
const SESSIONS_SHEET = 'Sessions';

const ACTIVITY_HEADERS = ['sync_id', 'name', 'goal', 'goal_scale', 'color', 'created_at', 'updated_at', 'deleted_at'];
const SESSION_HEADERS = ['sync_id', 'name', 'start_time', 'end_time', 'activity_ids', 'updated_at', 'deleted_at'];

export const syncData = async () => {
    // 1. Find or Create Spreadsheet
    const file = await findSpreadsheet(SPREADSHEET_NAME);
    let spreadsheetId: string;

    if (!file) {
        const result = await createSpreadsheet(SPREADSHEET_NAME);
        spreadsheetId = result.spreadsheetId;
        // Initialize sheets with headers
        await writeSheet(spreadsheetId, `${ACTIVITIES_SHEET}!A1`, [ACTIVITY_HEADERS]);
        await writeSheet(spreadsheetId, `${SESSIONS_SHEET}!A1`, [SESSION_HEADERS]);
    } else {
        spreadsheetId = file.id;
        // Check if sheets exist
        const spreadsheet = await getSpreadsheet(spreadsheetId);
        const sheets = spreadsheet.sheets?.map((s: any) => s.properties.title) || [];

        if (!sheets.includes(ACTIVITIES_SHEET)) {
            await addSheet(spreadsheetId, ACTIVITIES_SHEET);
            await writeSheet(spreadsheetId, `${ACTIVITIES_SHEET}!A1`, [ACTIVITY_HEADERS]);
        }

        if (!sheets.includes(SESSIONS_SHEET)) {
            await addSheet(spreadsheetId, SESSIONS_SHEET);
            await writeSheet(spreadsheetId, `${SESSIONS_SHEET}!A1`, [SESSION_HEADERS]);
        }
    }

    // 2. Sync Activities
    await syncActivities(spreadsheetId);

    // 3. Sync Sessions
    await syncSessions(spreadsheetId);

    return true;
};

const syncActivities = async (spreadsheetId: string) => {
    // Get all local activities, including deleted ones
    const localActivities = await getActivities(true);
    const remoteRows = await readSheet(spreadsheetId, ACTIVITIES_SHEET);

    // Parse remote rows (skip header)
    const remoteActivities: Activity[] = [];
    if (remoteRows.length > 1) {
        const headers = remoteRows[0];
        for (let i = 1; i < remoteRows.length; i++) {
            const row = remoteRows[i];
            const activity: Partial<Activity> = {};
            headers.forEach((header: string, index: number) => {
                let value = row[index];
                // Type conversion
                if (['goal', 'created_at', 'updated_at', 'deleted_at'].includes(header)) {
                    value = value ? Number(value) : null;
                }
                (activity as any)[header] = value;
            });
            remoteActivities.push(activity as unknown as Activity);
        }
    }

    // Merge Logic
    const mergedActivities = new Map<string, Activity>();

    // Index local by sync_id
    const localMap = new Map<string, Activity>();
    localActivities.forEach(a => localMap.set(a.sync_id, a));

    // Index remote by sync_id
    const remoteMap = new Map<string, Activity>();
    remoteActivities.forEach(a => remoteMap.set(a.sync_id, a));

    const allIds = new Set([...localMap.keys(), ...remoteMap.keys()]);

    for (const id of allIds) {
        const local = localMap.get(id);
        const remote = remoteMap.get(id);

        if (local && remote) {
            // Conflict resolution
            if (local.updated_at >= remote.updated_at) {
                mergedActivities.set(id, local);
            } else {
                mergedActivities.set(id, remote);
                // Update local DB
                await updateActivity(local.id!, remote);
            }
        } else if (local) {
            // Only local -> keep it (will be pushed to remote)
            mergedActivities.set(id, local);
        } else if (remote) {
            // Only remote -> add to local
            // If it's deleted on remote and we don't have it, we can ignore it or add it as deleted.
            // Adding it as deleted ensures we have the tombstone.
            await createActivity(remote);
            mergedActivities.set(id, remote);
        }
    }

    // Write back to Sheet
    const newRows: (string | number)[][] = [ACTIVITY_HEADERS];
    mergedActivities.forEach(activity => {
        const row = ACTIVITY_HEADERS.map(header => activity[header as keyof Activity] ?? '');
        newRows.push(row as (string | number)[]);
    });

    await clearSheet(spreadsheetId, ACTIVITIES_SHEET);
    await writeSheet(spreadsheetId, `${ACTIVITIES_SHEET}!A1`, newRows);
};

const syncSessions = async (spreadsheetId: string) => {
    // Get all local sessions, including deleted ones
    const localSessions = await getSessions(true);
    const remoteRows = await readSheet(spreadsheetId, SESSIONS_SHEET);

    // Parse remote rows
    const remoteSessions: Session[] = [];
    if (remoteRows.length > 1) {
        const headers = remoteRows[0];
        for (let i = 1; i < remoteRows.length; i++) {
            const row = remoteRows[i];
            const session: Partial<Session> = {};
            headers.forEach((header: string, index: number) => {
                let value = row[index];
                // Type conversion
                if (['start_time', 'end_time', 'updated_at', 'deleted_at'].includes(header)) {
                    value = value ? Number(value) : null;
                } else if (header === 'activity_ids') {
                    // Parse JSON array or comma separated
                    try {
                        value = JSON.parse(value);
                    } catch {
                        value = [];
                    }
                }
                (session as any)[header] = value;
            });
            remoteSessions.push(session as unknown as Session);
        }
    }

    // Merge Logic
    const mergedSessions = new Map<string, Session>();

    const localMap = new Map<string, Session>();
    localSessions.forEach(s => localMap.set(s.sync_id, s));

    const remoteMap = new Map<string, Session>();
    remoteSessions.forEach(s => remoteMap.set(s.sync_id, s));

    const allIds = new Set([...localMap.keys(), ...remoteMap.keys()]);

    for (const id of allIds) {
        const local = localMap.get(id);
        const remote = remoteMap.get(id);

        if (local && remote) {
            if (local.updated_at >= remote.updated_at) {
                mergedSessions.set(id, local);
            } else {
                mergedSessions.set(id, remote);
                await updateSession(local.id!, remote);
            }
        } else if (local) {
            mergedSessions.set(id, local);
        } else if (remote) {
            await createSession(remote);
            mergedSessions.set(id, remote);
        }
    }

    // Write back to Sheet
    const newRows: (string | number)[][] = [SESSION_HEADERS];
    mergedSessions.forEach(session => {
        const row = SESSION_HEADERS.map(header => {
            if (header === 'activity_ids') {
                return JSON.stringify(session.activity_ids);
            }
            return session[header as keyof Session] ?? '';
        });
        newRows.push(row as (string | number)[]);
    });

    await clearSheet(spreadsheetId, SESSIONS_SHEET);
    await writeSheet(spreadsheetId, `${SESSIONS_SHEET}!A1`, newRows);
};
