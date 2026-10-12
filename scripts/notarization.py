# [INPUT]: 已获 Accepted 的公开安装产物、stapler 操作及调用方已过滤的进程环境。
# [OUTPUT]: 装订/校验票据；仅服务错误 68 有限退避重试，其余错误立即阻断并保留安全工具诊断。
# [POS]: 两个发布脚本的票据边界；不接触认证参数或私钥，不跳过最终有效性校验。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
import subprocess
import time


def stapler(operation, artifact, env):
    if operation not in ('staple', 'validate'):
        raise ValueError('Unsupported ticket operation')
    command = ['xcrun', 'stapler', operation, str(artifact)]
    for attempt in range(3):
        result = subprocess.run(command, capture_output=True, text=True, env=env)
        if result.returncode == 0:
            return result
        # 命令固定且不带认证参数；输出实际 ticket 错误，避免只剩 CalledProcessError。
        print((result.stdout or '') + (result.stderr or ''), flush=True)
        if result.returncode != 68 or attempt == 2:
            raise subprocess.CalledProcessError(result.returncode, command,
                                                output=result.stdout, stderr=result.stderr)
        print(f'Apple ticket service unavailable; retrying {operation} ({attempt + 2}/3)', flush=True)
        time.sleep(15 * (attempt + 1))
