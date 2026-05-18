import { getSupabaseAdmin } from '../_supabaseAdmin.js'

export async function getPosSettings({ storeId, provider }) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('pos_settings')
    .select('id,store_id,pos_provider,api_token,warehouse_id,webhook_secret,last_sync_time')
    .eq('store_id', storeId)
    .eq('pos_provider', provider)
    .limit(1)
    .maybeSingle()
  if (error) throw new Error('Failed to load pos_settings')
  if (!data) throw new Error('POS settings not found')
  return data
}

