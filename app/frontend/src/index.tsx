import React from "react";
import ReactDOM from "react-dom/client";
import { createHashRouter, RouterProvider, Navigate } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { HelmetProvider } from "react-helmet-async";
import { initializeIcons } from "@fluentui/react";

import "./index.css";

import Chat from "./pages/chat/Chat";
import Intro from "./pages/intro/Intro";
import LayoutWrapper from "./layoutWrapper";
import i18next from "./i18n/config";
import Outro from "./pages/outro/Outro";
import Test from "./pages/test/Test";

initializeIcons();

const router = createHashRouter([
    {
        path: "/",
        element: <LayoutWrapper />,
        children: [
            {
                index: true,
                element: <Navigate to="/chat" replace />
            },
            {
                path: "intro",
                element: <Intro />
            },
            {
                path: "chat",
                element: <Chat />
            },
            {
                path: "qa",
                lazy: () => import("./pages/ask/Ask")
            },
            {
                path: "quiz",
                lazy: async () => {
                    const Quiz = (await import("./pages/quiz/Quiz")).default;
                    return { element: <Quiz /> };
                }
            },
            {
                path: "outro",
                element: <Outro />
            },
            {
                path: "test",
                element: <Test />
            },
            {
                path: "*",
                lazy: () => import("./pages/NoPage")
            }
        ]
    }
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <I18nextProvider i18n={i18next}>
            <HelmetProvider>
                <RouterProvider router={router} />
            </HelmetProvider>
        </I18nextProvider>
    </React.StrictMode>
);
