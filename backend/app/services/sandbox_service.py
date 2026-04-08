import asyncio
import logging
import os
import tempfile
import time
from typing import Optional
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


async def run_onescript_subprocess(code: str) -> SandboxResult:
    """Fallback: run OneScript via local subprocess if available."""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".os", delete=False, encoding="utf-8") as f:
        f.write(code)
        tmp_path = f.name

    start = time.monotonic()
    try:
        proc = await asyncio.create_subprocess_exec(
            "oscript", tmp_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            stdout, stderr = await asyncio.wait_for(
                proc.communicate(), timeout=settings.SANDBOX_TIMEOUT_SECONDS
            )
            elapsed = int((time.monotonic() - start) * 1000)
            return SandboxResult(
                output=stdout.decode("utf-8", errors="replace").strip(),
                error=stderr.decode("utf-8", errors="replace").strip(),
                execution_time_ms=elapsed,
                memory_used_mb=0.0,
            )
        except asyncio.TimeoutError:
            proc.kill()
            return SandboxResult(
                error=f"Превышено время выполнения ({settings.SANDBOX_TIMEOUT_SECONDS}с)",
                execution_time_ms=settings.SANDBOX_TIMEOUT_SECONDS * 1000,
            )
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


async def run_in_docker(code: str) -> SandboxResult:
    """Run OneScript code in Docker container with resource limits."""
    try:
        import docker
        import docker.errors

        client = docker.from_env()

        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".os", delete=False, encoding="utf-8"
        ) as f:
            f.write(code)
            tmp_path = f.name

        start = time.monotonic()
        try:
            # ENTRYPOINT уже ["oscript"], поэтому command — только путь к скрипту
            output_bytes = client.containers.run(
                settings.SANDBOX_IMAGE,
                command="/code/solution.os",
                volumes={tmp_path: {"bind": "/code/solution.os", "mode": "ro"}},
                mem_limit=settings.SANDBOX_MEMORY_LIMIT,
                cpu_quota=settings.SANDBOX_CPU_QUOTA,
                network_disabled=True,
                remove=True,
                detach=False,
                stdout=True,
                stderr=False,
                timeout=settings.SANDBOX_TIMEOUT_SECONDS + 2,
            )
            elapsed = int((time.monotonic() - start) * 1000)
            output = output_bytes.decode("utf-8", errors="replace") if isinstance(output_bytes, bytes) else ""
            return SandboxResult(output=output.strip(), execution_time_ms=elapsed)

        except docker.errors.ContainerError as e:
            elapsed = int((time.monotonic() - start) * 1000)
            stderr_text = e.stderr.decode("utf-8", errors="replace") if e.stderr else str(e)
            return SandboxResult(error=stderr_text, execution_time_ms=elapsed)
        finally:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

    except Exception as e:
        logger.error(f"Docker execution failed: {e}")
        return SandboxResult(error=f"Ошибка запуска sandbox: {e}")


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
