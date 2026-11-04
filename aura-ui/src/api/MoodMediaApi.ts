import api from "./api";

/** Public metadata for one private mood image; storage keys are never returned to the client. */
export interface MoodMediaAttachment {
  id: string;
  moodEntryId: number;
  fileName: string;
  contentType: string;
  byteLength: number;
  createdAt: string;
}

/** Uses the authenticated API for mood image metadata, uploads, bytes, and removal. */
export const MoodMediaApi = {
  /** Lists images attached to one mood entry. */
  async getForMood(moodEntryId: number): Promise<MoodMediaAttachment[]> {
    const response = await api.get(`Mood/${moodEntryId}/attachments`);
    return response.data;
  },

  /** Uploads one image as multipart form data. */
  async upload(moodEntryId: number, file: File): Promise<MoodMediaAttachment> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(`Mood/${moodEntryId}/attachments`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  /** Reads private image bytes through the bearer-authenticated API. */
  async getContent(moodEntryId: number, attachmentId: string): Promise<Blob> {
    const response = await api.get(`Mood/${moodEntryId}/attachments/${attachmentId}/content`, {
      responseType: "blob",
    });
    return response.data;
  },

  /** Removes an attachment belonging to the supplied mood entry. */
  async delete(moodEntryId: number, attachmentId: string): Promise<void> {
    await api.delete(`Mood/${moodEntryId}/attachments/${attachmentId}`);
  },
};
