import { saveUserActivityApi } from "../api/api";
import { getToken } from "../authConfig";
import { IPublicClientApplication } from "@azure/msal-browser";

/**
 * Logs user activity to the backend.
 * @param client - The MSAL client instance.
 * @param page - The current page path.
 * @param activityType - The type of activity (e.g., "page_visit", "button_click").
 * @param activityContent - A description of the activity.
 */
export const logUserActivity = async (
  client: IPublicClientApplication | undefined,
  page: string,
  activityType: string,
  activityContent: string
) => {
  try {
    const idToken = client ? await getToken(client) : undefined;
    const activity = {
      web_session_id: sessionStorage.getItem("web_session_id") || "", // 기본값으로 빈 문자열 사용
      page,
      activity_type: activityType,
      activity_content: activityContent,
    };

    const response = await saveUserActivityApi(activity, idToken);

    // If web_session_id is included in the response, save it to sessionStorage
    if (response.web_session_id) {
      sessionStorage.setItem("web_session_id", response.web_session_id);
    }

    // console.log("User activity logged:", response);
  } catch (error) {
    console.error("Error occurred while logging user activity:", error);
  }
};

/**
 * Sends a best-effort activity log using navigator.sendBeacon for unload scenarios.
 * This does not include an identity token; it relies on web_session_id stored in sessionStorage.
 */
export const logUserActivityBeacon = (
  page: string,
  activityType: string,
  activityContent: string
) => {
  try {
    if (typeof navigator === "undefined" || typeof window === "undefined") return false;
    const activity = {
      web_session_id: sessionStorage.getItem("web_session_id") || "",
      page,
      activity_type: activityType,
      activity_content: activityContent,
    };

    const url = "/user_activity";
    const blob = new Blob([JSON.stringify(activity)], { type: "application/json" });
    return navigator.sendBeacon(url, blob);
  } catch (e) {
    // ignore errors; best-effort only
    return false;
  }
};