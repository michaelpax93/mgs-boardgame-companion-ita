#!/bin/bash
FFMPEG="/c/Users/User/Documents/Michael/tool/ffmpeg.exe"
VIDEO_DIR="C:/Users/User/Documents/Michael/mgs-boardgame-ita/video"

# Usa process substitution < <(...) per evitare che i comandi interni
# consumino lo stdin del while loop (bug del pipe con grep/ffmpeg)
while IFS= read -r file; do
    size=$(wc -c < "$file" 2>/dev/null)
    # Salta file sotto 200KB
    if [ -z "$size" ] || [ "$size" -lt 204800 ]; then
        echo "SKIP (troppo piccolo): $file"
        continue
    fi

    mb=$((size / 1024 / 1024))
    tmp="${file%.mp4}_tmp.mp4"
    echo "=== Comprimo: $file (${mb} MB) ==="

    if [[ "$file" == *"stage_14_outro"* ]]; then
        # 41 min → target bitrate fisso per stare sotto 90MB
        "$FFMPEG" -y -i "$file" \
            -c:v libx264 -b:v 150k -maxrate 200k -bufsize 400k \
            -c:a aac -b:a 128k \
            -movflags +faststart \
            "$tmp" </dev/null 2>&1 | grep -E "frame=.*time=|^$"
    else
        "$FFMPEG" -y -i "$file" \
            -c:v libx264 -crf 28 -preset medium \
            -c:a aac -b:a 128k \
            -movflags +faststart \
            "$tmp" </dev/null 2>&1 | grep -E "frame=.*time=|^$"
    fi

    if [ $? -eq 0 ] && [ -f "$tmp" ]; then
        new_size=$(wc -c < "$tmp")
        echo "  OK: ${mb} MB → $((new_size / 1024 / 1024)) MB"
        mv "$tmp" "$file"
    else
        echo "  ERRORE: mantengo originale"
        rm -f "$tmp"
    fi
done < <(find "$VIDEO_DIR" -name "*.mp4")

echo ""
echo "=== COMPLETATO — dimensioni finali ==="
find "$VIDEO_DIR" -name "*.mp4" -exec ls -lh {} \; | awk '{print $5, $9}' | sort -k2
