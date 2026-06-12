#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ $# -gt 0 ]]; then
  TARGET_DIRS=("$@")
else
  TARGET_DIRS=("." "pilot-static")
fi

PORTS=(3000 3001 3002 3500)

kill_listening_on_port() {
  local signal="$1"
  local port="$2"
  local pids
  pids="$(lsof -ti tcp:"${port}" -sTCP:LISTEN 2>/dev/null | sort -u || true)"
  if [[ -n "${pids}" ]]; then
    echo "[dev:reset] Port ${port} in use by PID(s): ${pids}. Sending ${signal}."
    # shellcheck disable=SC2086
    kill "-${signal}" ${pids} 2>/dev/null || true
  fi
}

for port in "${PORTS[@]}"; do
  kill_listening_on_port TERM "${port}"
done

sleep 1

for port in "${PORTS[@]}"; do
  kill_listening_on_port KILL "${port}"
done

for rel_dir in "${TARGET_DIRS[@]}"; do
  target_dir="${ROOT_DIR}/${rel_dir}"
  lock_file="${target_dir}/.next/dev/lock"

  if [[ -f "${lock_file}" ]]; then
    lock_pids="$(lsof -t "${lock_file}" 2>/dev/null | sort -u || true)"
    if [[ -n "${lock_pids}" ]]; then
      echo "[dev:reset] Lock ${lock_file} held by PID(s): ${lock_pids}. Terminating."
      # shellcheck disable=SC2086
      kill -TERM ${lock_pids} 2>/dev/null || true
      sleep 1
      # shellcheck disable=SC2086
      kill -KILL ${lock_pids} 2>/dev/null || true
    fi

    rm -f "${lock_file}"
    echo "[dev:reset] Removed lock: ${lock_file}"
  fi

done

echo "[dev:reset] Done. You can start dev again."
