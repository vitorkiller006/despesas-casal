import requests, json
from datetime import datetime, timedelta
import calendar

SUPABASE_URL = 'https://mmvieranrinduaxlgjua.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tdmllcmFucmluZHVheGxnanVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MzQxMTAsImV4cCI6MjA5ODExMDExMH0.qR1XZYpmvWEaA-PhCBJg06PJodhqu4U5XI_SM2gsPz8'
headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
}

# 1. Fetch Cartoes
r_cartoes = requests.get(f'{SUPABASE_URL}/rest/v1/cartoes', headers=headers)
cartoes = r_cartoes.json()
cartoes_map = {c['nome']: c for c in cartoes}

# 2. Fetch Despesas no Cartao com data_compra null
r_desp = requests.get(f'{SUPABASE_URL}/rest/v1/despesas?forma_pagamento=eq.Cart%C3%A3o%20de%20Cr%C3%A9dito&data_compra=is.null', headers=headers)
despesas = r_desp.json()

def add_months(sourcedate, months):
    month = sourcedate.month - 1 + months
    year = sourcedate.year + month // 12
    month = month % 12 + 1
    day = min(sourcedate.day, calendar.monthrange(year,month)[1])
    return datetime(year, month, day)

for d in despesas:
    banco = d.get('banco')
    cartao = cartoes_map.get(banco)
    if not cartao: continue
    
    data_str = d['data']
    data_compra = datetime.strptime(data_str, '%Y-%m-%d')
    
    dia_venc = cartao.get('dia_vencimento')
    dia_fech = cartao.get('dia_fechamento')
    if not dia_fech:
        dia_fech = dia_venc - 7
        if dia_fech <= 0: dia_fech += 30
        
    dia_c = data_compra.day
    mes_c = data_compra.month
    ano_c = data_compra.year
    
    try:
        base_pag = datetime(ano_c, mes_c, dia_venc)
    except ValueError:
        last_day = calendar.monthrange(ano_c, mes_c)[1]
        base_pag = datetime(ano_c, mes_c, min(dia_venc, last_day))
        
    if dia_venc < dia_fech:
        base_pag = add_months(base_pag, 1)
        
    if dia_c >= dia_fech:
        base_pag = add_months(base_pag, 1)
        
    while base_pag < data_compra:
        base_pag = add_months(base_pag, 1)
        
    update_data = {
        'data': base_pag.strftime('%Y-%m-%d'),
        'data_compra': data_str
    }
    patch_url = f"{SUPABASE_URL}/rest/v1/despesas?id=eq.{d['id']}"
    r_patch = requests.patch(patch_url, headers=headers, data=json.dumps(update_data))
    print(f"Updated {d['descricao']}: {data_str} -> {update_data['data']}")
