import React, { useState } from "react";
import { DefaultButton, Spinner } from "@fluentui/react";
import { getLatestQuizApi } from "../../api/api";
import { useLogin, getToken } from "../../authConfig";
import { useMsal } from "@azure/msal-react";

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
            if (Array.isArray(data)) {
                setQuizzes(data);
            } else if (data.quiz && Array.isArray(data.quiz)) {
                setQuizzes(data.quiz);
            } else if (data.error) {
                setError(data.error);
            } else {
                setError("퀴즈 데이터를 불러올 수 없습니다.");
            }

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

    // 퀴즈가 없으면 버튼만, 있으면 퀴즈 진행
    return (
        <div style={{ padding: 32, maxWidth: 700, margin: "0 auto" }}>
            <h2>최근 대화 기반 퀴즈 조회</h2>
            {quizzes.length === 0 && (
                <DefaultButton onClick={handleGetQuiz} disabled={loading} style={{ marginBottom: 24 }}>
                    퀴즈 불러오기
                </DefaultButton>
            )}
            {loading && <Spinner label="퀴즈를 불러오는 중입니다..." />}
            {error && <div style={{ color: "red", marginTop: 16 }}>{error}</div>}

            {quizzes.length > 0 && currentIdx < quizzes.length && (
                <div style={{ marginTop: 24 }}>
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
                        <div style={{ marginTop: 16 }}>
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
                                <div style={{ marginTop: 24, fontWeight: "bold" }}>퀴즈가 모두 끝났습니다!</div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Quiz;