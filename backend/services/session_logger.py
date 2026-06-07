# Session logger could encapsulate the logic of writing robust logs to DB instead of the router

class SessionLogger:
    @staticmethod
    def log_event(db_session, session_id, event_type, severity, ear_value=None):
        pass
