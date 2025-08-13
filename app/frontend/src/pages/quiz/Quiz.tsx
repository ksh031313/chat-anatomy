import React, { useState, useEffect } from "react";
import { DefaultButton, Spinner, Panel, PanelType, IconButton } from "@fluentui/react";
import { getLatestQuizApi, saveQuizResultApi } from "../../api/api";
import { useLogin, getToken } from "../../authConfig";
import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import appCharacter from "../../assets/해부학_AI_캐릭터.png";
import styles from "./Quiz.module.css";

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

    const useLoginEnabled = useLogin;
    const msalInstance = useLoginEnabled ? useMsal().instance : undefined;
    const navigate = useNavigate();

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

            // 로그인 정보 출력 **테스트용(운영시 삭제!!)**
            if (msalInstance) {
                const accounts = msalInstance.getAllAccounts();
                console.log("로그인된 계정 정보:", accounts);

                const token = await getToken(msalInstance);
                console.log("ID Token:", token);
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
            setSavedQuizzes(quizArray.map((quiz) => ({ ...quiz }))); // 저장용 배열 초기화

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

        // 저장용 배열 업데이트
        const updatedSavedQuizzes = [...savedQuizzes];
        updatedSavedQuizzes[currentIdx] = {
            ...quizzes[currentIdx],
            userChoice: selectedChoice,
            isCorrect: correct,
        };

        setSavedQuizzes(updatedSavedQuizzes);
        setIsCorrect(correct);
        setShowResult(true);
    };

    const handleNext = async () => {
        if (currentIdx < quizzes.length - 1) {
            setCurrentIdx((prev) => prev + 1);
            setSelectedChoice(null);
            setShowResult(false);
            setIsCorrect(null);
        } else {
            // 모든 퀴즈를 완료했을 때 저장
            await saveQuizResults();
        }
    };

    const saveQuizResults = async () => {
        console.log("저장된 퀴즈 데이터:", savedQuizzes);
        // try {
        //     const token = msalInstance ? await getToken(msalInstance) : null;
        //     if (!token) {
        //         console.error("유효한 토큰이 없습니다.");
        //         return;
        //     }

        //     await saveQuizResultApi(
        //         {
        //             id: "quiz-session", // 세션 ID 또는 고유 식별자
        //             results: savedQuizzes, // 저장된 퀴즈 결과
        //         },
        //         token
        //     );

        //     console.log("퀴즈 결과가 성공적으로 저장되었습니다.");
        // } catch (error) {
        //     console.error("퀴즈 결과 저장 실패:", error);
        // }
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
                                    <Link to="/outro" className={styles.link}>
                                        학습 정리
                                    </Link>
                                    로 이동하세요.
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
