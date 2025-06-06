import React from "react";
import { Link } from "react-router-dom";

const Intro = () => (
    <div style={{ padding: 32 }}>
        <h1>환영합니다!</h1>
        <p>해부학 수업을 위한 학습 도우미 챗봇 서비스입니다.</p>
        <p>질문이 있으면 언제든지 채팅을 시작하세요.</p>
        <Link to="/chat">
            <button style={{ marginTop: 24, padding: "12px 24px", fontSize: 16 }}>
                Chat 시작하기
            </button>
        </Link>
    </div>
);

export default Intro;