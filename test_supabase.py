import urllib.request
import urllib.error
import json
import ssl

url = "https://mmvieranrinduaxlgjua.supabase.co/rest/v1/despesas"
headers = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tdmllcmFucmluZHVheGxnanVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MzQxMTAsImV4cCI6MjA5ODExMDExMH0.qR1XZYpmvWEaA-PhCBJg06PJodhqu4U5XI_SM2gsPz8",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tdmllcmFucmluZHVheGxnanVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MzQxMTAsImV4cCI6MjA5ODExMDExMH0.qR1XZYpmvWEaA-PhCBJg06PJodhqu4U5XI_SM2gsPz8",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

data = {
    "descricao": "Teste de Integração",
    "valor": 1.00,
    "categoria": "Outros",
    "data": "2026-06-27"
}

print("=== TESTANDO INSERÇÃO ===")
try:
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="POST")
    context = ssl._create_unverified_context()
    with urllib.request.urlopen(req, context=context) as response:
        print("INSERÇÃO BEM SUCEDIDA!")
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"ERRO NA INSERÇÃO: {e.code} - {e.read().decode('utf-8')}")

print("\n=== TESTANDO LEITURA ===")
try:
    req = urllib.request.Request(url + "?select=*", headers=headers, method="GET")
    context = ssl._create_unverified_context()
    with urllib.request.urlopen(req, context=context) as response:
        print("LEITURA BEM SUCEDIDA!")
        res_data = json.loads(response.read().decode('utf-8'))
        print(f"Total de itens na tabela: {len(res_data)}")
        for item in res_data:
            print(f"- {item.get('descricao')} | R$ {item.get('valor')}")
except urllib.error.HTTPError as e:
    print(f"ERRO NA LEITURA: {e.code} - {e.read().decode('utf-8')}")
