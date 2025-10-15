
import { useState } from "react";
import { parseSupportingContentItem } from "./SupportingContentParser";
import { translateApi } from "../../api/api";
import styles from "./SupportingContent.module.css";

interface Props {
    supportingContent: string[] | { text: string[]; images?: string[] };
}

export const SupportingContent = ({ supportingContent }: Props) => {
    const textItems = Array.isArray(supportingContent) ? supportingContent : supportingContent.text;
    const imageItems = !Array.isArray(supportingContent) ? supportingContent?.images : [];
    // 번역 상태 관리: 각 텍스트별로 { translated, isTranslated } 저장
    const [translationStates, setTranslationStates] = useState<{ [key: number]: { translated?: string; isTranslated: boolean } }>({});

    const handleTranslate = async (ind: number, trimmedContent: string) => {
        // 이미 번역된 경우 캐시 사용
        if (translationStates[ind]?.translated) {
            setTranslationStates(prev => ({ ...prev, [ind]: { ...prev[ind], isTranslated: true } }));
            return;
        }
        try {
            const translated = await translateApi(trimmedContent);
            setTranslationStates(prev => ({ ...prev, [ind]: { translated, isTranslated: true } }));
        } catch (e) {
            alert("번역에 실패했습니다.");
        }
    };

    const handleShowOriginal = (ind: number) => {
        setTranslationStates(prev => ({ ...prev, [ind]: { ...prev[ind], isTranslated: false } }));
    };

    return (
        <ul className={styles.supportingContentNavList}>
            {textItems.map((c, ind) => {
                const parsed = parseSupportingContentItem(c);
                const sentences = parsed.content.split(".").map(s => s.trim()).filter(Boolean);
                const trimmedContent = sentences.slice(1, -1).join(". ") + (sentences.length > 2 ? "." : "");
                const isTranslated = translationStates[ind]?.isTranslated;
                const translated = translationStates[ind]?.translated;

                return (
                    <li className={styles.supportingContentItem} key={`supporting-content-text-${ind}`}>
                        <h4 className={styles.supportingContentItemHeader}>{parsed.title}</h4>
                        <p className={styles.supportingContentItemText} dangerouslySetInnerHTML={{ __html: isTranslated && translated ? translated : trimmedContent }} />
                        {!isTranslated ? (
                            <button className={styles.supportingContentTranslateBtn} onClick={() => handleTranslate(ind, trimmedContent)}>
                                번역하기
                            </button>
                        ) : (
                            <button className={styles.supportingContentTranslateBtn} onClick={() => handleShowOriginal(ind)}>
                                원문보기
                            </button>
                        )}
                    </li>
                );
            })}
            {imageItems?.map((img, ind) => {
                return (
                    <li className={styles.supportingContentItem} key={`supporting-content-image-${ind}`}>
                        <img className={styles.supportingContentItemImage} src={img} />
                    </li>
                );
            })}
        </ul>
    );
};
