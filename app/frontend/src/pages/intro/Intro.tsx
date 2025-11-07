import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { useLogin } from "../../authConfig";
import { useState } from "react";
import { logUserActivity } from "../../utils/activityLogger";
import appCharacter from "../../assets/해부학_AI_캐릭터.png";
import styles from "./Intro.module.css";

const Intro = () => {
    const client = useLogin ? useMsal().instance : undefined;
    const [isRetrievalNone, setIsRetrievalNone] = useState<boolean>(() => {
        try {
            const stored = sessionStorage.getItem("retrievalMode");
            if (!stored) return false;
            return stored.toLowerCase() === "none";
        } catch (e) {
            return false;
        }
    });

    // 화면 접속 시 로그 저장
    useEffect(() => {
        logUserActivity(client, "/intro", "page_visit", "User visited the Intro page");
    }, []);

    // Keep local isRetrievalNone in sync if sessionStorage changes in same tab
    useEffect(() => {
        const stored = sessionStorage.getItem("retrievalMode");
        try {
            setIsRetrievalNone(Boolean(stored && stored.toLowerCase() === "none"));
        } catch (e) {
            console.debug("Could not read retrievalMode from sessionStorage", e);
            setIsRetrievalNone(false);
        }
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <img
                    src={appCharacter}
                    alt="App Character"
                    className={styles.image}
                />
                <div className={styles.title}>
                    해부학을 위한 AI 튜터 사용법
                </div>
            </div>

            <div className={styles.text}>
                <div className={styles.textBody}>
                    {isRetrievalNone ? (
                        <>
                            • AI 챗봇 Tomy와 함께 효율적으로 해부학을 공부하세요.<br />
                            • 해부학을 실습하다가 궁금한 것이 생기면 ChatGPT에게 묻듯 편하게 Tomy에게 질문하며 공부하세요.<br />
                            • 중간중간 Tomy가 잘 공부했나 묻기도 하고 질문한 내용을 바탕으로 맞춤형 퀴즈도 만들어줄 겁니다. AI 시대 남들보다 앞서가며 학습하세요!
                        </>
                    ) : (
                        <>
                            • 믿음직한 AI 챗봇 Tomy와 함께 효율적으로 해부학을 공부하세요.<br />
                            • ChatGPT는 거짓말을 하지만 Tomy는 교수님이 제공한 자료에 기반해 대답하고 자료의 어느부분을 바탕으로 대답했는지 보여줍니다.<br />
                            • 해부학을 실습하다가 궁금한 것이 생기면 ChatGPT에게 묻듯 편하게 Tomy에게 질문하고 바로 검증하세요.<br />
                            • 중간중간 Tomy가 잘 공부했나 묻기도 하고 질문한 내용을 바탕으로 맞춤형 퀴즈도 만들어줄 겁니다. AI 시대 남들보다 앞서가며 학습하세요!
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Intro;