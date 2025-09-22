import os
import time
from typing import Any, Union

from azure.cosmos.aio import ContainerProxy, CosmosClient
from azure.identity.aio import AzureDeveloperCliCredential, ManagedIdentityCredential
from quart import Blueprint, current_app, jsonify, make_response, request

from config import (
    CONFIG_OPENAI_CLIENT,
    CONFIG_CHAT_HISTORY_COSMOS_ENABLED,
    CONFIG_COSMOS_HISTORY_CLIENT,
    CONFIG_COSMOS_HISTORY_CONTAINER,
    CONFIG_COSMOS_HISTORY_VERSION,
    CONFIG_CREDENTIAL,
)
from decorators import authenticated
from error import error_response

chat_history_cosmosdb_bp = Blueprint("chat_history_cosmos", __name__, static_folder="static")


async def generate_chat_title(first_question: str) -> str:
    """
    LLM(OpenAI)을 이용해 30자 이내의 채팅방 제목을 생성합니다.
    """
    import logging
    try:
        openai_client = current_app.config[CONFIG_OPENAI_CLIENT]
        chatgpt_model = os.environ["AZURE_OPENAI_CHATGPT_MODEL"]
        chatgpt_deployment = os.environ.get("AZURE_OPENAI_CHATGPT_DEPLOYMENT")
        prompt = (
            "Summarize the following sentence as a chat room title within 30 characters. "
            "Respond ONLY with the title, no explanation or extra text.\n"
            f"Sentence: {first_question}\nTitle:"
        )
        completion = await openai_client.chat.completions.create(
            model=chatgpt_deployment,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=30,
            temperature=0.2,
        )
        title = completion.choices[0].message.content.strip()
        return title
    except Exception as e:
        logging.error(f"generate_chat_title error: {e}", exc_info=True)
        # 실패 시 fallback
        return first_question[:30]


@chat_history_cosmosdb_bp.post("/chat_history")
@authenticated
async def post_chat_history(auth_claims: dict[str, Any]):
    if not current_app.config[CONFIG_CHAT_HISTORY_COSMOS_ENABLED]:
        return jsonify({"error": "Chat history not enabled"}), 400

    container: ContainerProxy = current_app.config[CONFIG_COSMOS_HISTORY_CONTAINER]
    if not container:
        return jsonify({"error": "Chat history not enabled"}), 400

    entra_oid = auth_claims.get("oid")
    if not entra_oid:
        return jsonify({"error": "User OID not found"}), 401

    try:
        request_json = await request.get_json()
        web_session_id = request_json.get("web_session_id")
        session_id = request_json.get("id")
        message_pairs = request_json.get("answers")
        first_question = message_pairs[0][0]
        # LLM을 이용해 30자 이내의 제목 생성
        title = await generate_chat_title(first_question)
        timestamp = int(time.time() * 1000)

        # Insert the session item:
        session_item = {
            "id": session_id,
            "version": current_app.config[CONFIG_COSMOS_HISTORY_VERSION],
            "web_session_id": web_session_id,
            "session_id": session_id,
            "entra_oid": entra_oid,
            "type": "session",
            "title": title,
            "timestamp": timestamp,
        }

        message_pair_items = []
        # Now insert a message item for each question/response pair:
        for ind, message_pair in enumerate(message_pairs):
            message_pair_items.append(
                {
                    "id": f"{session_id}-{ind}",
                    "version": current_app.config[CONFIG_COSMOS_HISTORY_VERSION],
                    "web_session_id": web_session_id,
                    "session_id": session_id,
                    "entra_oid": entra_oid,
                    "type": "message_pair",
                    "question": message_pair[0],
                    "response": message_pair[1],
                }
            )

        batch_operations = [("upsert", (session_item,))] + [
            ("upsert", (message_pair_item,)) for message_pair_item in message_pair_items
        ]
        await container.execute_item_batch(batch_operations=batch_operations, partition_key=[entra_oid, session_id])
        return jsonify({}), 201
    except Exception as error:
        return error_response(error, "/chat_history")


@chat_history_cosmosdb_bp.post("/ask_history")
@authenticated
async def post_ask_history(auth_claims: dict[str, Any]):
    if not current_app.config[CONFIG_CHAT_HISTORY_COSMOS_ENABLED]:
        return jsonify({"error": "ask history not enabled"}), 400

    # 실제 ask-history-v2 컨테이너를 가져오도록 수정
    cosmos_client: CosmosClient = current_app.config[CONFIG_COSMOS_HISTORY_CLIENT]
    cosmos_db = cosmos_client.get_database_client(os.getenv("AZURE_CHAT_HISTORY_DATABASE"))
    container: ContainerProxy = cosmos_db.get_container_client("ask-history-v2")
    if not container:
        return jsonify({"error": "ask history not enabled"}), 400

    entra_oid = auth_claims.get("oid")
    if not entra_oid:
        return jsonify({"error": "User OID not found"}), 401

    try:
        request_json = await request.get_json()
        session_id = request_json.get("id")
        message_pairs = request_json.get("answers")
        first_question = message_pairs[0][0]
        title = first_question + "..." if len(first_question) > 50 else first_question
        timestamp = int(time.time() * 1000)

        separated_message_pairs = [
            {"input_content": message_pair[0], "response_content": message_pair[1]} for message_pair in message_pairs
        ]

        # Insert the ask_item with message_pairs included:
        ask_item = {
            "id": session_id,
            "version": current_app.config[CONFIG_COSMOS_HISTORY_VERSION],
            "session_id": session_id,
            "entra_oid": entra_oid,
            "type": "ask_item",
            "title": title,
            "timestamp": timestamp,
            "message_pairs": separated_message_pairs,
        }

        # Save the ask_item to the container
        await container.upsert_item(ask_item)
        return jsonify({}), 201
    except Exception as error:
        return error_response(error, "/ask_history")


@chat_history_cosmosdb_bp.post("/quiz_history")
@authenticated
async def post_quiz_history(auth_claims: dict[str, Any]):
    if not current_app.config[CONFIG_CHAT_HISTORY_COSMOS_ENABLED]:
        return jsonify({"error": "Quiz history not enabled"}), 400

    # 실제 quiz-history-v2 컨테이너를 가져오도록 수정
    cosmos_client: CosmosClient = current_app.config[CONFIG_COSMOS_HISTORY_CLIENT]
    cosmos_db = cosmos_client.get_database_client(os.getenv("AZURE_CHAT_HISTORY_DATABASE"))
    container: ContainerProxy = cosmos_db.get_container_client("quiz-history-v2")
    if not container:
        return jsonify({"error": "Quiz history not enabled"}), 400

    entra_oid = auth_claims.get("oid")
    if not entra_oid:
        return jsonify({"error": "User OID not found"}), 401

    try:
        request_json = await request.get_json()
        session_id = request_json.get("id")
        web_session_id = request_json.get("web_session_id")  # web_session_id 가져오기
        quizzes = request_json.get("results")  # savedQuizzes 형태의 데이터
        timestamp = int(time.time() * 1000)

        # 모든 퀴즈 데이터를 하나의 문서로 저장
        quiz_item = {
            "id": session_id,
            "version": current_app.config[CONFIG_COSMOS_HISTORY_VERSION],
            "session_id": session_id,
            "web_session_id": web_session_id,  # web_session_id 추가
            "entra_oid": entra_oid,
            "type": "quiz_item",
            "timestamp": timestamp,
            "quizzes": quizzes,  # 모든 퀴즈 데이터를 포함
        }

        # Batch operations for session and quiz items
        await container.upsert_item(quiz_item) 
        return jsonify({}), 201
    except Exception as error:
        return error_response(error, "/quiz_history")


@chat_history_cosmosdb_bp.get("/chat_history/sessions")
@authenticated
async def get_chat_history_sessions(auth_claims: dict[str, Any]):
    if not current_app.config[CONFIG_CHAT_HISTORY_COSMOS_ENABLED]:
        return jsonify({"error": "Chat history not enabled"}), 400

    container: ContainerProxy = current_app.config[CONFIG_COSMOS_HISTORY_CONTAINER]
    if not container:
        return jsonify({"error": "Chat history not enabled"}), 400

    entra_oid = auth_claims.get("oid")
    if not entra_oid:
        return jsonify({"error": "User OID not found"}), 401

    try:
        count = int(request.args.get("count", 10))
        continuation_token = request.args.get("continuation_token")

        res = container.query_items(
            query="SELECT c.id, c.entra_oid, c.title, c.timestamp FROM c WHERE c.entra_oid = @entra_oid AND c.type = @type ORDER BY c.timestamp DESC",
            parameters=[dict(name="@entra_oid", value=entra_oid), dict(name="@type", value="session")],
            partition_key=[entra_oid],
            max_item_count=count,
        )

        pager = res.by_page(continuation_token)

        # Get the first page, and the continuation token
        sessions = []
        try:
            page = await pager.__anext__()
            continuation_token = pager.continuation_token  # type: ignore

            async for item in page:
                sessions.append(
                    {
                        "id": item.get("id"),
                        "entra_oid": item.get("entra_oid"),
                        "title": item.get("title", "untitled"),
                        "timestamp": item.get("timestamp"),
                    }
                )

        # If there are no more pages, StopAsyncIteration is raised
        except StopAsyncIteration:
            continuation_token = None

        return jsonify({"sessions": sessions, "continuation_token": continuation_token}), 200

    except Exception as error:
        return error_response(error, "/chat_history/sessions")


@chat_history_cosmosdb_bp.get("/chat_history/sessions/<session_id>")
@authenticated
async def get_chat_history_session(auth_claims: dict[str, Any], session_id: str):
    if not current_app.config[CONFIG_CHAT_HISTORY_COSMOS_ENABLED]:
        return jsonify({"error": "Chat history not enabled"}), 400

    container: ContainerProxy = current_app.config[CONFIG_COSMOS_HISTORY_CONTAINER]
    if not container:
        return jsonify({"error": "Chat history not enabled"}), 400

    entra_oid = auth_claims.get("oid")
    if not entra_oid:
        return jsonify({"error": "User OID not found"}), 401

    try:
        res = container.query_items(
            query="SELECT * FROM c WHERE c.session_id = @session_id AND c.type = @type",
            parameters=[dict(name="@session_id", value=session_id), dict(name="@type", value="message_pair")],
            partition_key=[entra_oid, session_id],
        )

        message_pairs = []
        async for page in res.by_page():
            async for item in page:
                message_pairs.append([item["question"], item["response"]])

        return (
            jsonify(
                {
                    "id": session_id,
                    "entra_oid": entra_oid,
                    "answers": message_pairs,
                }
            ),
            200,
        )
    except Exception as error:
        return error_response(error, f"/chat_history/sessions/{session_id}")


@chat_history_cosmosdb_bp.delete("/chat_history/sessions/<session_id>")
@authenticated
async def delete_chat_history_session(auth_claims: dict[str, Any], session_id: str):
    if not current_app.config[CONFIG_CHAT_HISTORY_COSMOS_ENABLED]:
        return jsonify({"error": "Chat history not enabled"}), 400

    container: ContainerProxy = current_app.config[CONFIG_COSMOS_HISTORY_CONTAINER]
    if not container:
        return jsonify({"error": "Chat history not enabled"}), 400

    entra_oid = auth_claims.get("oid")
    if not entra_oid:
        return jsonify({"error": "User OID not found"}), 401

    try:
        res = container.query_items(
            query="SELECT c.id FROM c WHERE c.session_id = @session_id",
            parameters=[dict(name="@session_id", value=session_id)],
            partition_key=[entra_oid, session_id],
        )

        ids_to_delete = []
        async for page in res.by_page():
            async for item in page:
                ids_to_delete.append(item["id"])

        batch_operations = [("delete", (id,)) for id in ids_to_delete]
        await container.execute_item_batch(batch_operations=batch_operations, partition_key=[entra_oid, session_id])
        return await make_response("", 204)
    except Exception as error:
        return error_response(error, f"/chat_history/sessions/{session_id}")


@chat_history_cosmosdb_bp.before_app_serving
async def setup_clients():
    USE_CHAT_HISTORY_COSMOS = os.getenv("USE_CHAT_HISTORY_COSMOS", "").lower() == "true"
    AZURE_COSMOSDB_ACCOUNT = os.getenv("AZURE_COSMOSDB_ACCOUNT")
    AZURE_CHAT_HISTORY_DATABASE = os.getenv("AZURE_CHAT_HISTORY_DATABASE")
    AZURE_CHAT_HISTORY_CONTAINER = os.getenv("AZURE_CHAT_HISTORY_CONTAINER")

    azure_credential: Union[AzureDeveloperCliCredential, ManagedIdentityCredential] = current_app.config[
        CONFIG_CREDENTIAL
    ]

    if USE_CHAT_HISTORY_COSMOS:
        current_app.logger.info("USE_CHAT_HISTORY_COSMOS is true, setting up CosmosDB client")
        if not AZURE_COSMOSDB_ACCOUNT:
            raise ValueError("AZURE_COSMOSDB_ACCOUNT must be set when USE_CHAT_HISTORY_COSMOS is true")
        if not AZURE_CHAT_HISTORY_DATABASE:
            raise ValueError("AZURE_CHAT_HISTORY_DATABASE must be set when USE_CHAT_HISTORY_COSMOS is true")
        if not AZURE_CHAT_HISTORY_CONTAINER:
            raise ValueError("AZURE_CHAT_HISTORY_CONTAINER must be set when USE_CHAT_HISTORY_COSMOS is true")
        cosmos_client = CosmosClient(
            url=f"https://{AZURE_COSMOSDB_ACCOUNT}.documents.azure.com:443/", credential=azure_credential
        )
        cosmos_db = cosmos_client.get_database_client(AZURE_CHAT_HISTORY_DATABASE)
        cosmos_container = cosmos_db.get_container_client(AZURE_CHAT_HISTORY_CONTAINER)

        current_app.config[CONFIG_COSMOS_HISTORY_CLIENT] = cosmos_client
        current_app.config[CONFIG_COSMOS_HISTORY_CONTAINER] = cosmos_container
        current_app.config[CONFIG_COSMOS_HISTORY_VERSION] = os.environ["AZURE_CHAT_HISTORY_VERSION"]


@chat_history_cosmosdb_bp.after_app_serving
async def close_clients():
    if current_app.config.get(CONFIG_COSMOS_HISTORY_CLIENT):
        cosmos_client: CosmosClient = current_app.config[CONFIG_COSMOS_HISTORY_CLIENT]
        await cosmos_client.close()
