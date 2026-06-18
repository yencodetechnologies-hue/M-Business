$file = 'c:\M Business\M Business\src\components\SubAdminDashboard.jsx'

# Read file as raw bytes
$bytes = [System.IO.File]::ReadAllBytes($file)

# The broken emojis happen because the file contains UTF-8 bytes but was read as Latin-1/Windows-1252
# Re-interpret: read bytes as Latin-1, then get UTF-8 interpretation
$iso = [System.Text.Encoding]::GetEncoding('iso-8859-1')

$text = $iso.GetString($bytes)

# Now convert back: encode the latin-1 string to get the actual bytes, then decode as UTF-8
$rawBytes = $iso.GetBytes($text)
$fixedText = [System.Text.Encoding]::UTF8.GetString($rawBytes)

[System.IO.File]::WriteAllText($file, $fixedText, [System.Text.Encoding]::UTF8)
Write-Host "Done! File re-encoded."
