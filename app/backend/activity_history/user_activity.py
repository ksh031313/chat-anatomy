from typing import Any
import pyodbc
from datetime import datetime
from pytz import timezone
from quart import Blueprint, request, current_app
from decorators import authenticated
from error import error_response
import logging
import uuid  # 추가

# Database connection configuration
DB_SERVER = 'dbs-anatomy-01.database.windows.net'
DB_NAME = 'db-anatomy-01'
DB_AUTHENTICATION = 'ActiveDirectoryMsi'
DB_ENCRYPT = 'yes'

activity_history_bp = Blueprint("activity_history", __name__)
logging.basicConfig(level=logging.INFO)  # Set log level to INFO 

def get_db_connection():
    """Establish a connection to the Azure SQL Database using Managed Identity."""
    connection_string = (
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={DB_SERVER};"
        f"DATABASE={DB_NAME};"
        f"Authentication={DB_AUTHENTICATION};"
        f"Encrypt={DB_ENCRYPT};"
    )
    try:
        return pyodbc.connect(connection_string)
    except pyodbc.Error as e:
        logging.error(f"Database connection failed: {e}")
        # Return None or raise a custom exception to handle the error gracefully
        return None

@activity_history_bp.post("/user_activity")
@authenticated
async def post_user_activity(auth_claims: dict[str, Any]):
    """Save user activity to the Azure SQL Database."""
    conn = None
    try:
        logging.info(f"post_user_activity: auth_claims={auth_claims}")
        user_id = auth_claims.get("oid")
        request_json = await request.get_json()
        page = request_json.get("page")
        activity_type = request_json.get("activity_type")
        activity_content = request_json.get("activity_content")
        web_session_id = request_json.get("web_session_id")

        # sessionId가 없으면 UUID 생성
        if not web_session_id:
            web_session_id = str(uuid.uuid4())
            logging.info(f"Generated new web_session_id: {web_session_id}")

        seoul_tz = timezone('Asia/Seoul')
        activity_time = datetime.now(seoul_tz).strftime('%Y-%m-%d %H:%M:%S')

        conn = get_db_connection()
        if conn is None:
            # Handle the case where the database connection failed
            return {"message": "Failed to connect to the database. Please try again later."}, 500

        cursor = conn.cursor()

        insert_query = """
        INSERT INTO user_activity (user_id, web_session_id, page, activity_type, activity_content, activity_time)
        VALUES (?, ?, ?, ?, ?, ?)
        """
        cursor.execute(insert_query, (user_id, web_session_id, page, activity_type, activity_content, activity_time))
        conn.commit()

        # web_session_id를 응답에 포함
        return {"message": "User activity saved successfully.", "web_session_id": web_session_id}, 201

    except Exception as e:
        current_app.logger.error(f"An error occurred while saving user activity: {e}")
        return error_response(str(e), "/user_activity")

    finally:
        if conn:
            conn.close()