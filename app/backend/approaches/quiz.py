from openai import AsyncOpenAI
from typing import Any, List, Dict, Optional
from quart import current_app, Blueprint, jsonify
from openai.types.chat import ChatCompletionMessageParam
from approaches.approach import Approach
from approaches.promptmanager import PromptManager, PromptyManager
import logging
import os
from config import (
    CONFIG_OPENAI_CLIENT,
    CONFIG_CHAT_HISTORY_COSMOS_ENABLED,
    CONFIG_COSMOS_HISTORY_CONTAINER,
)

quiz_bp = Blueprint("quiz", __name__)

async def fetch_latest_chat_history(auth_claims: dict[str, Any], container) -> List[List[str]]:
    """
    가장 최근의 대화 세션에서 질문/답변 쌍을 반환합니다.
    """
    entra_oid = auth_claims.get("oid")
    # entra_oid = "86b9693e-e4af-409e-afd1-31321ea641df"
    logging.info(f"fetch_latest_chat_history: entra_oid={entra_oid}")
    if not entra_oid:
        raise ValueError("User OID not found")

    # 최근 세션 id 조회
    res = container.query_items(
        query="SELECT TOP 1 c.id FROM c WHERE c.entra_oid = @entra_oid AND c.type = @type ORDER BY c.timestamp DESC",
        parameters=[dict(name="@entra_oid", value=entra_oid), dict(name="@type", value="session")],
        partition_key=[entra_oid],
    )
    latest_session_id = None
    async for page in res.by_page():
        async for item in page:
            latest_session_id = item.get("id")
            logging.info(f"fetch_latest_chat_history: latest_session_id={latest_session_id}")
            break
        break

    if not latest_session_id:
        raise ValueError("No chat history found")

    # 해당 세션의 message_pair 조회
    res = container.query_items(
        query="SELECT * FROM c WHERE c.session_id = @session_id AND c.type = @type",
        parameters=[dict(name="@session_id", value=latest_session_id), dict(name="@type", value="message_pair")],
        partition_key=[entra_oid, latest_session_id],
    )

    message_pairs = []

    async for page in res.by_page():
        async for item in page:
            message_pairs.append([item["question"], item["response"]["message"]["content"]])
    logging.info(f"fetch_latest_chat_history: message_pairs_count={len(message_pairs)}")

    if not message_pairs:
        raise ValueError("No messages in latest session")

    # 테스트용 데이터
    # message_pairs = [
    #     ["인공지능이란 무엇인가요?", "인공지능은 인간의 지능을 모방하는 컴퓨터 시스템입니다."],
    #     ["머신러닝과 딥러닝의 차이는?", "딥러닝은 머신러닝의 한 분야로, 인공신경망을 사용합니다."],
    #     ["챗봇의 주요 활용 사례는?", "고객 지원, 정보 안내, 예약 서비스 등 다양한 분야에서 활용됩니다."]
    # ]
    logging.info(f"[TEST] fetch_latest_chat_history: message_pairs_count={len(message_pairs)}")

    return message_pairs

class QuizGenerator(Approach):
    def __init__(
        self,
        prompt_manager: PromptManager,
        openai_client: AsyncOpenAI,
        chatgpt_model: str,
        chatgpt_deployment: Optional[str] = None,
    ):
        self.prompt_manager = prompt_manager
        self.openai_client = openai_client
        self.chatgpt_model = chatgpt_model
        self.chatgpt_deployment = chatgpt_deployment
        try:
            self.prompt_template = self.prompt_manager.load_prompt("quiz_generate.prompty")
        except Exception as e:
            logging.error(f"PromptManager 프롬프트 로드 실패: {e}", exc_info=True)
            self.prompt_template = None

    async def run(
        self,
        messages: list[dict],
        session_state: any = None,
        context: dict = {},
    ) -> dict:
        """
        Approach 인터페이스에 맞춘 run 메서드.
        messages: [{"role": "user", "content": "..."}] 형태
        """
        # 예시: 마지막 메시지를 user query로 사용
        message_pairs = context.get("message_pairs") or []
        logging.info(f"QuizGenerator.run: message_pairs={message_pairs}")
        if not self.prompt_template:
            logging.error("프롬프트 템플릿이 없습니다.")
            return {"error": "프롬프트 템플릿이 없습니다."}

        # history_text 생성
        history_text = "\n".join([f"Q: {q}\nA: {a}" for q, a in message_pairs])

        # prompty 객체에 데이터 바인딩
        prompt_messages: list[ChatCompletionMessageParam] = self.prompt_manager.render_prompt(
            self.prompt_template,
            {"history": history_text}
        )
        logging.info(f"QuizGenerator.run: prompt_messages={prompt_messages}")

        # approach.py의 create_chat_completion 사용
        chat_completion = await self.create_chat_completion(
            self.chatgpt_deployment,
            self.chatgpt_model,
            messages=prompt_messages,
            overrides={},
            response_token_limit=1500,
            temperature=0.7,
        )

        quiz_json = chat_completion.choices[0].message.content.strip()
        logging.info(f"QuizGenerator.run: quiz_json={quiz_json}")
        return {"quiz": quiz_json}

# get_latest_quiz에서 QuizGenerator 생성 시 config에서 값을 꺼내서 넘겨주세요.
async def get_latest_quiz(auth_claims: dict[str, Any]) -> Dict[str, Any]:
    """
    백엔드에서 호출: 최근 대화 히스토리를 불러오고, 퀴즈를 생성하여 반환합니다.
    """
    logging.info(f"get_latest_quiz: auth_claims={auth_claims}")
    if not current_app.config.get(CONFIG_CHAT_HISTORY_COSMOS_ENABLED):
        logging.warning("get_latest_quiz: Chat history not enabled")
        return {"error": "Chat history not enabled"}

    container = current_app.config.get(CONFIG_COSMOS_HISTORY_CONTAINER)
    if not container:
        logging.warning("get_latest_quiz: Chat history container not configured")
        return {"error": "Chat history container not configured"}

    try:
        message_pairs = await fetch_latest_chat_history(auth_claims, container)
        prompt_manager = PromptyManager()
        openai_client = current_app.config[CONFIG_OPENAI_CLIENT]
        # 아래 두 줄을 환경변수에서 직접 읽어오도록 수정
        chatgpt_model = os.environ["AZURE_OPENAI_CHATGPT_MODEL"]
        chatgpt_deployment = os.environ.get("AZURE_OPENAI_CHATGPT_DEPLOYMENT")
        quiz_generator = QuizGenerator(
            prompt_manager,
            openai_client,
            chatgpt_model,
            chatgpt_deployment,
        )
        quiz = await quiz_generator.run([], context={"message_pairs": message_pairs})
        logging.info(f"get_latest_quiz: quiz={quiz}")
        return quiz
    except Exception as e:
        logging.error(f"get_latest_quiz: error={e}")
        return {"error": str(e)}