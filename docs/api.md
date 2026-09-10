# API

`GET /api/spaces` — espacios.
`GET /api/nodes` — nodos.
`GET /api/edges` — conexiones.
`GET /api/map` — mapa completo.
`GET /api/search?q=bibl` — búsqueda parcial.
`POST /api/routes` — calcula una ruta.

Ejemplo:
```json
{
  "start": 1,
  "goal": 14,
  "algorithm": "astar",
  "accessible_only": true
}
```
