import json
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, AsyncIterator
from uuid import uuid4

import httpx
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import Response, StreamingResponse

app = FastAPI(title="Claude CLI Main/Fallback Proxy")


def env_first(*names: str, default: str = "") -> str:
    for name in names:
        value = os.getenv(name)
        if value:
            return value
    return default


def load_claude_settings_env() -> dict[str, str]:
    settings_files = [
        Path.home() / ".claude" / "settings.local.json",
        Path.home() / ".claude" / "settings.json",
    ]

    for settings_file in settings_files:
        try:
            if not settings_file.exists():
                continue
            data = json.loads(settings_file.read_text(encoding="utf-8"))
            env_data = data.get("env", {})
            if isinstance(env_data, dict) and env_data:
                return {str(key): str(value) for key, value in env_data.items()}
        except Exception:
            continue

    return {}


CLAUDE_SETTINGS_ENV = load_claude_settings_env()


def settings_or_env(*names: str, default: str = "") -> str:
    for name in names:
        value = os.getenv(name)
        if value:
            return value
        settings_value = CLAUDE_SETTINGS_ENV.get(name)
        if settings_value:
            return settings_value
    return default


def load_codex_auth() -> dict[str, str]:
    auth_file = Path.home() / ".codex" / "auth.json"
    try:
        if auth_file.exists():
            data = json.loads(auth_file.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                return {str(key): str(value) for key, value in data.items()}
    except Exception:
        pass
    return {}


CODEX_AUTH = load_codex_auth()


def codex_auth_or_env(*names: str, default: str = "") -> str:
    for name in names:
        value = os.getenv(name)
        if value:
            return value
        auth_value = CODEX_AUTH.get(name)
        if auth_value:
            return auth_value
    return default


def csv_values(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


PRIMARY_PROVIDER_NAME = env_first("AUTO_SWITCH_PRIMARY_PROVIDER_NAME", default="codex/responses")
PRIMARY_API_KEY = codex_auth_or_env("AUTO_SWITCH_PRIMARY_API_KEY", "OPENAI_API_KEY")
PRIMARY_BASE_URL = env_first("AUTO_SWITCH_PRIMARY_BASE_URL", "OPENAI_BASE_URL", default="https://ai.0707007.xyz/v1")
PRIMARY_MODEL = env_first("AUTO_SWITCH_PRIMARY_MODEL", "TARGET_MODEL", default="gpt-5.4")
PRIMARY_REASONING_EFFORT = env_first("AUTO_SWITCH_PRIMARY_REASONING_EFFORT", default="xhigh")
PRIMARY_TEXT_VERBOSITY = env_first("AUTO_SWITCH_PRIMARY_TEXT_VERBOSITY", default="low")
PRIMARY_TOOL_CHOICE_ANY_MODE = env_first("AUTO_SWITCH_PRIMARY_TOOL_CHOICE_ANY_MODE", default="auto").strip().lower()
PRIMARY_DEFAULT_INSTRUCTIONS = env_first(
    "AUTO_SWITCH_PRIMARY_DEFAULT_INSTRUCTIONS",
    default="You are a helpful assistant. Use the available tools when needed and answer the user's request directly.",
)
PRIMARY_INCLUDE = csv_values(env_first("AUTO_SWITCH_PRIMARY_INCLUDE", default="reasoning.encrypted_content"))
PRIMARY_ORIGINATOR = env_first("AUTO_SWITCH_PRIMARY_ORIGINATOR", default="codex_exec")
PRIMARY_USER_AGENT = env_first(
    "AUTO_SWITCH_PRIMARY_USER_AGENT",
    default="codex_exec/0.120.0 (Mac OS 15.7.4; x86_64) vscode/1.115.0 (codex_exec; 0.120.0)",
)
PRIMARY_SANDBOX = env_first("AUTO_SWITCH_PRIMARY_SANDBOX", default="seatbelt")
PRIMARY_WINDOW_SUFFIX = env_first("AUTO_SWITCH_PRIMARY_WINDOW_SUFFIX", default="0")
PRIMARY_INSTALLATION_ID = env_first("AUTO_SWITCH_PRIMARY_INSTALLATION_ID", default="")
PRIMARY_PARALLEL_TOOL_CALLS = env_first("AUTO_SWITCH_PRIMARY_PARALLEL_TOOL_CALLS", default="1").strip().lower() in {
    "1",
    "true",
    "yes",
    "on",
}
PRIMARY_SEND_TEMPERATURE = env_first("AUTO_SWITCH_PRIMARY_SEND_TEMPERATURE", default="0").strip().lower() in {
    "1",
    "true",
    "yes",
    "on",
}
PRIMARY_SEND_MAX_OUTPUT_TOKENS = env_first("AUTO_SWITCH_PRIMARY_SEND_MAX_OUTPUT_TOKENS", default="0").strip().lower() in {
    "1",
    "true",
    "yes",
    "on",
}
PRIMARY_REASONING_CACHE: dict[str, str] = {}

CLAUDE_API_KEY = settings_or_env("CLAUDE_API_KEY", "ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN")
CLAUDE_BASE_URL = settings_or_env("CLAUDE_BASE_URL", "ANTHROPIC_BASE_URL", default="https://ai.0707007.xyz")
FALLBACK_CLAUDE_MODEL = env_first("AUTO_SWITCH_FALLBACK_CLAUDE_MODEL", "BACKUP_CLAUDE_MODEL", default="claude-opus-4-6")

TIMEOUT_SECONDS = float(os.getenv("AUTO_SWITCH_PROXY_TIMEOUT", "30.0"))
STREAM_TIMEOUT_SECONDS = float(os.getenv("AUTO_SWITCH_PROXY_STREAM_TIMEOUT", "300.0"))
HOST = os.getenv("AUTO_SWITCH_PROXY_HOST", "127.0.0.1")
PORT = int(os.getenv("AUTO_SWITCH_PROXY_PORT", "4000"))
DEBUG = os.getenv("AUTO_SWITCH_PROXY_DEBUG", "0").strip().lower() in {"1", "true", "yes", "on"}
DEBUG_CLIP_LIMIT = int(os.getenv("AUTO_SWITCH_PROXY_DEBUG_CLIP", "320"))

CLAUDE_CODE_COMPAT_ENABLED = os.getenv("AUTO_SWITCH_PROXY_CLAUDE_COMPAT", "1").strip().lower() in {"1", "true", "yes", "on"}
CLAUDE_CODE_COMPAT_SESSION_ID = os.getenv("CLAUDE_CODE_COMPAT_SESSION_ID", str(uuid4()))
CLAUDE_CODE_COMPAT_USER_AGENT = os.getenv("CLAUDE_CODE_COMPAT_USER_AGENT", "claude-cli/2.1.109 (external, sdk-cli)")
CLAUDE_CODE_COMPAT_APP = os.getenv("CLAUDE_CODE_COMPAT_APP", "cli")
CLAUDE_CODE_COMPAT_BROWSER_ACCESS = os.getenv("CLAUDE_CODE_COMPAT_BROWSER_ACCESS", "true")
CLAUDE_CODE_COMPAT_BETAS_DEFAULT = os.getenv(
    "CLAUDE_CODE_COMPAT_BETAS_DEFAULT",
    "claude-code-20250219,interleaved-thinking-2025-05-14,context-management-2025-06-27,prompt-caching-scope-2026-01-05,effort-2025-11-24",
)
CLAUDE_CODE_COMPAT_BETAS_HAIKU = os.getenv(
    "CLAUDE_CODE_COMPAT_BETAS_HAIKU",
    "interleaved-thinking-2025-05-14,context-management-2025-06-27,prompt-caching-scope-2026-01-05,structured-outputs-2025-12-15",
)


class PrimaryRouteBypass(Exception):
    def __init__(self, reason: str):
        super().__init__(reason)
        self.reason = reason


class PrimaryRouteUnavailable(Exception):
    def __init__(self, reason: str):
        super().__init__(reason)
        self.reason = reason


@dataclass(slots=True)
class AnthropicRequestContext:
    request_id: str
    body: dict[str, Any]
    requested_model: str
    query_params: dict[str, str]
    stream: bool
    primary_session_id: str
    primary_turn_id: str


def build_timeout(stream: bool = False) -> httpx.Timeout:
    read_timeout = STREAM_TIMEOUT_SECONDS if stream else TIMEOUT_SECONDS
    connect_timeout = min(TIMEOUT_SECONDS, 15.0)
    return httpx.Timeout(connect=connect_timeout, read=read_timeout, write=TIMEOUT_SECONDS, pool=TIMEOUT_SECONDS)


def redact_secret(value: str) -> str:
    if len(value) <= 8:
        return "***"
    return f"{value[:4]}...{value[-4:]}"


def sanitize_headers(headers: Any) -> dict[str, str]:
    sanitized: dict[str, str] = {}
    for key, value in headers.items():
        lower_key = key.lower()
        if lower_key in {"authorization", "x-api-key", "anthropic-auth-token", "cookie"}:
            sanitized[key] = redact_secret(str(value))
        else:
            sanitized[key] = str(value)
    return sanitized


def clip_text(value: Any, limit: int | None = None) -> str:
    effective_limit = DEBUG_CLIP_LIMIT if limit is None else limit
    text = value if isinstance(value, str) else json.dumps(value, ensure_ascii=False)
    if len(text) <= effective_limit:
        return text
    return f"{text[:effective_limit]}...(truncated)"


def debug_log(event: str, **fields: Any) -> None:
    if not DEBUG:
        return

    payload = " ".join(f"{key}={clip_text(value)}" for key, value in fields.items())
    print(f"[auto-switch][debug] {event} {payload}")


def ensure_content_blocks(content: Any) -> list[Any]:
    if content is None:
        return []
    if isinstance(content, list):
        return content
    if isinstance(content, str):
        return [{"type": "text", "text": content}]
    return [content]


def normalize_text_content(content: Any) -> str:
    if content is None:
        return ""

    if isinstance(content, str):
        return content

    if isinstance(content, list):
        parts = [normalize_text_content(item) for item in content]
        return "\n".join(part for part in parts if part)

    if isinstance(content, dict):
        block_type = content.get("type")
        if block_type == "text":
            return str(content.get("text", ""))
        if block_type == "tool_result":
            return normalize_text_content(content.get("content", ""))
        if block_type in {"thinking", "redacted_thinking"}:
            return ""
        return json.dumps(content, ensure_ascii=False)

    return str(content)


def unsupported_block_reason(block: Any) -> str | None:
    if isinstance(block, str):
        return None
    if not isinstance(block, dict):
        return None

    block_type = str(block.get("type", "text"))
    if block_type in {"text", "tool_use", "tool_result", "thinking", "redacted_thinking"}:
        return None
    return f"content block type '{block_type}' is not supported on the primary route"


def validate_primary_route_supported(data: dict[str, Any]) -> None:
    for block in ensure_content_blocks(data.get("system")):
        reason = unsupported_block_reason(block)
        if reason:
            raise PrimaryRouteBypass(f"system {reason}")

    for message in data.get("messages", []):
        if not isinstance(message, dict):
            raise PrimaryRouteBypass("message entry is not a JSON object")
        for block in ensure_content_blocks(message.get("content")):
            reason = unsupported_block_reason(block)
            if reason:
                raise PrimaryRouteBypass(reason)

    for tool in data.get("tools", []) or []:
        if not isinstance(tool, dict):
            raise PrimaryRouteBypass("tool definition is not a JSON object")
        schema = tool.get("input_schema", {})
        if schema and not isinstance(schema, dict):
            raise PrimaryRouteBypass("tool input_schema is not a JSON object")

    tool_choice = data.get("tool_choice")
    if tool_choice and not isinstance(tool_choice, (str, dict)):
        raise PrimaryRouteBypass("tool_choice format is not supported on the primary route")


def build_openai_chat_url(base_url: str) -> str:
    trimmed = base_url.rstrip("/")
    if trimmed.endswith("/v1"):
        return f"{trimmed}/chat/completions"
    return f"{trimmed}/v1/chat/completions"


def build_claude_messages_url(base_url: str) -> str:
    trimmed = base_url.rstrip("/")
    if trimmed.endswith("/v1"):
        return f"{trimmed}/messages"
    return f"{trimmed}/v1/messages"


def header_name_set(headers: dict[str, str]) -> set[str]:
    return {key.lower() for key in headers}


def ensure_header(headers: dict[str, str], lower_names: set[str], name: str, value: str) -> None:
    if not value:
        return
    lower_name = name.lower()
    if lower_name in lower_names:
        return
    headers[name] = value
    lower_names.add(lower_name)


def replace_header(headers: dict[str, str], name: str, value: str) -> None:
    lower_name = name.lower()
    for existing_name in list(headers):
        if existing_name.lower() == lower_name:
            del headers[existing_name]
    headers[name] = value


def build_claude_compat_beta_header(requested_model: str) -> str:
    lowered_model = requested_model.lower()
    if "haiku" in lowered_model:
        return CLAUDE_CODE_COMPAT_BETAS_HAIKU
    return CLAUDE_CODE_COMPAT_BETAS_DEFAULT


def apply_claude_code_compat_headers(headers: dict[str, str], requested_model: str) -> None:
    if not CLAUDE_CODE_COMPAT_ENABLED:
        return

    lower_names = header_name_set(headers)
    ensure_header(headers, lower_names, "x-app", CLAUDE_CODE_COMPAT_APP)
    ensure_header(headers, lower_names, "User-Agent", CLAUDE_CODE_COMPAT_USER_AGENT)
    ensure_header(headers, lower_names, "x-claude-code-session-id", CLAUDE_CODE_COMPAT_SESSION_ID)
    ensure_header(headers, lower_names, "anthropic-dangerous-direct-browser-access", CLAUDE_CODE_COMPAT_BROWSER_ACCESS)
    ensure_header(headers, lower_names, "anthropic-beta", build_claude_compat_beta_header(requested_model))


def build_claude_forward_headers(request: Request, requested_model: str) -> dict[str, str]:
    excluded = {"host", "content-length", "accept-encoding", "connection"}
    headers: dict[str, str] = {}
    for key, value in request.headers.items():
        if key.lower() in excluded:
            continue
        headers[key] = value

    lower_names = header_name_set(headers)
    ensure_header(headers, lower_names, "x-api-key", CLAUDE_API_KEY)
    ensure_header(headers, lower_names, "Authorization", f"Bearer {CLAUDE_API_KEY}" if CLAUDE_API_KEY else "")
    ensure_header(headers, lower_names, "anthropic-version", "2023-06-01")
    apply_claude_code_compat_headers(headers, requested_model)
    replace_header(headers, "Content-Type", "application/json")
    return headers


def sanitize_query_params(request: Request) -> dict[str, str]:
    allowed_params: dict[str, str] = {}
    for key, value in request.query_params.multi_items():
        if key.lower() in {"timeout"}:
            allowed_params[key] = value
    return allowed_params


def build_request_context(request: Request, data: dict[str, Any]) -> AnthropicRequestContext:
    return AnthropicRequestContext(
        request_id=uuid4().hex[:8],
        body=data,
        requested_model=str(data.get("model", FALLBACK_CLAUDE_MODEL)),
        query_params=sanitize_query_params(request),
        stream=bool(data.get("stream")),
        primary_session_id=str(uuid4()),
        primary_turn_id=str(uuid4()),
    )


def build_responses_url(base_url: str) -> str:
    trimmed = base_url.rstrip("/")
    if trimmed.endswith("/v1"):
        return f"{trimmed}/responses"
    return f"{trimmed}/v1/responses"


def build_primary_headers(context: AnthropicRequestContext) -> dict[str, str]:
    if not PRIMARY_API_KEY:
        raise PrimaryRouteUnavailable("primary API key is not configured")

    turn_metadata = {
        "session_id": context.primary_session_id,
        "turn_id": context.primary_turn_id,
        "sandbox": PRIMARY_SANDBOX,
    }

    return {
        "Authorization": f"Bearer {PRIMARY_API_KEY}",
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
        "User-Agent": PRIMARY_USER_AGENT,
        "Originator": PRIMARY_ORIGINATOR,
        "Session_id": context.primary_session_id,
        "X-Client-Request-Id": context.primary_session_id,
        "X-Codex-Turn-Metadata": json.dumps(turn_metadata, separators=(",", ":")),
        "X-Codex-Window-Id": f"{context.primary_session_id}:{PRIMARY_WINDOW_SUFFIX}",
    }


def message_content_type_for_role(role: str) -> str:
    return "output_text" if role == "assistant" else "input_text"


def flush_responses_message_item(target: list[dict[str, Any]], role: str, text_parts: list[str]) -> None:
    if not text_parts:
        return
    target.append(
        {
            "type": "message",
            "role": role,
            "content": [
                {
                    "type": message_content_type_for_role(role),
                    "text": "\n".join(text_parts),
                }
            ],
        }
    )
    text_parts.clear()


def build_function_call_item(block: dict[str, Any]) -> dict[str, Any]:
    raw_input = block.get("input", {})
    if isinstance(raw_input, str):
        arguments = raw_input
    else:
        arguments = json.dumps(raw_input, ensure_ascii=False)
    return {
        "type": "function_call",
        "name": str(block.get("name", "tool")),
        "arguments": arguments,
        "call_id": str(block.get("id") or f"call_{uuid4().hex[:12]}"),
    }


def build_reasoning_item(encrypted_content: str) -> dict[str, Any]:
    return {
        "type": "reasoning",
        "summary": [],
        "content": None,
        "encrypted_content": encrypted_content,
    }


def build_function_call_output_item(block: dict[str, Any]) -> dict[str, Any]:
    tool_call_id = str(block.get("tool_use_id") or block.get("id") or f"call_{uuid4().hex[:12]}")
    return {
        "type": "function_call_output",
        "call_id": tool_call_id,
        "output": normalize_text_content(block.get("content", "")),
    }


def append_message_to_responses_input(target: list[dict[str, Any]], message: dict[str, Any]) -> None:
    role = str(message.get("role", "user"))
    blocks = ensure_content_blocks(message.get("content"))
    pending_text: list[str] = []

    for block in blocks:
        if not isinstance(block, dict):
            text = normalize_text_content(block)
            if text:
                pending_text.append(text)
            continue

        block_type = str(block.get("type", "text"))
        if block_type in {"thinking", "redacted_thinking"}:
            continue

        if role == "assistant" and block_type == "tool_use":
            flush_responses_message_item(target, role, pending_text)
            tool_call = build_function_call_item(block)
            cached_reasoning = PRIMARY_REASONING_CACHE.get(str(tool_call["call_id"]))
            if cached_reasoning:
                target.append(build_reasoning_item(cached_reasoning))
            target.append(tool_call)
            continue

        if role != "assistant" and block_type == "tool_result":
            flush_responses_message_item(target, role, pending_text)
            target.append(build_function_call_output_item(block))
            continue

        text = normalize_text_content(block)
        if text:
            pending_text.append(text)

    flush_responses_message_item(target, role, pending_text)


def build_responses_input(data: dict[str, Any]) -> list[dict[str, Any]]:
    input_items: list[dict[str, Any]] = []
    for message in data.get("messages", []):
        append_message_to_responses_input(input_items, message)
    return input_items


def build_responses_tools(tools: list[dict[str, Any]] | None) -> list[dict[str, Any]] | None:
    if not tools:
        return None

    responses_tools: list[dict[str, Any]] = []
    for tool in tools:
        schema = tool.get("input_schema") or {"type": "object", "properties": {}}
        responses_tools.append(
            {
                "type": "function",
                "name": str(tool.get("name", "tool")),
                "description": str(tool.get("description", "")),
                "strict": False,
                "parameters": schema,
            }
        )
    return responses_tools


def build_responses_tool_choice(tool_choice: Any) -> Any:
    if not tool_choice:
        return None

    if isinstance(tool_choice, str):
        tool_choice = {"type": tool_choice}

    if not isinstance(tool_choice, dict):
        raise PrimaryRouteBypass("tool_choice format is not supported on the primary route")

    choice_type = str(tool_choice.get("type", "auto"))
    if choice_type == "auto":
        return "auto"
    if choice_type == "any":
        if PRIMARY_TOOL_CHOICE_ANY_MODE == "required":
            return "required"
        return "auto"
    if choice_type == "none":
        return "none"
    if choice_type == "tool":
        tool_name = str(tool_choice.get("name", "")).strip()
        if not tool_name:
            raise PrimaryRouteBypass("tool_choice.tool is missing the tool name")
        return {"type": "function", "name": tool_name}
    raise PrimaryRouteBypass(f"tool_choice type '{choice_type}' is not supported on the primary route")


def build_primary_payload(context: AnthropicRequestContext) -> dict[str, Any]:
    validate_primary_route_supported(context.body)

    payload: dict[str, Any] = {
        "model": PRIMARY_MODEL,
        "input": build_responses_input(context.body),
        "parallel_tool_calls": PRIMARY_PARALLEL_TOOL_CALLS,
        "store": False,
        "stream": True,
    }

    instructions = normalize_text_content(context.body.get("system")) or PRIMARY_DEFAULT_INSTRUCTIONS
    if instructions:
        payload["instructions"] = instructions

    max_tokens = context.body.get("max_tokens")
    if PRIMARY_SEND_MAX_OUTPUT_TOKENS and max_tokens is not None:
        payload["max_output_tokens"] = max_tokens

    if PRIMARY_SEND_TEMPERATURE and "temperature" in context.body:
        payload["temperature"] = context.body["temperature"]

    if context.body.get("stop_sequences"):
        raise PrimaryRouteBypass("stop_sequences are not supported on the primary route")

    tools = build_responses_tools(context.body.get("tools"))
    if tools:
        payload["tools"] = tools

    tool_choice = build_responses_tool_choice(context.body.get("tool_choice"))
    if tool_choice is not None:
        payload["tool_choice"] = tool_choice

    if PRIMARY_REASONING_EFFORT:
        payload["reasoning"] = {"effort": PRIMARY_REASONING_EFFORT}
    if PRIMARY_TEXT_VERBOSITY:
        payload["text"] = {"verbosity": PRIMARY_TEXT_VERBOSITY}
    if PRIMARY_INCLUDE:
        payload["include"] = PRIMARY_INCLUDE
    if PRIMARY_INSTALLATION_ID:
        payload["client_metadata"] = {"x-codex-installation-id": PRIMARY_INSTALLATION_ID}

    return payload


def parse_tool_arguments(arguments: Any) -> dict[str, Any]:
    if isinstance(arguments, dict):
        return arguments
    if not arguments:
        return {}
    if not isinstance(arguments, str):
        return {"value": arguments}
    try:
        parsed = json.loads(arguments)
    except Exception:
        return {"raw_arguments": arguments}
    if isinstance(parsed, dict):
        return parsed
    return {"value": parsed}


def map_responses_stop_reason(response: dict[str, Any], saw_tool_use: bool) -> str:
    if saw_tool_use:
        return "tool_use"

    incomplete_details = response.get("incomplete_details") or {}
    reason = str(incomplete_details.get("reason", ""))
    if reason in {"max_output_tokens", "max_tokens"}:
        return "max_tokens"
    return "end_turn"


def sse_event(event: str, data: dict[str, Any]) -> bytes:
    payload = json.dumps(data, ensure_ascii=False)
    return f"event: {event}\ndata: {payload}\n\n".encode("utf-8")


async def iter_sse_events(response: httpx.Response) -> AsyncIterator[tuple[str, dict[str, Any]]]:
    event_name: str | None = None
    data_lines: list[str] = []

    try:
        async for raw_line in response.aiter_lines():
            line = raw_line.strip("\r")
            if not line:
                if event_name and data_lines:
                    data_str = "\n".join(data_lines)
                    if data_str != "[DONE]":
                        try:
                            yield event_name, json.loads(data_str)
                        except Exception:
                            pass
                event_name = None
                data_lines = []
                continue

            if line.startswith("event:"):
                event_name = line[6:].strip()
                continue
            if line.startswith("data:"):
                data_lines.append(line[5:].lstrip())
    except httpx.HTTPError:
        if event_name and data_lines:
            data_str = "\n".join(data_lines)
            if data_str != "[DONE]":
                try:
                    yield event_name, json.loads(data_str)
                except Exception:
                    pass
        raise

    if event_name and data_lines:
        data_str = "\n".join(data_lines)
        if data_str != "[DONE]":
            try:
                yield event_name, json.loads(data_str)
            except Exception:
                pass


@dataclass(slots=True)
class ResponsesToAnthropicBridge:
    requested_model: str
    message_id: str = field(default_factory=lambda: f"msg_{uuid4().hex}")
    message_started: bool = False
    completed: bool = False
    next_index: int = 0
    text_indices: dict[tuple[str, int], int] = field(default_factory=dict)
    tool_states: dict[str, dict[str, Any]] = field(default_factory=dict)
    content_blocks: dict[int, dict[str, Any]] = field(default_factory=dict)
    open_blocks: set[int] = field(default_factory=set)
    input_tokens: int = 0
    output_tokens: int = 0
    stop_reason: str | None = None
    saw_tool_use: bool = False
    latest_reasoning_encrypted_content: str | None = None
    events_seen: int = 0
    last_event_name: str | None = None

    def _message_start_event(self) -> bytes:
        return sse_event(
            "message_start",
            {
                "type": "message_start",
                "message": {
                    "id": self.message_id,
                    "type": "message",
                    "role": "assistant",
                    "content": [],
                    "model": self.requested_model,
                    "stop_reason": None,
                    "stop_sequence": None,
                    "usage": {
                        "input_tokens": 0,
                        "output_tokens": 0,
                    },
                },
            },
        )

    def ensure_message_started(self, response_id: str | None = None) -> list[bytes]:
        if response_id:
            self.message_id = response_id
        if self.message_started:
            return []
        self.message_started = True
        return [self._message_start_event()]

    def ensure_text_block(self, item_id: str, content_index: int) -> tuple[int, list[bytes]]:
        key = (item_id, content_index)
        existing_index = self.text_indices.get(key)
        if existing_index is not None:
            return existing_index, []

        index = self.next_index
        self.next_index += 1
        self.text_indices[key] = index
        self.content_blocks[index] = {"type": "text", "text": ""}
        self.open_blocks.add(index)
        return index, [
            sse_event(
                "content_block_start",
                {
                    "type": "content_block_start",
                    "index": index,
                    "content_block": {
                        "type": "text",
                        "text": "",
                    },
                },
            )
        ]

    def ensure_tool_block(self, item: dict[str, Any]) -> tuple[dict[str, Any], list[bytes]]:
        item_id = str(item.get("id") or f"fc_{uuid4().hex}")
        existing = self.tool_states.get(item_id)
        if existing is not None:
            if item.get("name"):
                existing["name"] = str(item["name"])
            if item.get("call_id"):
                existing["id"] = str(item["call_id"])
            return existing, []

        index = self.next_index
        self.next_index += 1
        state = {
            "item_id": item_id,
            "index": index,
            "id": str(item.get("call_id") or item_id),
            "name": str(item.get("name") or "tool"),
            "arguments_parts": [],
        }
        self.tool_states[item_id] = state
        self.content_blocks[index] = {
            "type": "tool_use",
            "id": state["id"],
            "name": state["name"],
            "input": {},
        }
        self.open_blocks.add(index)
        self.saw_tool_use = True
        return state, [
            sse_event(
                "content_block_start",
                {
                    "type": "content_block_start",
                    "index": index,
                    "content_block": {
                        "type": "tool_use",
                        "id": state["id"],
                        "name": state["name"],
                        "input": {},
                    },
                },
            )
        ]

    def close_block(self, index: int) -> list[bytes]:
        if index not in self.open_blocks:
            return []
        self.open_blocks.remove(index)
        return [
            sse_event(
                "content_block_stop",
                {
                    "type": "content_block_stop",
                    "index": index,
                },
            )
        ]

    def close_open_blocks(self) -> list[bytes]:
        events: list[bytes] = []
        for index in sorted(self.open_blocks):
            events.extend(self.close_block(index))
        return events

    def finalize_disconnect(self) -> list[bytes]:
        if self.completed or (not self.message_started and not self.content_blocks):
            return []

        events = self.close_open_blocks()
        self.stop_reason = self.stop_reason or ("tool_use" if self.saw_tool_use else "end_turn")
        if self.message_started:
            events.append(
                sse_event(
                    "message_delta",
                    {
                        "type": "message_delta",
                        "delta": {
                            "stop_reason": self.stop_reason,
                            "stop_sequence": None,
                        },
                        "usage": {
                            "output_tokens": self.output_tokens,
                        },
                    },
                )
            )
            events.append(sse_event("message_stop", {"type": "message_stop"}))
        self.completed = True
        return events

    def handle_event(self, event_name: str, payload: dict[str, Any]) -> list[bytes]:
        events: list[bytes] = []
        self.events_seen += 1
        self.last_event_name = event_name

        if event_name == "response.created":
            response = payload.get("response") or {}
            usage = response.get("usage") or {}
            self.input_tokens = int(usage.get("input_tokens", self.input_tokens))
            self.output_tokens = int(usage.get("output_tokens", self.output_tokens))
            events.extend(self.ensure_message_started(str(response.get("id") or self.message_id)))
            return events

        if event_name == "response.output_item.added":
            item = payload.get("item") or {}
            item_type = str(item.get("type", ""))
            if item_type == "reasoning" and item.get("encrypted_content"):
                self.latest_reasoning_encrypted_content = str(item["encrypted_content"])
                return events
            if item_type == "function_call":
                events.extend(self.ensure_message_started())
                _, start_events = self.ensure_tool_block(item)
                events.extend(start_events)
            return events

        if event_name == "response.content_part.added":
            part = payload.get("part") or {}
            if str(part.get("type", "")) in {"output_text", "text"}:
                events.extend(self.ensure_message_started())
                index, start_events = self.ensure_text_block(
                    str(payload.get("item_id") or f"msg_{uuid4().hex}"),
                    int(payload.get("content_index", 0)),
                )
                self.content_blocks.setdefault(index, {"type": "text", "text": ""})
                events.extend(start_events)
            return events

        if event_name == "response.output_text.delta":
            events.extend(self.ensure_message_started())
            index, start_events = self.ensure_text_block(
                str(payload.get("item_id") or f"msg_{uuid4().hex}"),
                int(payload.get("content_index", 0)),
            )
            delta = str(payload.get("delta") or "")
            self.content_blocks[index]["text"] = str(self.content_blocks[index].get("text", "")) + delta
            events.extend(start_events)
            if delta:
                events.append(
                    sse_event(
                        "content_block_delta",
                        {
                            "type": "content_block_delta",
                            "index": index,
                            "delta": {
                                "type": "text_delta",
                                "text": delta,
                            },
                        },
                    )
                )
            return events

        if event_name == "response.content_part.done":
            key = (
                str(payload.get("item_id") or ""),
                int(payload.get("content_index", 0)),
            )
            index = self.text_indices.get(key)
            if index is not None:
                events.extend(self.close_block(index))
            return events

        if event_name == "response.function_call_arguments.delta":
            events.extend(self.ensure_message_started())
            item_id = str(payload.get("item_id") or f"fc_{uuid4().hex}")
            state, start_events = self.ensure_tool_block({"id": item_id})
            delta = str(payload.get("delta") or "")
            if delta:
                state["arguments_parts"].append(delta)
            events.extend(start_events)
            if delta:
                events.append(
                    sse_event(
                        "content_block_delta",
                        {
                            "type": "content_block_delta",
                            "index": state["index"],
                            "delta": {
                                "type": "input_json_delta",
                                "partial_json": delta,
                            },
                        },
                    )
                )
            return events

        if event_name == "response.function_call_arguments.done":
            item_id = str(payload.get("item_id") or "")
            state = self.tool_states.get(item_id)
            if state and payload.get("arguments"):
                state["arguments_parts"] = [str(payload.get("arguments") or "")]
            return events

        if event_name == "response.output_item.done":
            item = payload.get("item") or {}
            item_type = str(item.get("type", ""))
            if item_type == "reasoning" and item.get("encrypted_content"):
                self.latest_reasoning_encrypted_content = str(item["encrypted_content"])
                return events
            if item_type == "function_call":
                state, _ = self.ensure_tool_block(item)
                raw_arguments = item.get("arguments")
                if not raw_arguments:
                    raw_arguments = "".join(state["arguments_parts"])
                call_id = str(item.get("call_id") or state["id"])
                if self.latest_reasoning_encrypted_content:
                    PRIMARY_REASONING_CACHE[call_id] = self.latest_reasoning_encrypted_content
                index = state["index"]
                self.content_blocks[index] = {
                    "type": "tool_use",
                    "id": call_id,
                    "name": str(item.get("name") or state["name"]),
                    "input": parse_tool_arguments(raw_arguments),
                }
                events.extend(self.close_block(index))
            return events

        if event_name == "response.completed":
            response = payload.get("response") or {}
            usage = response.get("usage") or {}
            self.input_tokens = int(usage.get("input_tokens", self.input_tokens))
            self.output_tokens = int(usage.get("output_tokens", self.output_tokens))
            self.stop_reason = map_responses_stop_reason(response, self.saw_tool_use)
            events.extend(self.close_open_blocks())
            if self.message_started:
                events.append(
                    sse_event(
                        "message_delta",
                        {
                            "type": "message_delta",
                            "delta": {
                                "stop_reason": self.stop_reason,
                                "stop_sequence": None,
                            },
                            "usage": {
                                "output_tokens": self.output_tokens,
                            },
                        },
                    )
                )
                events.append(sse_event("message_stop", {"type": "message_stop"}))
            self.completed = True
            return events

        return events

    def build_final_response(self) -> dict[str, Any]:
        content = [self.content_blocks[index] for index in sorted(self.content_blocks)]
        if not content:
            content = [{"type": "text", "text": ""}]
        return {
            "id": self.message_id,
            "type": "message",
            "role": "assistant",
            "content": content,
            "model": self.requested_model,
            "stop_reason": self.stop_reason or "end_turn",
            "stop_sequence": None,
            "usage": {
                "input_tokens": self.input_tokens,
                "output_tokens": self.output_tokens,
            },
        }


async def open_primary_stream(
    context: AnthropicRequestContext,
) -> tuple[httpx.AsyncClient, httpx.Response, dict[str, Any]]:
    payload = build_primary_payload(context)
    primary_url = build_responses_url(PRIMARY_BASE_URL)
    primary_headers = build_primary_headers(context)
    client = httpx.AsyncClient(timeout=build_timeout(stream=True))
    request = client.build_request("POST", primary_url, json=payload, headers=primary_headers)

    debug_log(
        "primary_request",
        request_id=context.request_id,
        url=primary_url,
        headers=sanitize_headers(primary_headers),
        payload={
            "model": payload["model"],
            "requested_model": context.requested_model,
            "stream": True,
            "input_count": len(payload["input"]),
            "tool_count": len(payload.get("tools") or []),
            "max_output_tokens": payload.get("max_output_tokens"),
        },
    )

    try:
        response = await client.send(request, stream=True)
    except httpx.HTTPError as exc:
        await client.aclose()
        raise PrimaryRouteUnavailable(f"primary provider stream request failed: {exc}") from exc

    if response.status_code != 200:
        body = await response.aread()
        body_text = body.decode("utf-8", errors="replace")
        debug_log(
            "primary_response",
            request_id=context.request_id,
            status_code=response.status_code,
            body=body_text,
        )
        await response.aclose()
        await client.aclose()
        raise PrimaryRouteUnavailable(f"primary provider returned HTTP {response.status_code}: {body_text}")

    debug_log(
        "primary_response",
        request_id=context.request_id,
        status_code=response.status_code,
        content_type=response.headers.get("content-type", ""),
    )

    return client, response, payload


async def call_primary_json(context: AnthropicRequestContext) -> dict[str, Any]:
    client, response, _ = await open_primary_stream(context)
    bridge = ResponsesToAnthropicBridge(requested_model=context.requested_model)

    try:
        try:
            async for event_name, payload in iter_sse_events(response):
                bridge.handle_event(event_name, payload)
        except httpx.HTTPError as exc:
            debug_log(
                "primary_stream_interrupted",
                request_id=context.request_id,
                reason=str(exc),
                events_seen=bridge.events_seen,
                last_event=bridge.last_event_name,
            )
            bridge.finalize_disconnect()
    finally:
        await response.aclose()
        await client.aclose()

    if not bridge.completed:
        raise PrimaryRouteUnavailable("primary provider stream ended before response.completed")
    return bridge.build_final_response()


async def start_primary_streaming_response(context: AnthropicRequestContext) -> StreamingResponse:
    client, response, _ = await open_primary_stream(context)
    bridge = ResponsesToAnthropicBridge(requested_model=context.requested_model)

    async def iterator() -> AsyncIterator[bytes]:
        try:
            try:
                async for event_name, payload in iter_sse_events(response):
                    for chunk in bridge.handle_event(event_name, payload):
                        yield chunk
            except httpx.HTTPError as exc:
                debug_log(
                    "primary_stream_interrupted",
                    request_id=context.request_id,
                    reason=str(exc),
                    events_seen=bridge.events_seen,
                    last_event=bridge.last_event_name,
                )
                for chunk in bridge.finalize_disconnect():
                    yield chunk
        finally:
            await response.aclose()
            await client.aclose()

    return StreamingResponse(
        iterator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


async def forward_to_claude_json(request: Request, context: AnthropicRequestContext) -> dict[str, Any]:
    if not CLAUDE_API_KEY:
        raise HTTPException(status_code=503, detail="Claude fallback is not configured.")

    payload = dict(context.body)
    payload["model"] = context.body.get("model") or FALLBACK_CLAUDE_MODEL or context.requested_model
    headers = build_claude_forward_headers(request, str(payload["model"]))
    claude_url = build_claude_messages_url(CLAUDE_BASE_URL)

    debug_log(
        "fallback_request",
        request_id=context.request_id,
        url=claude_url,
        headers=sanitize_headers(headers),
        params=context.query_params,
        payload={
            "model": payload["model"],
            "stream": context.stream,
            "message_count": len(payload.get("messages") or []),
            "tool_count": len(payload.get("tools") or []),
            "max_tokens": payload.get("max_tokens"),
        },
    )

    async with httpx.AsyncClient(timeout=build_timeout()) as client:
        try:
            response = await client.post(
                claude_url,
                json=payload,
                headers=headers,
                params=context.query_params,
            )
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail=f"Claude fallback request failed: {exc}") from exc

    debug_log(
        "fallback_response",
        request_id=context.request_id,
        status_code=response.status_code,
        body=response.text,
    )

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    try:
        return response.json()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Claude fallback returned invalid JSON: {exc}") from exc


async def start_claude_streaming_response(request: Request, context: AnthropicRequestContext) -> StreamingResponse:
    if not CLAUDE_API_KEY:
        raise HTTPException(status_code=503, detail="Claude fallback is not configured.")

    payload = dict(context.body)
    payload["model"] = context.body.get("model") or FALLBACK_CLAUDE_MODEL or context.requested_model
    headers = build_claude_forward_headers(request, str(payload["model"]))
    claude_url = build_claude_messages_url(CLAUDE_BASE_URL)
    client = httpx.AsyncClient(timeout=build_timeout(stream=True))
    upstream_request = client.build_request(
        "POST",
        claude_url,
        json=payload,
        headers=headers,
        params=context.query_params,
    )

    debug_log(
        "fallback_request",
        request_id=context.request_id,
        url=claude_url,
        headers=sanitize_headers(headers),
        params=context.query_params,
        payload={
            "model": payload["model"],
            "stream": True,
            "message_count": len(payload.get("messages") or []),
            "tool_count": len(payload.get("tools") or []),
            "max_tokens": payload.get("max_tokens"),
        },
    )

    try:
        response = await client.send(upstream_request, stream=True)
    except httpx.HTTPError as exc:
        await client.aclose()
        raise HTTPException(status_code=502, detail=f"Claude fallback stream request failed: {exc}") from exc
    if response.status_code != 200:
        body = await response.aread()
        body_text = body.decode("utf-8", errors="replace")
        debug_log(
            "fallback_response",
            request_id=context.request_id,
            status_code=response.status_code,
            body=body_text,
        )
        await response.aclose()
        await client.aclose()
        raise HTTPException(status_code=response.status_code, detail=body_text)

    async def iterator() -> AsyncIterator[bytes]:
        try:
            async for chunk in response.aiter_bytes():
                yield chunk
        finally:
            await response.aclose()
            await client.aclose()

    return StreamingResponse(
        iterator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "app": "auto_switch_proxy",
        "design": "anthropic-ingress -> primary codex/responses -> fallback claude",
        "primary_provider": PRIMARY_PROVIDER_NAME,
        "primary_model": PRIMARY_MODEL,
        "has_primary_key": bool(PRIMARY_API_KEY),
        "has_claude_key": bool(CLAUDE_API_KEY),
        "primary_url": build_responses_url(PRIMARY_BASE_URL),
        "claude_url": build_claude_messages_url(CLAUDE_BASE_URL),
        "claude_code_compat_enabled": CLAUDE_CODE_COMPAT_ENABLED,
    }


@app.get("/")
async def root() -> dict[str, Any]:
    return await health()


@app.head("/")
async def root_head() -> Response:
    return Response(status_code=200)


@app.head("/health")
async def health_head() -> Response:
    return Response(status_code=200)


@app.post("/v1/messages")
async def proxy_messages(request: Request):
    try:
        data = await request.json()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Request body must be valid JSON: {exc}") from exc

    if not isinstance(data, dict):
        raise HTTPException(status_code=400, detail="Request body must be a JSON object.")
    if not data.get("messages"):
        raise HTTPException(status_code=400, detail="Request body must include a non-empty messages array.")

    context = build_request_context(request, data)
    debug_log(
        "incoming_request",
        request_id=context.request_id,
        method=request.method,
        path=request.url.path,
        query=request.url.query,
        model=context.requested_model,
        stream=context.stream,
        headers=sanitize_headers(request.headers),
    )

    if context.stream:
        try:
            return await start_primary_streaming_response(context)
        except PrimaryRouteBypass as exc:
            debug_log("primary_bypass", request_id=context.request_id, reason=exc.reason)
        except PrimaryRouteUnavailable as exc:
            debug_log("primary_unavailable", request_id=context.request_id, reason=exc.reason)
        return await start_claude_streaming_response(request, context)

    try:
        return await call_primary_json(context)
    except PrimaryRouteBypass as exc:
        debug_log("primary_bypass", request_id=context.request_id, reason=exc.reason)
    except PrimaryRouteUnavailable as exc:
        debug_log("primary_unavailable", request_id=context.request_id, reason=exc.reason)
    return await forward_to_claude_json(request, context)


if __name__ == "__main__":
    uvicorn.run(app, host=HOST, port=PORT)
