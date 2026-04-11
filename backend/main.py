import argparse
import os

import uvicorn


def run_server():
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    reload_enabled = os.getenv("RELOAD", "false").lower() in {"1", "true", "yes"}
    uvicorn.run(
        "app.main:app", host=host, port=port, reload=reload_enabled, log_level="info"
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Semantic Search backend utilities")
    subparsers = parser.add_subparsers(dest="command")

    serve_parser = subparsers.add_parser("serve", help="Run the FastAPI server")
    serve_parser.set_defaults(handler=lambda _args: run_server())

    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()
    if args.command is None:
        run_server()
        return
    args.handler(args)


if __name__ == "__main__":
    main()
