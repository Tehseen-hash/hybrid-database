from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import random
import datetime
import os

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

def random_in(min_val, max_val):
    return round(random.uniform(min_val, max_val), 2)

@app.route('/api/telemetry', methods=['GET'])
def get_telemetry():
    tick = int(request.args.get('tick', 0))
    spike = (tick % 40 > 30)

    data = {
        'timestamp': datetime.datetime.now().isoformat(),
        'tick': tick,
        'spike': spike,
        'cpu': random_in(28, 92 if spike else 60),
        'memory': random_in(35, 88 if spike else 65),
        'io': random_in(15, 85 if spike else 55),
        'network': random_in(20, 70),
        'qps': random_in(800, 1400) if spike else random_in(200, 600),
        'nodes': [
            {'id': 1, 'status': 'active', 'load': random_in(20, 70)},
            {'id': 2, 'status': 'active', 'load': random_in(20, 70)},
            {'id': 3, 'status': 'active', 'load': random_in(20, 70)},
            {'id': 4, 'status': 'overload' if spike else 'active', 'load': random_in(60, 100)},
            {'id': 5, 'status': 'migrating' if spike else 'active', 'load': random_in(10, 40)},
            {'id': 6, 'status': 'active', 'load': random_in(20, 70)},
            {'id': 7, 'status': 'active', 'load': random_in(20, 70)},
            {'id': 8, 'status': 'active', 'load': random_in(20, 70)},
        ],
        'lstm_prediction': random_in(28, 95 if spike else 65),
        'migration_active': spike,
    }
    return jsonify(data)

@app.route('/api/latency', methods=['GET'])
def get_latency():
    latency_data = [
        {'op': 'SELECT', 'sw': 8.2, 'hw': 1.2},
        {'op': 'JOIN', 'sw': 7.5, 'hw': 3.0},
        {'op': 'UPDATE', 'sw': 8.8, 'hw': 3.6},
    ]

    results = []
    total_sw_time = 0
    total_hw_time = 0

    for row in latency_data:
        reduction = round(((row['sw'] - row['hw']) / row['sw']) * 100, 1)
        total_sw_time += row['sw']
        total_hw_time += row['hw']
        results.append({
            'operation': row['op'],
            'sw_latency_ms': row['sw'],
            'hw_latency_ms': row['hw'],
            'reduction_pct': reduction,
            'speedup_factor': round(row['sw'] / row['hw'], 2),
        })

    avg_sw = round(total_sw_time / len(latency_data), 2)
    avg_hw = round(total_hw_time / len(latency_data), 2)
    avg_red = round(((avg_sw - avg_hw) / avg_sw) * 100, 1)
    speed_ratio = round(avg_sw / avg_hw, 2)

    migration = {
        'baseline_moves': 41,
        'hisdbaas_moves': 12,
        'reduction_pct': round(((41 - 12) / 41) * 100, 1),
        'stability_score': 88,
        'efficiency_score': 94,
    }

    return jsonify({
        'query_latency': results,
        'summary': {
            'avg_sw_ms': avg_sw,
            'avg_hw_ms': avg_hw,
            'avg_reduction': avg_red,
            'speed_ratio': speed_ratio,
        },
        'migration': migration,
        'generated_at': datetime.datetime.now().isoformat(),
    })

@app.route('/api/cluster', methods=['GET'])
def get_cluster():
    node_count = 8
    nodes = []
    statuses = ['active', 'active', 'active', 'active', 'active', 'active', 'migrating', 'overload']
    random.shuffle(statuses)

    for i in range(node_count):
        status = statuses[i]
        if status == 'overload':
            load = random_in(85, 100)
        elif status == 'migrating':
            load = random_in(40, 65)
        else:
            load = random_in(20, 70)

        nodes.append({
            'id': i + 1,
            'name': f"Node-{i + 1}",
            'status': status,
            'cpu': load,
            'memory': random_in(30, 80),
            'disk_io': random_in(10, 60),
            'qps': int(random_in(50, 300)),
            'region': f"DC-{chr(65 + (i % 3))}",
        })

    active_count = sum(1 for n in nodes if n['status'] == 'active')
    migrating_count = sum(1 for n in nodes if n['status'] == 'migrating')
    overload_count = sum(1 for n in nodes if n['status'] == 'overload')

    return jsonify({
        'cluster_summary': {
            'total_nodes': node_count,
            'active': active_count,
            'migrating': migrating_count,
            'overloaded': overload_count,
            'sla_compliance': round((active_count / node_count) * 100, 1),
            'cluster_health': 'healthy' if overload_count == 0 else 'degraded',
        },
        'nodes': nodes,
        'timestamp': datetime.datetime.now().isoformat(),
    })

@app.route('/api/simulation', methods=['GET'])
def get_simulation():
    tick = int(request.args.get('tick', 0))
    spike = (tick % 40) > 28

    ops = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'JOIN']
    queries = []
    for i in range(5):
        op = random.choice(ops)
        sw = random_in(7.0, 9.5)
        hw = random_in(1.0, 4.0)
        queries.append({
            'id': i + 1,
            'operation': op,
            'tenant': f"Tenant-{chr(65 + i)}",
            'sw_ms': sw,
            'hw_ms': hw,
            'reduction': round(((sw - hw) / sw) * 100, 1),
            'abac_pass': True,
            'tee_used': True,
        })

    current_load = random_in(28, 90 if spike else 60)
    predicted = min(100, current_load + random_in(-5, 20 if spike else 5))

    mig_event = {
        'triggered': True,
        'source_node': f"Node-{random.randint(1, 8)}",
        'target_node': f"Node-{random.randint(1, 8)}",
        'reason': 'Predicted overload (LSTM)',
        'eta_ms': random.randint(200, 800),
    } if spike else {'triggered': False}

    return jsonify({
        'tick': tick,
        'spike_active': spike,
        'telemetry': {
            'cpu': current_load,
            'memory': random_in(35, 88 if spike else 65),
            'io': random_in(15, 80 if spike else 50),
            'network': random_in(20, 70),
            'qps': int(random_in(800, 1400) if spike else random_in(200, 600)),
        },
        'lstm': {
            'current_load': current_load,
            'predicted_load': predicted,
            'confidence': random_in(88, 98),
            'horizon_seconds': random.randint(30, 120),
            'alert': predicted > 75,
        },
        'queries': queries,
        'migration': mig_event,
        'security': {
            'abac_mode': 'hardware_dpu',
            'avg_auth_ms': random_in(0.8, 1.5),
            'zero_trust_level': 'enforced',
            'tee_status': 'active',
        },
        'timestamp': datetime.datetime.now().isoformat(),
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
