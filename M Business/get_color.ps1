Add-Type -AssemblyName System.Drawing
 = [System.Drawing.Image]::FromFile('C:\Users\irina\.gemini\antigravity\brain\aeb49f28-0030-45f0-8663-acfc7b217958\uploaded_media_1780365741683.png')
 = New-Object System.Drawing.Bitmap()
 = .GetPixel(10, 10)
Write-Output ("#{0:X2}{1:X2}{2:X2}" -f .R, .G, .B)
.Dispose()
.Dispose()
