from PIL import Image
img = Image.open(r"C:\Users\irina\.gemini\antigravity\brain\aeb49f28-0030-45f0-8663-acfc7b217958\uploaded_media_1780365741683.png")
rgb = img.convert('RGB').getpixel((10, 10))
print(f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}")
