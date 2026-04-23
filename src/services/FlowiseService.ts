// Servicio para consultar Flowise (server-side, evita CORS)

interface FlowiseResponse {
  text?: string;
  message?: string;
  data?: Array<{ message?: string; text?: string }>;
}

/**
 * Busca productos via Flowise (server-side).
 */
export async function searchProductsFlowise(query: string): Promise<string[]> {
  const url = process.env.FLOWISE_URL;
  const apiKey = process.env.FLOWISE_API_KEY;
  const chatflowId = process.env.FLOWISE_CHATFLOW_ID;

  if (!url || !chatflowId) {
    console.warn('[Flowise] No configurado');
    return [];
  }

  if (!query.trim()) return [];
  let finalQuery = `Busca información en internet sobre: "${query}"

Eres un asistente especializado en búsqueda de productos agrícolas.

OBJETIVO:
Ayudar a encontrar productos como fertilizantes, herbicidas, insecticidas, fungicidas, semillas y suplementos agrícolas.

REGLAS DE RESPUESTA:
1. Responde siempre en español.
2. Mantén respuestas cortas: máximo 8–10 líneas.
3. Sé directo, sin introducciones ni explicaciones largas.
4. Si encuentras productos, prioriza listar opciones claras.
5. Si no tienes datos suficientes, pide una aclaración breve.
6. No inventes productos ni marcas.

FORMATO DE RESPUESTA:
Cuando recomiendes productos, usa este formato:

- Nombre del producto
- Tipo (fertilizante, herbicida, etc.)
- Uso principal
- Dosis general (si aplica)
- Observación corta

EJEMPLO:

- Urea 46%
  Tipo: Fertilizante nitrogenado
  Uso: Aumento de crecimiento vegetativo
  Dosis: 100–200 kg/ha
  Nota: Aplicar con humedad en suelo

REGLAS DE CALIDAD:
- No des información innecesaria.
- No expliques teorías agrícolas.
- Enfócate solo en el producto y su uso práctico.
- Si el usuario pide comparación, compara en máximo 5 puntos.
  `
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  // Normalizar URL - soporta dos formatos:
  // 1. FLOWISE_URL=https://flowise.com (solo host)
  // 2. FLOWISE_URL=https://flowise.com/api/v1/prediction (con path)
  let endpoint: string;
  if (url.includes('/api/v1/prediction')) {
    // URL ya incluye el path - solo appender chatflowId
    const baseUrl = url.replace(/\/$/, '');
    endpoint = `${baseUrl}/${chatflowId}`;
  } else {
    // URL es solo host - appende path completo
    const normalizedUrl = url.replace(/\/$/, '');
    endpoint = `${normalizedUrl}/api/v1/prediction/${chatflowId}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      question: finalQuery,
      chatId: `search-${Date.now()}`,
      history: []
    })
  });

  // Verificar que la respuesta sea JSON antes de parsear
  const contentType = response.headers.get('content-type');
  if (!response.ok) {
    console.error('[Flowise] Error:', response.status, response.statusText);
    if (!contentType?.includes('application/json')) {
      const text = await response.text().catch(() => '');
      console.error('[Flowise] Respuesta no-JSON:', text.slice(0, 200));
    }
    return [];
  }

  if (!contentType?.includes('application/json')) {
    console.error('[Flowise] Content-Type esperado: application/json, recibido:', contentType);
    return [];
  }

  const data = await response.json() as FlowiseResponse;
  
// 1. { "text": "respuesta" } → direct return
  if (data.text) {
    return [data.text];
  }

  // 2. { "message": "respuesta" }  
  if (data.message) {
    return [data.message];
  }

  // 3. { "data": [{ "message": "..." }] } → array
  if (data.data && data.data.length > 0) {
    return data.data
      .map(m => m.message ?? m.text ?? '')
      .filter(Boolean);
  }

  return [];
}
