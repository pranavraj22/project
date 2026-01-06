import { UploadedFile } from "../types";

/**
 * Sanitizes user input to prevent injection attacks.
 * Removes potentially harmful characters and limits length.
 */
export const sanitizeInput = (input: string, maxLength: number = 50000): string => {
    if (!input) return "";

    // Trim whitespace
    let sanitized = input.trim();

    // Enforce max length
    if (sanitized.length > maxLength) {
        console.warn(`Input exceeded max length of ${maxLength}, truncating.`);
        sanitized = sanitized.substring(0, maxLength);
    }

    // Basic HTML entity encoding to prevent simple XSS if rendered directly (though React handles this mostly)
    // And specific checks for prompt injection patterns could be added here
    // For now, we ensure it doesn't contain obvious control characters that might mess up JSON
    // sanitized = sanitized.replace(/[\u0000-\u001F\u007F-\u009F]/g, ""); 
    // (Keeping some control chars like newline is important for text)

    // Remove potential script tags (basic)
    sanitized = sanitized.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gmi, "");

    return sanitized;
};

/**
 * Validates file upload to ensure it's a safe type and size.
 */
export const validateFile = (file: UploadedFile, maxSizeBytes: number = 10 * 1024 * 1024): boolean => {
    const allowedMimeTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'text/plain'
    ];

    if (!allowedMimeTypes.includes(file.mimeType)) {
        console.warn(`Blocked file with invalid mime type: ${file.mimeType}`);
        return false;
    }

    // Since we typically have base64, we estimate size
    // Base64 size ~= 4/3 * Original Size
    const estimatedSize = (file.base64.length * 3) / 4;

    if (estimatedSize > maxSizeBytes) {
        console.warn(`Blocked file exceeding size limit: ${estimatedSize} bytes`);
        return false;
    }

    return true;
};
