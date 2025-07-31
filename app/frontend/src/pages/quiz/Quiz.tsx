import React, { useState, useEffect } from "react";
import { DefaultButton, Spinner, Panel, PanelType, IconButton } from "@fluentui/react";
import { getLatestQuizApi } from "../../api/api";
import { useLogin, getToken } from "../../authConfig";
import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import appCharacter from "../../assets/해부학_AI_캐릭터.png";

type QuizItem = {
    question: string;
    choices: string[];
    answer: number; // 1-based index
    explanation: string;
};

const Quiz: React.FC = () => {
    const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const useLoginEnabled = useLogin;
    const msalInstance = useLoginEnabled ? useMsal().instance : undefined;
    const navigate = useNavigate();

    const handleGetQuiz = async () => {
        setLoading(true);
        setError(null);
        setQuizzes([]);
        setCurrentIdx(0);
        setSelectedChoice(null);
        setShowResult(false);
        setIsCorrect(null);
        try {

            let idToken: string | undefined;
            if (useLoginEnabled && msalInstance) {
                idToken = await getToken(msalInstance);
            } else if (msalInstance) {
                idToken = await getToken(msalInstance);
            } else {
                setError("msalInstance가 필요합니다.");
                setLoading(false);
                return;
            }

            if (!idToken) {
                setError("유효한 토큰이 없습니다.");
                setLoading(false);
                return;
            }

            const data = await getLatestQuizApi(idToken);

            let quizArray: QuizItem[] = [];
            if (data.quiz && typeof data.quiz === "string") {
                try {
                    quizArray = JSON.parse(data.quiz);
                } catch {
                    setError("퀴즈 데이터 파싱 오류");
                    setLoading(false);
                    return;
                }
            } else {
                setError("퀴즈 데이터를 불러올 수 없습니다.");
                setLoading(false);
                return;
            }
            setQuizzes(quizArray);

            // Mock data for demonstration purposes
//             const data = [
//   {
//     question: "삼키는 동안 기도가 보호되는 주된 방법은 무엇인가요?",
//     choices: [
//       "1. 후두(larynx)를 하강시킨다",
//       "2. 하이오래인지얼 상승(hyolaryngeal elevation)을 통해 기도를 닫는다",
//       "3. 연구개(soft palate)를 낮춘다",
//       "4. 호흡을 빠르게 한다"
//     ],
//     answer: 2,
//     explanation: "하이오래인지얼 상승은 하이오이드 뼈와 후두를 상승시켜 기도를 닫는 주요 보호 메커니즘입니다."
//   },
//   {
//     question: "음식이 코로 들어가는 것을 방지하기 위해 삼키는 동안 어떤 구조가 상승되나요?",
//     choices: [
//       "1. 후두개(epiglottis)",
//       "2. 연구개(soft palate)",
//       "3. 혀(tongue)",
//       "4. 식도(esophagus)"
//     ],
//     answer: 2,
//     explanation: "삼키는 동안 연구개가 상승하여 인두협(pharyngeal isthmus)을 닫아 음식물이 비강으로 들어가는 것을 방지합니다."
//   },
//   {
//     question: "삼키는 동안 호흡이 어떻게 조정되나요?",
//     choices: [
//       "1. 호흡이 일시적으로 멈춘다",
//       "2. 호흡 속도가 빨라진다",
//       "3. 호흡이 깊어진다",
//       "4. 호흡 패턴이 변하지 않는다"
//     ],
//     answer: 1,
//     explanation: "삼키는 동안 호흡이 일시적으로 멈추며, 음식물이 기도로 들어가지 않도록 보호합니다."
//   }
// ];
//         setQuizzes(data);

        } catch (e: any) {
            setError(e.message || "퀴즈 API 호출 중 오류가 발생했습니다.");
        }
        setLoading(false);
    };

    const handleChoice = (idx: number) => {
        if (!showResult) setSelectedChoice(idx);
    };

    const handleSubmit = () => {
        if (selectedChoice === null) return;
        const correct = quizzes[currentIdx].answer === selectedChoice + 1;
        setIsCorrect(correct);
        setShowResult(true);
    };

    const handleNext = () => {
        setCurrentIdx((prev) => prev + 1);
        setSelectedChoice(null);
        setShowResult(false);
        setIsCorrect(null);
    };

    // 화면 진입 시 퀴즈 자동 불러오기
    useEffect(() => {
        handleGetQuiz();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 퀴즈가 없으면 버튼만, 있으면 퀴즈 진행
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", padding: 32 }}>
            <div style={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}>
            </div>
            <div>
                <div
                    style={{
                        fontSize: 44,
                        fontWeight: "bold",
                        padding: "16px 0",
                        textAlign: "center",
                        marginBottom: 32,
                        letterSpacing: "2px",
                    }}
                >
                    AI가 만든 퀴즈를 풀며 복습하세요.
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 24, marginBottom: 32, paddingLeft: 70, paddingRight: 70, maxWidth: 1100, marginLeft: "auto", marginRight: "auto", }}>
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
                            lineHeight: 1.3,
                        }}
                    >
                        아까 네가 나에게 질문했던 내용을 바탕으로 퀴즈를 만들어봤어!<br />
                        퀴즈를 풀면서 배운 내용을 복습해보자.<br />
                        잘 학습했는지 확인해볼 준비됐지? <span style={{ fontSize: 32 }}>😊</span>
                    </div>
                </div>
            </div>
            {/* <DefaultButton
                style={{ marginTop: 20 }}
                onClick={() => navigate("/outro")}
                >
                학습 정리로 이동
            </DefaultButton> */}
            {quizzes.length === 0 && (
            <DefaultButton onClick={handleGetQuiz} disabled={loading} style={{ marginBottom: 24 }}>
                퀴즈 불러오기
            </DefaultButton>
            )}
            {loading && <Spinner label="퀴즈를 불러오는 중입니다..." />}
            {error && <div style={{ color: "red", marginTop: 16 }}>{error}</div>}

            {quizzes.length > 0 && currentIdx < quizzes.length && (
            <div style={{ width: "50%" }}>
                <div style={{ marginBottom: 16 }}>
                <b>문제 {currentIdx + 1}.</b> {quizzes[currentIdx].question}
                </div>
                <div>
                {quizzes[currentIdx].choices.map((choice, idx) => (
                    <div
                    key={idx}
                    onClick={() => handleChoice(idx)}
                    style={{
                        padding: "8px 12px",
                        margin: "6px 0",
                        border: "1px solid #ccc",
                        borderRadius: 6,
                        background: selectedChoice === idx ? "#e6f7ff" : "#fff",
                        cursor: showResult ? "default" : "pointer",
                        opacity: showResult && quizzes[currentIdx].answer === idx + 1 ? 1 : undefined,
                        fontWeight: showResult && quizzes[currentIdx].answer === idx + 1 ? "bold" : undefined,
                    }}
                    >
                    {choice}
                    </div>
                ))}
                </div>
                {!showResult && (
                <DefaultButton
                    onClick={handleSubmit}
                    disabled={selectedChoice === null}
                    style={{ marginTop: 16 }}
                >
                    제출
                </DefaultButton>
                )}
                {showResult && (
                <div style={{ marginTop: 16, marginBottom: 16 }}>
                    <div style={{ color: isCorrect ? "green" : "red", fontWeight: "bold" }}>
                    {isCorrect ? "정답입니다!" : "오답입니다."}
                    </div>
                    <div style={{ marginTop: 8, background: "#f5f5f5", padding: 12, borderRadius: 6 }}>
                    <b>해설:</b> {quizzes[currentIdx].explanation}
                    </div>
                    {currentIdx < quizzes.length - 1 ? (
                    <DefaultButton onClick={handleNext} style={{ marginTop: 16 }}>
                        다음 문제
                    </DefaultButton>
                    ) : (
                    <div style={{ marginTop: 24, fontWeight: "bold" }}>
                        퀴즈가 모두 끝났습니다!{" "}
                        <Link to="/outro" style={{ color: "#1976d2", textDecoration: "underline", fontWeight: "bold" }}>
                            학습 정리
                        </Link>
                        로 이동하세요.
                    </div>
                    )}
                </div>
                )}
            </div>
            )}

            {/* 퀴즈가 모두 끝났을 때 */}
            {quizzes.length > 0 && currentIdx === quizzes.length && (
                <div style={{ marginTop: 24, fontWeight: "bold", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    퀴즈가 모두 끝났습니다!{" "}
                    <Link to="/outro" style={{ color: "#1976d2", textDecoration: "underline", fontWeight: "bold" }}>
                        학습 정리
                    </Link>
                    로 이동하세요.
                </div>
            )}
        </div>
    );
};

export default Quiz;