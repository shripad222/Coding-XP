import os

try:
    from gtts import gTTS
except Exception as e:
    print("gTTS (google text-to-speech) is not available in this Python environment.")
    print("To generate audio files locally, install gTTS: pip install gTTS")
    print("Alternatively, pre-generate MP3s and place them under public/audio/")
    raise


phrases = {
    "prompt_en": ("Please choose your language", "en"),
    "prompt_hi": ("कृपया अपनी भाषा चुनें", "hi"),
    "prompt_mr": ("कृपया आपली भाषा निवडा", "mr"),
    "confirm_en": ("You selected English.", "en"),
    "confirm_hi": ("आपने हिंदी चुनी है।", "hi"),
    "confirm_mr": ("आपण मराठी निवडली आहे.", "mr")
}

os.makedirs("public/audio", exist_ok=True)

for name, (text, lang) in phrases.items():
    print(f"Generating {name}.mp3 ({lang})...")
    try:
        gTTS(text=text, lang=lang, tld="co.in").save(f"public/audio/{name}.mp3")
    except Exception as e:
        print(f"Failed to generate {name}.mp3: {e}")