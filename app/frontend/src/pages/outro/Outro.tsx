import React, { useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { useLogin } from "../../authConfig";
import { logUserActivity } from "../../utils/activityLogger";
import appCharacter from "../../assets/해부학_AI_캐릭터.png";
import styles from "./Outro.module.css";

const Outro = () => {
    const client = useLogin ? useMsal().instance : undefined;

    // 화면 접속 시 로그 저장
    useEffect(() => {
        logUserActivity(client, "/outro", "page_visit", "User visited the Outro page");
    }, [client]);

    return (
        <div className={styles.container}>
            <div className={styles.title}>
                학습 정리
            </div>
            <div className={styles.content}>
                <img
                    src={appCharacter}
                    alt="App Character"
                    className={styles.image}
                />
                <div className={styles.text}>
                    지금까지 토미와 함께 해부학 공부를 잘 마쳤어.<br />
                    친구에게 설명하듯 배운 내용을 내 말로 정리하고, 궁금한 점은 직접 토미에게 질문했지.
                    질문을 바탕으로 만든 퀴즈도 풀면서 한 번 더 확인했어.
                    <br />
                    <br />
                    오늘 배운 내용 중 더 공부가 필요한 부분은 다시 복습해서 내 것으로 만들어보자!{" "}
                    <span className={styles.emoji}>😊</span>
                </div>
            </div>
        </div>
    );
};

export default Outro;