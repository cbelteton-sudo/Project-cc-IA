#!/bin/bash

# Script simple para exportar diagramas Mermaid a PNG usando npx
# No requiere dependencias en package.json

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "🔍 Buscando archivos .mmd en $DIR..."

# Verificar si npx está disponible
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx no está instalado. Por favor instala Node.js/npm."
    exit 1
fi

count=0
for f in *.mmd; do
    [ -e "$f" ] || continue
    filename=$(basename -- "$f")
    extension="${filename##*.}"
    filename="${filename%.*}"
    
    echo "🎨 Exportando $f a $filename.png..."
    
    # Uso de @mermaid-js/mermaid-cli via npx sin ensuciar package.json
    # -i input -o output -b transparent (background)
    npx -y -p @mermaid-js/mermaid-cli mmdc -i "$f" -o "$filename.png" -b transparent
    
    if [ $? -eq 0 ]; then
        echo "✅ Generado $filename.png"
        ((count++))
    else
        echo "⚠️  Error generando $filename.png"
    fi
done

echo "🎉 Proceso terminado. $count diagramas exportados."
