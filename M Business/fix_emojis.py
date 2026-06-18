import sys
sys.stdout.reconfigure(encoding='utf-8')

filepath = r'c:\M Business\M Business\src\components\SubAdminDashboard.jsx'

# Read raw bytes
with open(filepath, 'rb') as f:
    raw = f.read()

print(f"File size: {len(raw)} bytes", flush=True)

# Find exact bytes around line 414 (icons line)
# Search for "icons = { client:" in bytes
marker = b'icons = { client:'
idx = raw.find(marker)
print(f"Found 'icons' at byte: {idx}", flush=True)
if idx >= 0:
    chunk = raw[idx:idx+200]
    print(f"Bytes: {chunk.hex()}", flush=True)
    print(f"As latin1: {chunk.decode('latin-1', errors='replace')}", flush=True)
