# Arquitectura

```text
Navegador
   │
   ├── HTML/CSS/JS + Leaflet
   │
   ▼
PHP 8 / API
   │
   ├──────────────► MySQL
   │
   └──────────────► Python route_cli.py
                         │
                         ├── Grafo
                         ├── Dijkstra
                         └── A*

Streamlit ───────────────► MySQL
```

PHP es el backend principal. Python concentra los cálculos de rutas y geolocalización.
