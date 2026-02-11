# kommo-messages-workflow

Workflow de Cloudflare que procesa mensajes de leads de Kommo y los integra con el agente de Laburen.com. **No recibe webhooks directamente**; es invocado por otro Worker (kommo-webhook-worker) que recibe los webhooks, normaliza los datos y lo ejecuta.

## ¿Qué hace?

1. **Envía el mensaje** al agente de Laburen.com
2. **Guarda** el mapeo `lead_id` ↔ `conversationId` en D1 (para reanudar conversaciones)
3. **Actualiza** un campo personalizado del lead en Kommo con la respuesta del agente
4. **Ejecuta** un SalesBot en Kommo para pushear esa respuesta al chat del lead

## Flujo

```
kommo-webhook-worker (recibe webhook → normaliza → invoca workflow)
    ↓
laburen-step       → API Laburen, mapeo en D1
updateLead-step    → PATCH lead en Kommo
launchSalesBot-step → SalesBot en Kommo
```

## Estructura

```
src/
├── index.js              # Workflow con 3 steps
└── services/
    ├── laburen.service.js   # POST a Laburen API (timeout 80s)
    └── kommo.service.js     # updateLead + launchSalesBot
database/
└── lead_conversation_map.js # INSERT en D1
```

## Payload esperado

El Worker que invoca el workflow debe pasar:

```javascript
{
  account_config: {
    kommo_account_subdomain: string,
    kommo_account_id: string,
    kommo_long_duration_token: string,
    kommo_response_field_id: string,   // campo donde se escribe la respuesta
    kommo_salesbot_id: string,
    kommo_switch_field_id: string,     // checkbox para activar/desactivar
    laburen_agent_id: string,
    laburen_authorization: string      // Bearer token
  },
  normalized: {
    element_id: string,    // lead id
    text: string,
    attachment?: string,
    author_name?: string,
    phone_number?: string,
    origin?: string
  },
  conversationId?: string  // null en primera vez, luego para continuar
}
```

## Configuración (wrangler.jsonc)

- **Workflow**: `workflow-kommo-messages` → binding `MY_WORKFLOW`, clase `MyWorkflow`
- **D1**: binding `DB` → base `kommo`