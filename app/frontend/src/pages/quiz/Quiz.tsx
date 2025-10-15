import React, { useState, useEffect } from "react";
import { DefaultButton, Spinner, Panel, PanelType, IconButton } from "@fluentui/react";
import { getLatestQuizApi, saveQuizHistoryApi, saveUserActivityApi } from "../../api/api"; // saveUserActivityApi 추가
import { useLogin, getToken } from "../../authConfig";
import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import appCharacter from "../../assets/해부학_AI_캐릭터.png";
import styles from "./Quiz.module.css";
import { logUserActivity } from "../../utils/activityLogger";

type QuizItem = {
    question: string;
    choices: string[];
    answer: number; // 1-based index
    explanation: string;
    userChoice?: number | null; // 사용자가 선택한 번호
    isCorrect?: boolean; // 정답 여부
};

const Quiz: React.FC = () => {
    const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
    const [savedQuizzes, setSavedQuizzes] = useState<QuizItem[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [sessionId, setSessionId] = useState<string | null>(null);

    const useLoginEnabled = useLogin;
    const msalInstance = useLoginEnabled ? useMsal().instance : undefined;
    const navigate = useNavigate();

    // 화면 접속 시 user_activity 저장
    useEffect(() => {
        logUserActivity(msalInstance, "/quiz", "page_visit", "User visited the Quiz page");
    }, []);

    const handleGetQuiz = async () => {
        setLoading(true);
        setError(null);
        setQuizzes([]);
        setSavedQuizzes([]); // 저장용 배열 초기화
        setCurrentIdx(0);
        setSelectedChoice(null);
        setShowResult(false);
        setIsCorrect(null);

        try {
            let idToken: string | undefined;
            if (useLoginEnabled && msalInstance) {
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

            if (!data.quiz || !data.session_state) {
                setError("퀴즈 데이터를 불러올 수 없습니다.");
                setLoading(false);
                return;
            }

            let quizArray: QuizItem[] = [];
            try {
                quizArray = JSON.parse(data.quiz);
            } catch {
                setError("퀴즈 데이터 파싱 오류");
                setLoading(false);
                return;
            }

            setQuizzes(quizArray);
            setSavedQuizzes(quizArray.map((quiz) => ({ ...quiz }))); // 저장용 배열 초기화
            setSessionId(data.session_state); // session_state를 저장
        } catch (e: any) {
            setError(e.message || "퀴즈 API 호출 중 오류가 발생했습니다.");
        }
        setLoading(false);
    };

    const handleChoice = (idx: number) => {
        if (!showResult) setSelectedChoice(idx);
    };

    const handleSubmit = async () => {
        if (selectedChoice === null) return;

        const correct = quizzes[currentIdx].answer === selectedChoice + 1;

        // 저장용 배열 업데이트
        const updatedSavedQuizzes = [...savedQuizzes];
        updatedSavedQuizzes[currentIdx] = {
            ...quizzes[currentIdx],
            userChoice: selectedChoice,
            isCorrect: correct,
        };

        setSavedQuizzes(updatedSavedQuizzes); // 상태 업데이트
        setIsCorrect(correct);
        setShowResult(true);

        // 모든 퀴즈를 완료했는지 확인
        if (currentIdx === quizzes.length - 1) {
            // 마지막 퀴즈인 경우 savedQuizzes 업데이트 후 saveQuizHistory 호출
            setTimeout(() => {
                setSavedQuizzes((prev) => {
                    saveQuizHistory(prev); // 업데이트된 savedQuizzes를 전달
                    return prev;
                });
            }, 0);
        }
    };

    const handleNext = async () => {
        setCurrentIdx((prev) => prev + 1);
        setSelectedChoice(null);
        setShowResult(false);
        setIsCorrect(null);
    };

    const saveQuizHistory = async (quizzesToSave: QuizItem[] = savedQuizzes) => {
        // console.log("저장된 퀴즈 데이터:", quizzesToSave);

        try {
            const token = msalInstance ? await getToken(msalInstance) : null;
            if (!token) {
                // console.error("유효한 토큰이 없습니다.");
                return;
            }

            const webSessionId = sessionStorage.getItem("web_session_id"); // web_session_id 가져오기

            // 히스토리 저장 API 호출
            await saveQuizHistoryApi(
                {
                    id: sessionId, // 세션 ID (고유 값 생성)
                    web_session_id: webSessionId, // web_session_id 추가
                    results: quizzesToSave, // 저장된 퀴즈 결과
                },
                token
            );

            // console.log("퀴즈 히스토리가 성공적으로 저장되었습니다.");
        } catch (error) {
            // console.error("퀴즈 히스토리 저장 실패:", error);
        }
    };

    // 화면 진입 시 퀴즈 자동 불러오기
    useEffect(() => {
        handleGetQuiz();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 퀴즈가 없으면 버튼만, 있으면 퀴즈 진행
    return (
        <div className={styles.container}>
            <div className={styles.header}></div>
            <div>
                <div className={styles.title}>AI가 만든 퀴즈를 풀며 복습하세요.</div>
                <div className={styles.content}>
                    <img src={appCharacter} alt="App Character" className={styles.image} />
                    <div className={styles.text}>
                        아까 네가 나에게 질문했던 내용을 바탕으로 퀴즈를 만들어봤어!<br />
                        퀴즈를 풀면서 배운 내용을 복습해보자.<br />
                        잘 학습했는지 확인해볼 준비됐지? <span className={styles.emoji}>😊</span>
                    </div>
                </div>
            </div>
            {quizzes.length === 0 && (
                <DefaultButton onClick={handleGetQuiz} disabled={loading} className={styles.button}>
                    퀴즈 불러오기
                </DefaultButton>
            )}
            {loading && <Spinner label="퀴즈를 불러오는 중입니다..." />}
            {error && <div className={styles.error}>{error}</div>}
            {quizzes.length > 0 && currentIdx < quizzes.length && (
                <div className={styles.quizContainer}>
                    <div className={styles.quizQuestion}>
                        <b>문제 {currentIdx + 1}.</b> {quizzes[currentIdx].question}
                    </div>
                    <div>
                        {quizzes[currentIdx].choices.map((choice, idx) => (
                            <div
                                key={idx}
                                onClick={() => handleChoice(idx)}
                                className={`${styles.quizChoice} ${
                                    selectedChoice === idx ? styles.selected : ""
                                } ${showResult && quizzes[currentIdx].answer === idx + 1 ? styles.correct : ""}`}
                            >
                                {choice}
                            </div>
                        ))}
                    </div>
                    {!showResult && (
                        <DefaultButton onClick={handleSubmit} disabled={selectedChoice === null} className={styles.button}>
                            제출
                        </DefaultButton>
                    )}
                    {showResult && (
                        <div className={styles.quizResult}>
                            <div style={{ color: isCorrect ? "green" : "red", fontWeight: "bold" }}>
                                {isCorrect ? "정답입니다!" : "오답입니다."}
                            </div>
                            <div className={styles.quizExplanation}>
                                <b>해설:</b> {quizzes[currentIdx].explanation}
                            </div>
                            {currentIdx < quizzes.length - 1 ? (
                                <DefaultButton onClick={handleNext} className={styles.button}>
                                    다음 문제
                                </DefaultButton>
                            ) : (
                                <div className={styles.quizEnd}>
                                    퀴즈가 모두 끝났습니다!{" "}
                                    <Link
                                        to="/outro"
                                        className={styles.link}
                                        state={{ quizzes: savedQuizzes }}
                                    >
                                        학습 정리
                                    </Link> 로 이동하세요.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Quiz;
