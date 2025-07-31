import React from "react";
import appCharacter from "../../assets/해부학_AI_캐릭터.png";

const Outro = () => (
    <div style={{ padding: 32, minHeight: "100vh", background: "#f2f2f2" }}>
        <div
            style={{
                fontSize: 48,
                fontWeight: "bold",
                padding: "16px 0",
                textAlign: "center",
                marginBottom: 32,
                letterSpacing: "2px",
            }}
        >
            학습 정리
        </div>
        <div
            style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 24,
                marginBottom: 24,
                paddingLeft: 70,
                paddingRight: 70,
                maxWidth: 1100,
                marginLeft: "auto",
                marginRight: "auto"
            }}
        >
            <img
                src={appCharacter}
                alt="App Character"
                style={{
                    width: 140,
                    objectFit: "contain",
                    marginLeft: 8,
                    background: "#f8f8f8",
                    borderRadius: 12,
                    border: "1px solid #eee",
                }}
            />
            <div
                style={{
                    border: "2px solid #888",
                    borderRadius: 8,
                    padding: 20,
                    fontSize: 22,
                    background: "#fafbfc",
                    color: "#444",
                    flex: 1,
                    lineHeight: 1.6,
                }}
            >
                지금까지 AI 튜터와 함께 해부학을 잘 공부했어요.<br />
                친구에게 설명하듯 배운 내용을 자기 언어로 정리해보았고, 설명하면서 떠오른 궁금증을 직접 AI에게 질문해보았죠.
                질문 내용을 바탕으로 만든 퀴즈를 풀며 다시 한 번 내용을 확인했어요.
                <br />
                <br />
                오늘 학습한 내용 중 공부가 더 필요한 부분은 다시 복습하며 내 지식으로 만들어볼까요?{" "}
                <span style={{ fontSize: 26 }}>😊</span>
            </div>
        </div>
    </div>
);

export default Outro;