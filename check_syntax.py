import ast
for f in ['rag_query.py', 'rag_api.py', 'app.py', 'ingest.py']:
    try:
        ast.parse(open(f, 'rb').read().decode('utf-8-sig'))
        print(f'OK  {f}')
    except Exception as e:
        print(f'ERR {f} — {e}')
