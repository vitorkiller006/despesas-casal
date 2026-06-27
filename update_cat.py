import requests, json

SUPABASE_URL = 'https://mmvieranrinduaxlgjua.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tdmllcmFucmluZHVheGxnanVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MzQxMTAsImV4cCI6MjA5ODExMDExMH0.qR1XZYpmvWEaA-PhCBJg06PJodhqu4U5XI_SM2gsPz8'
headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
}

mappings = {
    'Advogado - Mensalidade - Kwid Processo': 'Serviços',
    'Anbima - CPA - Vitor': 'Educação',
    'Catalisador - Kwid': 'Compras de Internet',
    'Compra de Prisilhas de Cabelo pra Revenda - AliExpress': 'Compras de Internet',
    'Financiamento - Kwid': 'Financiamento',
    'MBA - Vitor': 'Educação',
    'MEI - Neusa': 'Impostos',
    'Pneu - Kwid - Mercado Livre': 'Compras de Internet',
    'Wellhub - Gabi e Vitor': 'Academia'
}

r_desp = requests.get(f'{SUPABASE_URL}/rest/v1/despesas?categoria=eq.Outros&select=id,descricao', headers=headers)
despesas = r_desp.json()

count = 0
for d in despesas:
    desc = d['descricao']
    base_desc = desc.split(' (Parc.')[0]
    
    new_cat = mappings.get(base_desc)
    if new_cat:
        patch_url = f"{SUPABASE_URL}/rest/v1/despesas?id=eq.{d['id']}"
        requests.patch(patch_url, headers=headers, data=json.dumps({'categoria': new_cat}))
        count += 1
        print(f"Updated {desc} to {new_cat}")

print(f'Total updated: {count}')
