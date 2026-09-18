import numpy as np

class QueueSimulator:
    def simulate_scenario(self, current_waiting: int, active_counters: int, additional_counters: int, 
                          avg_service_time_mins: float, arrival_surge_pct: float = 0.0):
        """Simulates queue dynamics when changing counter capacity or customer arrival rate."""
        total_counters = max(1, active_counters + additional_counters)
        surge_multiplier = 1.0 + (arrival_surge_pct / 100.0)

        # Baseline baseline without extra counters
        base_service_rate = active_counters / max(0.1, avg_service_time_mins) # customers per min
        projected_service_rate = total_counters / max(0.1, avg_service_time_mins) # customers per min

        # Adjusted queue length considering surge
        simulated_queue_length = int(current_waiting * surge_multiplier)

        # Estimated wait time calculations
        baseline_wait_mins = round((current_waiting / max(0.1, base_service_rate)), 1)
        simulated_wait_mins = round((simulated_queue_length / max(0.1, projected_service_rate)), 1)

        # Time saved
        time_saved_mins = max(0.0, round(baseline_wait_mins - simulated_wait_mins, 1))
        reduction_pct = round(((baseline_wait_mins - simulated_wait_mins) / max(0.1, baseline_wait_mins)) * 100, 1) if baseline_wait_mins > 0 else 0.0

        throughput_per_hour = round(projected_service_rate * 60, 1)

        bottleneck_warning = None
        if simulated_wait_mins > 30:
            bottleneck_warning = "HIGH BOTTLENECK ALERT: Wait time exceeds 30 minutes. Recommend adding +2 more counters."
        elif reduction_pct > 40:
            bottleneck_warning = "OPTIMAL CAPACITY: Significant wait time reduction achieved with current proposed setup."

        return {
            "current_active_counters": active_counters,
            "proposed_total_counters": total_counters,
            "additional_counters_added": additional_counters,
            "arrival_surge_pct": arrival_surge_pct,
            "simulated_queue_length": simulated_queue_length,
            "baseline_avg_wait_mins": baseline_wait_mins,
            "simulated_avg_wait_mins": simulated_wait_mins,
            "time_saved_mins": time_saved_mins,
            "wait_time_reduction_pct": max(0.0, reduction_pct),
            "projected_throughput_per_hour": throughput_per_hour,
            "bottleneck_warning": bottleneck_warning
        }

queue_simulator = QueueSimulator()
