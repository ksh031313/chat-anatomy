import pyodbc
from datetime import datetime
from pytz import timezone
from quart import Blueprint, request, current_app
from decorators import authenticated
from error import error_response

# Database connection configuration
DB_SERVER = 'dbs-anatomy-01.database.windows.net'
DB_NAME = 'db-anatomy-01'
DB_AUTHENTICATION = 'Active Directory Managed Identity'
DB_ENCRYPT = True

activity_history_bp = Blueprint("activity_history", __name__)

def get_db_connection():
    """Establish a connection to the Azure SQL Database using Managed Identity."""
    connection_string = (
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={DB_SERVER};"
        f"DATABASE={DB_NAME};"
        f"Authentication={DB_AUTHENTICATION};"
        f"Encrypt={DB_ENCRYPT};"
    )
    return pyodbc.connect(connection_string)

@activity_history_bp.post("/user_activity")
@authenticated
async def post_user_activity(auth_claims):
    """Save user activity to the Azure SQL Database."""
    conn = None
    try:
        # Extract user_id from auth_claims
        user_id = auth_claims.get("oid")

        # Parse request JSON
        request_json = await request.get_json()
        page = request_json.get("page")
        activity_type = request_json.get("activityType")
        activity_content = request_json.get("activityContent")
        # Extract session_id from request JSON
        session_id = request_json.get("session_id")

        if not user_id or not session_id:
            return error_response("Missing user_id or session_id", "/user_activity")

        if not page or not activity_type or not activity_content:
            return error_response("Missing required activity fields", "/user_activity")

        # Set the activity time on the backend
        seoul_tz = timezone('Asia/Seoul')
        activity_time = datetime.now(seoul_tz).strftime('%Y-%m-%d %H:%M:%S')

        # Save to the database
        conn = get_db_connection()
        cursor = conn.cursor()

        insert_query = """
        INSERT INTO user_activity (userId, sessionId, page, activityType, activityContent, activityTime)
        VALUES (?, ?, ?, ?, ?, ?)
        """
        cursor.execute(insert_query, (user_id, session_id, page, activity_type, activity_content, activity_time))
        conn.commit()

        return {"message": "User activity saved successfully."}, 201

    except Exception as e:
        current_app.logger.error(f"An error occurred while saving user activity: {e}")
        return error_response(str(e), "/user_activity")

    finally:
        if conn:
            conn.close()