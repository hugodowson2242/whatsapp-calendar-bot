import { docs, drive } from './auth';
import { ApiError } from '../errors';

export interface DocInfo {
  id: string;
  title: string;
  url: string;
}

export interface DocContent {
  id: string;
  title: string;
  content: string;
}

export interface SearchResult {
  id: string;
  title: string;
  url: string;
}

export async function createDoc(title: string, content?: string): Promise<DocInfo> {
  try {
    const response = await docs.documents.create({
      requestBody: { title }
    });

    const docId = response.data.documentId!;

    if (content) {
      await docs.documents.batchUpdate({
        documentId: docId,
        requestBody: {
          requests: [{
            insertText: {
              location: { index: 1 },
              text: content
            }
          }]
        }
      });
    }

    return {
      id: docId,
      title,
      url: `https://docs.google.com/document/d/${docId}/edit`
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new ApiError(`Failed to create document: ${message}`, 'CREATE_FAILED', 'docs');
  }
}

export async function readDoc(documentId: string): Promise<DocContent> {
  try {
    const response = await docs.documents.get({ documentId });
    const doc = response.data;

    let content = '';
    if (doc.body?.content) {
      for (const element of doc.body.content) {
        if (element.paragraph?.elements) {
          for (const textElement of element.paragraph.elements) {
            if (textElement.textRun?.content) {
              content += textElement.textRun.content;
            }
          }
        }
      }
    }

    return {
      id: documentId,
      title: doc.title || 'Untitled',
      content: content.trim()
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('404') || message.includes('not found')) {
      throw new ApiError(`Document not found: ${documentId}`, 'NOT_FOUND', 'docs');
    }
    throw new ApiError(`Failed to read document: ${message}`, 'READ_FAILED', 'docs');
  }
}

export async function appendToDoc(documentId: string, text: string): Promise<void> {
  try {
    const response = await docs.documents.get({ documentId });
    const doc = response.data;

    let endIndex = 1;
    if (doc.body?.content) {
      const lastElement = doc.body.content[doc.body.content.length - 1];
      if (lastElement.endIndex) {
        endIndex = lastElement.endIndex - 1;
      }
    }

    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [{
          insertText: {
            location: { index: endIndex },
            text: '\n' + text
          }
        }]
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('404') || message.includes('not found')) {
      throw new ApiError(`Document not found: ${documentId}`, 'NOT_FOUND', 'docs');
    }
    throw new ApiError(`Failed to append to document: ${message}`, 'UPDATE_FAILED', 'docs');
  }
}

export async function replaceDocContent(documentId: string, newContent: string): Promise<void> {
  try {
    const response = await docs.documents.get({ documentId });
    const doc = response.data;

    let endIndex = 1;
    if (doc.body?.content) {
      const lastElement = doc.body.content[doc.body.content.length - 1];
      if (lastElement.endIndex) {
        endIndex = lastElement.endIndex - 1;
      }
    }

    const requests: object[] = [];

    if (endIndex > 1) {
      requests.push({
        deleteContentRange: {
          range: {
            startIndex: 1,
            endIndex: endIndex
          }
        }
      });
    }

    requests.push({
      insertText: {
        location: { index: 1 },
        text: newContent
      }
    });

    await docs.documents.batchUpdate({
      documentId,
      requestBody: { requests }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('404') || message.includes('not found')) {
      throw new ApiError(`Document not found: ${documentId}`, 'NOT_FOUND', 'docs');
    }
    throw new ApiError(`Failed to replace document content: ${message}`, 'UPDATE_FAILED', 'docs');
  }
}

export async function searchDocs(query: string): Promise<SearchResult[]> {
  try {
    const response = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.document' and fullText contains '${query.replace(/'/g, "\\'")}'`,
      fields: 'files(id, name, webViewLink)',
      pageSize: 10
    });

    return (response.data.files || []).map(file => ({
      id: file.id!,
      title: file.name!,
      url: file.webViewLink!
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new ApiError(`Failed to search documents: ${message}`, 'SEARCH_FAILED', 'docs');
  }
}
