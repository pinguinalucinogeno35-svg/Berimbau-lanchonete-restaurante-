// Edge Function: track-event
// Recebe eventos de uso do cardápio, valida, aplica limite de frequência e grava sem dados pessoais.
// Por que uma Edge Function: o navegador não pode gravar direto em analytics_events (RLS bloqueia),
// e o limite de frequência por origem precisa do IP — que é usado só para gerar um hash diário e descartado.
//
// Variáveis (definidas automaticamente pelo Supabase): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// Opcional: ANALYTICS_SALT (segredo para o hash), ALLOWED_ORIGINS (lista separada por vírgulas).

import { createClient } from 'jsr:@supabase/supabase-js@2';

const EVENTOS = new Set([
  'menu_open',
  'product_view',
  'model_3d_open',
  'ar_launch_attempt',
  'ar_launch_error',
  'ar_return',
]);
const DISPOSITIVOS = new Set(['mobile', 'tablet', 'desktop']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const LIMITE_POR_MINUTO = 60;
const LIMITE_POR_DIA = 1500;

const origensPermitidas = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function cors(origin: string | null): Record<string, string> {
  const permitido = !origensPermitidas.length || (origin && origensPermitidas.includes(origin));
  return {
    'Access-Control-Allow-Origin': permitido && origin ? origin : (origensPermitidas[0] ?? '*'),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

const json = (status: number, body: unknown, headers: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } });

async function sha256(texto: string): Promise<string> {
  const dados = new TextEncoder().encode(texto);
  const hash = await crypto.subtle.digest('SHA-256', dados);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const headers = cors(origin);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' }, headers);
  if (origensPermitidas.length && (!origin || !origensPermitidas.includes(origin))) {
    return json(403, { error: 'origin_not_allowed' }, headers);
  }

  const tamanho = Number(req.headers.get('content-length') ?? '0');
  if (tamanho > 2048) return json(413, { error: 'payload_too_large' }, headers);

  let corpo: Record<string, unknown>;
  try {
    corpo = await req.json();
  } catch {
    return json(400, { error: 'invalid_json' }, headers);
  }

  const restaurantSlug = String(corpo.restaurantSlug ?? '');
  const tipo = String(corpo.type ?? '');
  const dispositivo = corpo.deviceCategory == null ? null : String(corpo.deviceCategory);
  const productId = corpo.productId == null ? null : String(corpo.productId);
  const qrCodeId = corpo.qrCodeId == null ? null : String(corpo.qrCodeId);

  if (!SLUG.test(restaurantSlug) || restaurantSlug.length > 80)
    return json(400, { error: 'invalid_restaurant' }, headers);
  if (!EVENTOS.has(tipo)) return json(400, { error: 'invalid_type' }, headers);
  if (dispositivo !== null && !DISPOSITIVOS.has(dispositivo))
    return json(400, { error: 'invalid_device' }, headers);
  if (productId !== null && !UUID.test(productId)) return json(400, { error: 'invalid_product' }, headers);
  if (qrCodeId !== null && !UUID.test(qrCodeId)) return json(400, { error: 'invalid_qr' }, headers);

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

  // Hash diário de IP + user agent: serve só para limitar abuso; o valor bruto não é gravado.
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || 'sem-ip';
  const dia = new Date().toISOString().slice(0, 10);
  const chave = await sha256(
    `${Deno.env.get('ANALYTICS_SALT') ?? 'troque-este-sal'}|${dia}|${ip}|${req.headers.get('user-agent') ?? ''}`,
  );

  const [{ data: minutoOk }, { data: diaOk }] = await Promise.all([
    supabase.rpc('bump_rate_limit', {
      p_key: `m:${chave}`,
      p_window_seconds: 60,
      p_limit: LIMITE_POR_MINUTO,
    }),
    supabase.rpc('bump_rate_limit', {
      p_key: `d:${chave}`,
      p_window_seconds: 86400,
      p_limit: LIMITE_POR_DIA,
    }),
  ]);
  if (minutoOk === false || diaOk === false) return json(429, { error: 'rate_limited' }, headers);

  const { data: restaurante } = await supabase
    .from('restaurants')
    .select('id')
    .eq('slug', restaurantSlug)
    .eq('is_active', true)
    .maybeSingle();
  if (!restaurante) return json(404, { error: 'restaurant_not_found' }, headers);

  // Produto e QR precisam ser do mesmo restaurante e públicos.
  if (productId) {
    const { data } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .eq('restaurant_id', restaurante.id)
      .eq('is_published', true)
      .maybeSingle();
    if (!data) return json(400, { error: 'invalid_product' }, headers);
  }
  if (qrCodeId) {
    const { data } = await supabase
      .from('qr_codes')
      .select('id')
      .eq('id', qrCodeId)
      .eq('restaurant_id', restaurante.id)
      .maybeSingle();
    if (!data) return json(400, { error: 'invalid_qr' }, headers);
  }

  const { error } = await supabase.from('analytics_events').insert({
    restaurant_id: restaurante.id,
    product_id: productId,
    qr_code_id: qrCodeId,
    event_type: tipo,
    device_category: dispositivo,
  });
  if (error) return json(500, { error: 'insert_failed' }, headers);
  return json(202, { ok: true }, headers);
});
