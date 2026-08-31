#!/usr/bin/env bash
# Start MindBoard op de achtergrond (losgekoppeld), handig voor ontwikkeling.
# Gebruik: ./start.sh  en  ./stop.sh

PID_FILE="data/server.pid"
mkdir -p data

case "${1:-start}" in
  start)
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
      echo "MindBoard draait al (pid $(cat "$PID_FILE"))."
      exit 0
    fi
    setsid node server.js > data/server.log 2>&1 < /dev/null &
    echo $! > "$PID_FILE"
    echo "MindBoard gestart (pid $(cat "$PID_FILE")) — log: data/server.log"
    ;;
  stop)
    if [ -f "$PID_FILE" ]; then
      kill "$(cat "$PID_FILE")" 2>/dev/null && echo "Gestopt."
      rm -f "$PID_FILE"
    else
      echo "Geen pidfile gevonden."
    fi
    ;;
  log)
    tail -f data/server.log
    ;;
  *)
    echo "Gebruik: ./start.sh [start|stop|log]"
    ;;
esac