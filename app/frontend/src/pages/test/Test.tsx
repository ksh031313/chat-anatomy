import React, { useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { useLogin } from "../../authConfig";
import { logUserActivity } from "../../utils/activityLogger";

const Test = () => {
  const client = useLogin ? useMsal().instance : undefined;

  // 화면 접속 시 로그 저장
  useEffect(() => {
    logUserActivity(client, "/test", "page_visit", "User visited the Test page");
  }, []);

  // 버튼 클릭 시 로그 저장
  const handleButtonClick = () => {
    logUserActivity(client, "/test", "button_click", "User clicked the Test button");
  };

  return (
    <div>
      <h1>Test Page</h1>
      <button onClick={handleButtonClick}>Log Activity</button>
    </div>
  );
};

export default Test;