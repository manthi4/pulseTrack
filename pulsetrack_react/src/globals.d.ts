export { };

declare global {
    interface Window {
        gapi: any;
        google: any;
    }
    const gapi: any;
    const google: any;
}
