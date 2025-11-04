// IMPORTANT: This backend API requires the following dependencies:
// npm install googleapis google-auth-library formidable-serverless
// npm install --save-dev @types/formidable-serverless
//
// You must also set the following environment variables in your Vercel project:
// GOOGLE_SERVICE_ACCOUNT_EMAIL: The email of your Google service account.
// GOOGLE_PRIVATE_KEY: The private key for your service account.
// GOOGLE_DRIVE_FOLDER_ID: The ID of the Google Drive folder you want the app to use.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import formidable from 'formidable-serverless';
import fs from 'fs';
import { Stream } from 'stream';

// --- Google Drive API Client Setup ---

const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

if (!serviceAccountEmail || !privateKey || !rootFolderId) {
  throw new Error('Google Drive environment variables are not properly configured.');
}

const auth = new JWT({
  email: serviceAccountEmail,
  key: privateKey,
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

// Helper to map Drive API file format to our app's UploadedFile type
const mapDriveFileToUploadedFile = (file: any): any => ({
    id: file.id,
    name: file.name,
    size: file.size ? parseInt(file.size, 10) : 0,
    type: file.mimeType,
    uploadDate: file.createdTime,
    url: file.webViewLink,
    isFolder: file.mimeType === 'application/vnd.google-apps.folder',
    // Check for our custom link properties
    isLink: file.appProperties?.isLink === 'true',
    // If it's a link, override the URL with the one from appProperties
    ...(file.appProperties?.isLink === 'true' && { url: file.appProperties.url }),
    parentId: file.parents ? file.parents[0] : null,
});

// --- Vercel Serverless Function Configuration ---

export const config = {
  api: {
    bodyParser: false, // Disable default body parser to handle file uploads
  },
};

// --- API Request Handler ---

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      case 'PATCH':
        return await handlePatch(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'PATCH']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'An internal server error occurred.' });
  }
}

// --- Method Implementations ---

async function handleGet(req: VercelRequest, res: VercelResponse) {
  const { parentId } = req.query;
  const folderId = parentId === 'root' || !parentId ? rootFolderId : parentId as string;
  
  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, size, createdTime, webViewLink, parents, appProperties)',
    pageSize: 100,
  });

  const files = response.data.files?.map(mapDriveFileToUploadedFile) || [];
  return res.status(200).json(files);
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
    const contentType = req.headers['content-type'] || '';

    if (contentType.includes('multipart/form-data')) {
        // Handle File Upload
        const form = new formidable.IncomingForm();
        const { fields, files } = await new Promise<{ fields: formidable.Fields, files: formidable.Files }>((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) return reject(err);
                resolve({ fields, files });
            });
        });

        const uploadedFile = files.file as formidable.File;
        const parentId = fields.parentId === 'root' || !fields.parentId ? rootFolderId : fields.parentId as string;

        const fileMetadata = {
            name: uploadedFile.name || 'Untitled',
            parents: [parentId],
        };
        const media = {
            mimeType: uploadedFile.type || 'application/octet-stream',
            body: fs.createReadStream(uploadedFile.path),
        };

        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, name, mimeType, size, createdTime, webViewLink, parents, appProperties',
        });
        
        fs.unlinkSync(uploadedFile.path); // Clean up temp file
        return res.status(201).json(mapDriveFileToUploadedFile(response.data));

    } else if (contentType.includes('application/json')) {
        // Handle Folder or Link Creation
        const { type, name, url, parentId } = req.body;
        const folderId = parentId === 'root' || !parentId ? rootFolderId : parentId;

        if (type === 'folder') {
            const fileMetadata = {
                name,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [folderId],
            };
            const response = await drive.files.create({
                requestBody: fileMetadata,
                fields: 'id, name, mimeType, size, createdTime, webViewLink, parents, appProperties',
            });
            return res.status(201).json(mapDriveFileToUploadedFile(response.data));
        } else if (type === 'link') {
            const fileMetadata = {
                name,
                mimeType: 'application/vnd.google-apps.shortcut',
                parents: [folderId],
                shortcutDetails: {
                  targetMimeType: 'text/plain', // not really used, but required
                  targetId: url // abusing this field to store the URL. A better way for real apps might be a file with content or appProperties. Let's use appProperties.
                },
                appProperties: {
                    isLink: 'true',
                    url,
                }
            };
            const response = await drive.files.create({
                requestBody: fileMetadata,
                fields: 'id, name, mimeType, size, createdTime, webViewLink, parents, appProperties',
            });
            return res.status(201).json(mapDriveFileToUploadedFile(response.data));
        }
    }
    
    return res.status(400).json({ error: 'Invalid request body or content type.' });
}

async function handleDelete(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'File ID is required.' });
  }
  await drive.files.delete({ fileId: id });
  return res.status(200).json({ message: 'File deleted successfully.' });
}

async function handlePatch(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  const { name } = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'File ID is required.' });
  }
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'New name is required.' });
  }

  const response = await drive.files.update({
    fileId: id,
    requestBody: { name },
    fields: 'id, name, mimeType, size, createdTime, webViewLink, parents, appProperties',
  });
  
  return res.status(200).json(mapDriveFileToUploadedFile(response.data));
}