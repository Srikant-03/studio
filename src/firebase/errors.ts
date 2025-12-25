// A custom error class for Firestore permission errors.
// This allows us to capture more context about the error.

export type SecurityRuleContext = {
    path: string;
    operation: 'get' | 'list' | 'create' | 'update' | 'delete';
    requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
    public context: SecurityRuleContext;
    
    constructor(context: SecurityRuleContext) {
        const message = `FirestoreError: Missing or insufficient permissions.`;
        super(message);
        this.name = 'FirestorePermissionError';
        this.context = context;
        
        // This is for environments like Node.js.
        if (typeof (Error as any).captureStackTrace === 'function') {
            (Error as any).captureStackTrace(this, this.constructor);
        } else {
            this.stack = (new Error(message)).stack;
        }
    }
}
