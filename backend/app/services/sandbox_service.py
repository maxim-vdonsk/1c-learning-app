import asyncio
import io
import logging
import tarfile
import time
from ..core.config import settings

logger = logging.getLogger(__name__)


class SandboxResult:
    def __init__(
        self,
        output: str = "",
        error: str = "",
        execution_time_ms: int = 0,
        memory_used_mb: float = 0.0,
    ):
        self.output = output
        self.error = error
        self.execution_time_ms = execution_time_ms
        self.memory_used_mb = memory_used_mb


def _build_tar(code: str) -> bytes:
    """Упаковать код в tar-архив для передачи в контейнер через put_archive."""
    code_bytes = code.encode("utf-8")
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w") as tar:
        info = tarfile.TarInfo(name="solution.os")
        info.size = len(code_bytes)
        tar.addfile(info, io.BytesIO(code_bytes))
    return buf.getvalue()


def _run_docker_sync(code: str) -> SandboxResult:
    """Синхронное выполнение кода в Docker-контейнере.
    Использует put_archive вместо volume-монтирования, чтобы избежать
    проблемы с путями хоста при Docker-in-Docker.
    """
    import docker
    import docker.errors

    client = docker.from_env()
    container = None
    start = time.monotonic()
    try:
        container = client.containers.create(
            settings.SANDBOX_IMAGE,
            command="/code/solution.os",
            mem_limit=settings.SANDBOX_MEMORY_LIMIT,
            cpu_quota=settings.SANDBOX_CPU_QUOTA,
            network_disabled=True,
        )
        # Копируем код в контейнер через tar — никаких путей хоста
        container.put_archive("/code", _build_tar(code))
        container.start()

        exit_result = container.wait(timeout=settings.SANDBOX_TIMEOUT_SECONDS + 2)
        elapsed = int((time.monotonic() - start) * 1000)

        logs = container.logs(stdout=True, stderr=True)
        output = logs.decode("utf-8", errors="replace").strip() if isinstance(logs, bytes) else ""
        exit_code = exit_result.get("StatusCode", 0)

        if exit_code != 0:
            return SandboxResult(error=output, execution_time_ms=elapsed)
        return SandboxResult(output=output, execution_time_ms=elapsed)

    except Exception as e:
        elapsed = int((time.monotonic() - start) * 1000)
        logger.error(f"Docker execution error: {e}")
        return SandboxResult(error=f"Ошибка sandbox: {e}", execution_time_ms=elapsed)
    finally:
        if container:
            try:
                container.remove(force=True)
            except Exception:
                pass


async def run_in_docker(code: str) -> SandboxResult:
    """Запустить код в Docker sandbox (неблокирующая обёртка)."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _run_docker_sync, code)


async def execute_code(code: str) -> SandboxResult:
    """Execute 1C/OneScript code and return result."""
    try:
        return await run_in_docker(code)
    except Exception as e:
        logger.error(f"Sandbox execution error: {e}")
        return SandboxResult(error=f"Ошибка выполнения кода: {e}")


def check_test_case(output: str, expected: str) -> bool:
    """Compare actual output with expected, normalizing whitespace."""
    actual = "\n".join(line.strip() for line in output.strip().splitlines() if line.strip())
    exp = "\n".join(line.strip() for line in expected.strip().splitlines() if line.strip())
    return actual == exp
