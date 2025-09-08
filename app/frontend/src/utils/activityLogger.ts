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

    console.log("User activity logged:", response);
  } catch (error) {
    console.error("Error occurred while logging user activity:", error);
  }
};