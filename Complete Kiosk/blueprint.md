## 🧩 **Structured Prompt for Kiosk Multilingual Interface (Free TTS + STT)**

---

### **🎯 Goal**

Build a **multilingual kiosk interface** (English, Hindi, Marathi) using **Next.js** and **Firebase**, that:

1. **Speaks** to the user (“Please choose your language”) in all three languages.
2. Lets the user **select** their language either by **clicking** or **speaking** (e.g., saying “Marathi”).
3. Uses **only free tools** — no paid Google Cloud APIs.

---

### **🧠 System Overview**

| Feature              | Tool / Library               | Free | Purpose                                                 |
| -------------------- | ---------------------------- | ---- | ------------------------------------------------------- |
| Text-to-Speech (TTS) | **gTTS** (Python library)    | ✅    | Converts welcome & confirmation text into MP3 audio     |
| Speech-to-Text (STT) | **Web Speech API** (browser) | ✅    | Detects when user says “English”, “Hindi”, or “Marathi” |
| Frontend             | **Next.js (React)**          | ✅    | Displays language buttons & handles navigation          |
| Hosting / Database   | **Firebase**                 | ✅    | Hosts the kiosk web app                                 |

---

### **🪄 Step-by-Step Logic**

#### **Step 1 – Welcome Prompt**

* When the kiosk starts, it plays an audio message in **English, Hindi, and Marathi**, saying:

  > “Please choose your language / कृपया अपनी भाषा चुनें / कृपया आपली भाषा निवडा”
* Text for all three languages is displayed on screen.

---

#### **Step 2 – Audio Generation (Text-to-Speech using gTTS)**

Use Python’s **gTTS** to pre-generate fixed audio prompts.

```python
from gtts import gTTS
import os

phrases = {
    "prompt_en": ("Please choose your language", "en"),
    "prompt_hi": ("कृपया अपनी भाषा चुनें", "hi"),
    "prompt_mr": ("कृपया आपली भाषा निवडा", "mr"),
    "confirm_en": ("You selected English.", "en"),
    "confirm_hi": ("आपने हिंदी चुनी है।", "hi"),
    "confirm_mr": ("आपण मराठी निवडली आहे.", "mr")
}

os.makedirs("audio", exist_ok=True)

for name, (text, lang) in phrases.items():
    gTTS(text=text, lang=lang, tld="co.in").save(f"audio/{name}.mp3")
```

✅ **Output:** MP3 files inside `/audio` folder
➡️ Move them to your Next.js `public/audio` directory

---

#### **Step 3 – Display 3 Buttons (Next.js UI)**

Show buttons:

* **English**
* **हिंदी**
* **मराठी**

And also start **speech recognition** in parallel.

---

#### **Step 4 – Speech Input (Web Speech API)**

Use browser’s free **Web Speech API** to listen for language names.

```js
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = "en-IN";
recognition.start();

recognition.onresult = (event) => {
  const speech = event.results[0][0].transcript.toLowerCase();
  if (speech.includes("english")) selectLang("en");
  else if (speech.includes("hindi") || speech.includes("हिंदी")) selectLang("hi");
  else if (speech.includes("marathi") || speech.includes("मराठी")) selectLang("mr");
};
```

---

#### **Step 5 – Handle Selection**

* When a user **clicks or speaks**, play the corresponding confirmation audio:

  * `/audio/confirm_en.mp3`
  * `/audio/confirm_hi.mp3`
  * `/audio/confirm_mr.mp3`
* Then redirect to `/next?lang=<selected>` for localized flow.

---

### **💡 Technical Notes**

* `gTTS` requires internet only once (to create MP3).
* Playback and recognition happen **offline** in the kiosk browser.
* Works perfectly in **Chrome kiosk mode**.
* If recognition fails, replay the welcome prompt.

---

### **📂 Project File Summary**

| File                         | Purpose                                 |
| ---------------------------- | --------------------------------------- |
| `generate_audio.py`          | Python script to create audio files     |
| `public/audio/*.mp3`         | Pre-generated speech files              |
| `pages/LanguageSelector.jsx` | Next.js component with UI + voice logic |
| `firebase.json`              | Firebase hosting config                 |
| `firestore.rules`            | (optional) For analytics or logs        |

---

### **🚀 Flow Summary**

1. User approaches kiosk.
2. Kiosk plays multilingual audio prompt.
3. User either:

   * Clicks their preferred language button, **or**
   * Speaks “English”, “Hindi”, or “Marathi”.
4. Kiosk confirms with voice feedback.
5. Navigates to next localized screen.

---

### **🧱 Firebase Studio Explanation**

> The kiosk runs a Next.js web app hosted on Firebase.
> When launched, it automatically plays pre-generated audio prompts using gTTS files.
> It listens for voice input using the browser’s Web Speech API to detect spoken language names.
> Once recognized, Firebase routing redirects to the appropriate localized content page.
> All TTS and STT services used are free and require no paid API keys.

---

## 🖥️ Kiosk User Flow Prompt

### **1️⃣ Login Flow**

**Objective:** User accesses the system using either a **User ID** or a **QR code**.

**Prompt / Instructions for Kiosk:**

1. **Welcome Screen:**

   * Display: “Welcome! Please log in to access your health dashboard.”
   * Show two options:

     * **Option 1:** Enter User ID manually
     * **Option 2:** Scan QR code

2. **If User chooses User ID:**

   * Display input field: “Enter your User ID”
   * Button: **Submit**
   * On submit → Validate User ID → If valid → Go to **Main Dashboard**
   * If invalid → Show error: “User not found. Please register first.”

3. **If User chooses QR scan:**

   * Activate camera → Scan QR code
   * Extract **User ID** from QR code
   * Validate User ID → If valid → Go to **Main Dashboard**
   * If invalid → Show: “QR not recognized. Please register first.”

4. **Main Dashboard Access:**

   * Once logged in, show health metrics dashboard: BP, Sugar, Heart Rate, etc.

---

### **2️⃣ Registration Flow**

**Objective:** User creates a profile **manually** or via **Aadhaar card photo** if illiterate.

**Prompt / Instructions for Kiosk:**

1. **Welcome Screen:**

   * Display: “New User? Please register to start monitoring your health.”
   * Options:

     * **Manual Registration**
     * **Register via Aadhaar Card**

2. **Manual Registration:**

   * Input fields:

     * Name
     * Phone Number
     * Age
     * Gender (Dropdown or Icons)
   * Button: **Submit**
   * Generate **unique User ID** → Display QR code for future login

3. **Aadhaar Card Registration (for illiterate users):**

   * Instruction: “Please hold your Aadhaar card near the camera. The kiosk will capture it automatically.”
   * Steps:

     * Activate camera → Detect card → Capture image
     * Use OCR (Optical Character Recognition) to extract:

       * Name
       * Age / DOB
       * Gender
       * Aadhaar Number (optional for backend)
     * Confirm extracted details with user (show on screen) → User clicks **Confirm**
     * Generate **unique User ID** → Display QR code for future login

4. **Confirmation Screen:**

   * Display: “Registration Successful!”
   * Show User ID & QR code
   * Button: **Go to Dashboard**

---

### **3️⃣  User Experience**

* Add **voice prompts** (optional) to guide illiterate users:

  * “Welcome! Please scan your QR code to login or press register to create a new account.”
* Keep **buttons large** and **icons intuitive**

---
