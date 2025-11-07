import { AccountInfo, EventType, PublicClientApplication } from "@azure/msal-browser";
import { checkLoggedIn, msalConfig, useLogin } from "./authConfig";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MsalProvider } from "@azure/msal-react";
import { LoginContext } from "./loginContext";
import Layout from "./pages/layout/Layout";
import { logUserActivity } from "./utils/activityLogger";

const LayoutWrapper = () => {
    const [loggedIn, setLoggedIn] = useState(false);
    const navigate = useNavigate();
    if (useLogin) {
        var msalInstance = new PublicClientApplication(msalConfig);

        // Default to using the first account if no account is active on page load
        if (!msalInstance.getActiveAccount() && msalInstance.getAllAccounts().length > 0) {
            // Account selection logic is app dependent. Adjust as needed for different use cases.
            msalInstance.setActiveAccount(msalInstance.getActiveAccount());
        }

        // Listen for sign-in event and set active account
        msalInstance.addEventCallback(event => {
            if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
                const account = event.payload as AccountInfo;
                msalInstance.setActiveAccount(account);
            }
        });

        useEffect(() => {
            const fetchLoggedIn = async () => {
                setLoggedIn(await checkLoggedIn(msalInstance));
            };

            fetchLoggedIn();
        }, []);

        // When user first becomes logged in during this session, record a login activity.
        useEffect(() => {
            if (!loggedIn) return;
            try {
                const alreadyRecorded = sessionStorage.getItem("login_activity_recorded");
                if (alreadyRecorded) return;
                // Fire-and-forget; activityLogger handles token retrieval and errors.
                logUserActivity(msalInstance, "/auth", "login", "User logged in").then(() => {
                    sessionStorage.setItem("login_activity_recorded", "1");
                }).catch(() => {
                    // swallow errors; we don't want to break app flow
                });
            } catch (e) {
                // ignore
            }
        }, [loggedIn]);

        // When the user becomes logged in, navigate to /chat
        useEffect(() => {
            if (loggedIn) {
                navigate("/chat", { replace: true });
            }
        }, [loggedIn, navigate]);

        return (
            <MsalProvider instance={msalInstance}>
                <LoginContext.Provider
                    value={{
                        loggedIn,
                        setLoggedIn
                    }}
                >
                    <Layout />
                </LoginContext.Provider>
            </MsalProvider>
        );
    } else {
        return (
            <LoginContext.Provider
                value={{
                    loggedIn,
                    setLoggedIn
                }}
            >
                <Layout />
            </LoginContext.Provider>
        );
    }
};

export default LayoutWrapper;
