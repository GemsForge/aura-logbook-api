import api from "@/api/api";

export type PathwayKey = "mindfulness" | "energy" | "faith";
export type InsightFeedbackValue = "resonates" | "maybe" | "not-for-me";

/** Typed activity content supported by the pathway-activity API. */
export type PathwayActivityContent =
  | { practice: string; durationMinutes?: number; note?: string }
  | { practices: Record<string, boolean>; note?: string }
  | { insightType: string; response: InsightFeedbackValue };

/** Private user activity returned by the pathway-activity API. */
export interface PathwayActivity {
  id: number;
  userId: number;
  pathway: PathwayKey;
  moduleKey: string;
  activityType: string;
  occurredOn: string;
  content: PathwayActivityContent;
  createdAt: string;
  updatedAt: string;
}

/** Typed request envelope shared by compatible pathway activity modules. */
export interface PathwayActivityRequest {
  pathway: PathwayKey;
  moduleKey: string;
  activityType: string;
  occurredOn: string;
  content: PathwayActivityContent;
}

const pathwayActivityPath = "pathway-activities";

/** Formats today's local date without a UTC conversion that could shift the user's day. */
export function localActivityDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Lists only the authenticated user's activities, optionally filtered to one module lifecycle. */
async function getMine(filters: { pathway?: PathwayKey; moduleKey?: string; activityType?: string } = {}) {
  const response = await api.get<PathwayActivity[]>(pathwayActivityPath, { params: filters });
  return response.data;
}

/** Creates one explicitly saved private activity. */
async function create(request: PathwayActivityRequest) {
  const response = await api.post<PathwayActivity>(pathwayActivityPath, request);
  return response.data;
}

/** Replaces one private activity owned by the signed-in user. */
async function update(id: number, request: PathwayActivityRequest) {
  await api.put(`${pathwayActivityPath}/${id}`, request);
}

/** Deletes one private activity owned by the signed-in user. */
async function remove(id: number) {
  await api.delete(`${pathwayActivityPath}/${id}`);
}

export const PathwayActivityApi = { getMine, create, update, remove };
