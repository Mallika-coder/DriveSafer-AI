# Alert manager logic could reside here if backend processes frames and triggers alerts

class AlertManager:
    def __init__(self):
        self.cooldown_period = 10 # seconds
        self.last_alert_time = {}

    def should_trigger_alert(self, alert_type: str, current_time: float):
        last_time = self.last_alert_time.get(alert_type, 0)
        if current_time - last_time > self.cooldown_period:
            self.last_alert_time[alert_type] = current_time
            return True
        return False
