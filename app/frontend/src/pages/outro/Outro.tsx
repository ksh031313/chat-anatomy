import React, { useEffect, useMemo, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { useLogin, getToken } from "../../authConfig";
import { logUserActivity } from "../../utils/activityLogger";
import appCharacter from "../../assets/해부학_AI_캐릭터.png";
import styles from "./Outro.module.css";
import { useLocation } from "react-router-dom";
import { getChatHistorySummaryApi } from "../../api/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from 'rehype-sanitize';
import rehypeRaw from "rehype-raw";

const Outro = () => {
    const client = useLogin ? useMsal().instance : undefined;
    const location = useLocation();
    const quizzes = location.state?.quizzes || [];
    const [currentIdx, setCurrentIdx] = useState(0);
    const [summary, setSummary] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");
    const memoSummary = useMemo(() => summary, [summary]);

    useEffect(() => {
        logUserActivity(client, "/outro", "page_visit", "User visited the Outro page");

        // 학습 요약 조회
        const fetchSummary = async () => {
            setLoading(true);
            setError("");
            try {
                let idToken: string | undefined;
                if (client) {
                    idToken = await getToken(client);
                }
                if (!idToken) {
                    setError("유효한 토큰이 없습니다.");
                    setLoading(false);
                    return;
                }
                const result = await getChatHistorySummaryApi(idToken);
                if (result.summary) {
                    // Log raw summary for debugging/verification
                    // console.log("getChatHistorySummaryApi: raw summary:", result.summary);

                    // If the LLM wrapped the markdown inside a fenced code block (e.g. ```markdown ... ```),
                    // strip that so ReactMarkdown renders headings/lists instead of a code block.
                    let cleaned = (result.summary as string).trim();
                    // Remove leading ```lang or ``` if present
                    if (/^```[\w-]*\n/i.test(cleaned)) {
                        cleaned = cleaned.replace(/^```[\w-]*\n/, "");
                    }
                    // Remove trailing ``` fence if present
                    if (/\n```\s*$/i.test(cleaned)) {
                        cleaned = cleaned.replace(/\n```\s*$/, "");
                    }

                    // Log cleaned summary and markdown-likeness
                    // console.log("getChatHistorySummaryApi: cleaned summary:", cleaned);
                    const isMarkdownLike = /(^#{1,6}\s)|(^\s*[-*+]\s+)|(^\s*\d+\.\s+)|(^>\s+)/m.test(cleaned);
                    // console.log("getChatHistorySummaryApi: looksLikeMarkdown:", isMarkdownLike);

                    setSummary(cleaned);
                } else {
                    // console.log("getChatHistorySummaryApi: no summary, error:", result.error);
                    setError(result.error || "요약 정보를 가져올 수 없습니다.");
                }
            } catch (err: any) {
                setError(err.message || "요약 정보를 가져올 수 없습니다.");
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, []);

    const handlePrev = () => {
        setCurrentIdx((prev) => Math.max(prev - 1, 0));
    };
    const handleNext = () => {
        setCurrentIdx((prev) => Math.min(prev + 1, quizzes.length - 1));
    };

    // summary will be rendered directly as Markdown

    return (
        <div className={styles.container}>
            <div className={styles.title}>학습 정리</div>
            <div className={styles.content}>
                <img
                    src={appCharacter}
                    alt="App Character"
                    className={styles.image}
                />
                <div className={styles.text}>
                    {/* 학습 요약 영역 */}
                    {loading ? (
                        <span>학습 내용을 요약 중입니다...</span>
                    ) : error ? (
                        <span className={styles.error}>{error}</span>
                    ) : (
                        <div className={styles.summaryBox}>
                            <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeSanitize]} remarkPlugins={[remarkGfm]}> 
                                {memoSummary}
                            </ReactMarkdown>
                        </div>
                    )}
                    {/* 퀴즈 결과 영역을 요약 아래에 위치 */}
                    <div className={styles.quizResultSection}>
                        {quizzes.length === 0 ? (
                            <span>퀴즈 결과 데이터가 없습니다.</span>
                        ) : (
                            <div>
                                <div className={styles.quizSummaryTitle}>
                                    <b>문제 {currentIdx + 1} / {quizzes.length}</b>
                                </div>
                                <div className={styles.quizQuestion}><b>Q.</b> {quizzes[currentIdx].question}</div>
                                <div className={styles.quizChoices}>
                                    {quizzes[currentIdx].choices.map((choice: string, idx: number) => (
                                        <div
                                            key={idx}
                                            className={
                                                quizzes[currentIdx].answer === idx + 1
                                                    ? styles.correctChoice
                                                    : quizzes[currentIdx].userChoice === idx
                                                    ? styles.selectedChoice
                                                    : styles.choice
                                            }
                                        >
                                            {choice}
                                            {quizzes[currentIdx].userChoice === idx && " (내 선택)"}
                                            {quizzes[currentIdx].answer === idx + 1 && " (정답)"}
                                        </div>
                                    ))}
                                </div>
                                <div className={styles.quizExplanation}><b>해설:</b> {quizzes[currentIdx].explanation}</div>
                                <div className={styles.quizNav}>
                                    <button onClick={handlePrev} disabled={currentIdx === 0} className={styles.button}>이전 문제</button>
                                    <button onClick={handleNext} disabled={currentIdx === quizzes.length - 1} className={styles.button}>다음 문제</button>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* 마무리 멘트 */}
                    <div className={styles.finishMessage} style={{ marginTop: "1rem", textAlign: "center" }}>
                        수고하셨습니다.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Outro;