# Disposable Linux/Docker integration test. No production mounts or Soulseek credentials.
# AGPL-3.0-only with Additional Terms; see LICENSE.
import datetime,json,os,pathlib,secrets,sqlite3,subprocess,time,urllib.request,urllib.parse,uuid
root=pathlib.Path('/tmp/slskprime-actions-'+str(int(time.time())));app=root/'app';app.mkdir(parents=True)
password=secrets.token_urlsafe(24)
(app/'slskd.yml').write_text('flags:\n  no_connect: true\n  no_share_scan: true\nweb:\n  authentication:\n    username: smoke\n    password: "'+password+'"\n')
name='slskprime-action-smoke';base='http://127.0.0.1:15032/api/v0';token=None
image='slskd/slskd@sha256:d0963a3e5b16facd295bf4f2156dad0182f246b1b21a032cae12f5494c694843'
def request(path,method='GET',body=None):
 headers={'Content-Type':'application/json'}
 if token:headers['Authorization']='Bearer '+token
 req=urllib.request.Request(base+path,method=method,headers=headers,data=json.dumps(body).encode() if body is not None else None)
 with urllib.request.urlopen(req,timeout=20) as r:
  raw=r.read();return json.loads(raw) if raw else None
subprocess.run(['docker','run','-d','--name',name,'--user',f'{os.getuid()}:{os.getgid()}','-p','127.0.0.1:15032:5030','-v',str(app)+':/app',image],check=True,capture_output=True)
try:
 for _ in range(45):
  try:token=request('/session','POST',{'username':'smoke','password':password})['token'];break
  except Exception:time.sleep(1)
 else:raise RuntimeError('Isolated service did not start')
 assert not request('/application')['server']['isConnected']
 db=sqlite3.connect(app/'data/transfers.db');cols=db.execute('pragma table_info(Transfers)').fetchall();print('SCHEMA',[(c[1],c[2],c[3]) for c in cols],flush=True)
 ids={};now=datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
 for kind,state in [('done',48),('failed',272),('queued',4098),('active',8)]:
  values={}
  for _,key,typ,notnull,default,pk in cols:
   if notnull and default is None:values[key]=0 if any(t in typ.upper() for t in ['INT','REAL','NUM']) else ''
  values.update(Id=str(uuid.uuid4()).upper(),Direction="Download",Username='smoke-peer',Filename='smoke\\'+kind+'.flac',State=state,Removed=0,Size=128,BytesTransferred=128 if kind=='done' else 16)
  for _,key,typ,notnull,default,pk in cols:
   if key in values and (key.endswith('At') or 'Timestamp' in key):values[key]=now
   if key in values and key in ['Attributes','StateHistory']:values[key]='[]'
  values={k:v for k,v in values.items() if k in [c[1] for c in cols]}
  db.execute('insert into Transfers ('+','.join('"'+k+'"' for k in values)+') values ('+','.join('?' for _ in values)+')',list(values.values()));ids[kind]=values['Id']
 db.commit();db.close()
 def files():return [f for u in request('/transfers/downloads') for d in u['directories'] for f in d['files']]
 before=files();assert len(before)==4,(len(before),before)
 request('/transfers/downloads/all/completed','DELETE');left=files();assert len(left)==2,[f['state'] for f in left]
 for kind in ['queued','active']:
  request('/transfers/downloads/smoke-peer/'+ids[kind]+'?remove=true','DELETE')
 assert files()==[]
 assert not request('/application')['server']['isConnected']
 print('PASS: real backend clears completed, failed, queued and stuck-active records; no Soulseek login, no production mounts.',flush=True)
finally:
 subprocess.run(['docker','rm','-f',name],check=True,capture_output=True)
