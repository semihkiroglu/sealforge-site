#!/usr/bin/env python3
"""Run the real browser matrix against a task-owned loopback HTTP server."""
import argparse
import functools
import http.server
import os
from pathlib import Path
import subprocess
import threading


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--evidence', required=True)
    parser.add_argument('--test', default='tests/site.test.cjs')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    output = Path(args.evidence).resolve()
    output.mkdir(parents=True, exist_ok=True)

    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, format, *args):
            pass

    handler = functools.partial(QuietHandler, directory=str(root))
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    worker = threading.Thread(target=server.serve_forever, daemon=True)
    worker.start()
    env = dict(os.environ, SITE_URL=f'http://127.0.0.1:{server.server_port}/', SITE_EVIDENCE=str(output))
    try:
        return subprocess.run(['node', args.test], cwd=root, env=env, check=False).returncode
    finally:
        server.shutdown()
        server.server_close()
        worker.join(timeout=5)


if __name__ == '__main__':
    raise SystemExit(main())
