import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { useLogin } from "../../authConfig";
import { logUserActivity } from "../../utils/activityLogger";
import appCharacter from "../../assets/해부학_AI_캐릭터.png";
import styles from "./Intro.module.css";

const Intro = () => {
    const client = useLogin ? useMsal().instance : undefined;

    // 화면 접속 시 로그 저장
    useEffect(() => {
        logUserActivity(client, "/intro", "page_visit", "User visited the Intro page");
    }, [client]);

    return (
        <div className={styles.container}>
            <div className={styles.title}>
                해부학을 위한 AI 튜터
            </div>
            <div className={styles.content}>
                <img
                    src={appCharacter}
                    alt="App Character"
                    className={styles.image}
                />
                <div className={styles.text}>
                    안녕! 나는 너와 함께 해부학을 쉽고 재밌게 공부할 AI 튜터 '토미'야!<br />
                    이제 나와 함께 아래의 순서로 공부해볼거야.<br /><br />
                    1) 교수님과 공부한 내용에 대해 너만의 말로 간단히 설명해봐.<br />
                    2) 설명을 하다가 생긴 궁금한 점이나 모르는 내용을 나한테 물어보면 돼.<br />
                    3) 너의 질문을 바탕으로 내가 만들어주는 퀴즈도 풀면서 실력을 키워가면 돼.<br /><br />
                    자, 준비가 되었으면{" "}
                    <Link to="/qa" className={styles.link}>
                        1단계로 이동
                    </Link>
                    해서 공부를 시작해볼까? <span className={styles.emoji}>😊</span>
                </div>
            </div>
        </div>
    );
};

export default Intro;