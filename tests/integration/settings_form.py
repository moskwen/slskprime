"""Exercise settings APIs with an isolated official backend; no Soulseek login or production mounts."""
import json, os, pathlib, secrets, subprocess, tempfile, time, urllib.request

root = pathlib.Path(tempfile.mkdtemp(prefix='slskprime-settings-'))
app = root / 'app'
app.mkdir()
for folder in ['complete', 'incomplete', 'share']:
    (app / folder).mkdir()
password = secrets.token_urlsafe(24)
original = ('# preserved configuration\nremote_configuration: true\nflags:\n  no_connect: true\n  no_share_scan: true\n'
            'directories:\n  downloads: /app/complete\n  incomplete: /app/incomplete\n'
            'web:\n  authentication:\n    username: smoke\n    password: "' + password + '"\n')
(app / 'slskd.yml').write_text(original)
name = 'slskprime-settings-' + secrets.token_hex(4)
image = 'slskd/slskd@sha256:d0963a3e5b16facd295bf4f2156dad0182f246b1b21a032cae12f5494c694843'
base = 'http://127.0.0.1:15033/api/v0'
token = None

def request(path, method='GET', body=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    req = urllib.request.Request(base + path, method=method, headers=headers,
                                 data=json.dumps(body).encode() if body is not None else None)
    with urllib.request.urlopen(req, timeout=20) as response:
        result = response.read()
        return json.loads(result) if result else None

subprocess.run(['docker', 'run', '-d', '--name', name, '--user', f'{os.getuid()}:{os.getgid()}',
                '-p', '127.0.0.1:15033:5030', '-v', f'{app}:/app', image], check=True, capture_output=True)
try:
    for attempt in range(45):
        try:
            token = request('/session', 'POST', {'username': 'smoke', 'password': password})['token']
            break
        except Exception:
            time.sleep(1)
    else:
        raise RuntimeError('Isolated service did not start')
    assert not request('/application')['server']['isConnected']
    raw = request('/options/yaml')
    assert raw == original
    updated = raw + 'transfers:\n  upload:\n    speed_limit: 200\nshares:\n  directories:\n    - /app/share\n'
    validation = request('/options/yaml/validate', 'POST', updated)
    assert not validation, validation
    request('/options/yaml', 'PUT', updated)
    for attempt in range(12):
        effective = request('/options')
        if effective['transfers']['upload']['speedLimit'] == 200:
            break
        time.sleep(1)
    assert effective['transfers']['upload']['speedLimit'] == 200
    assert effective['directories'] == {'downloads': '/app/complete', 'incomplete': '/app/incomplete'}
    assert effective['shares']['directories'] == ['/app/share']
    assert request('/options/yaml') == updated
    assert not request('/application')['server']['isConnected']
    print('PASS: validate/save/reload settings; credentials, download paths and no-connect flags preserved.')
finally:
    subprocess.run(['docker', 'rm', '-f', name], check=True, capture_output=True)
