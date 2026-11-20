import { describe, it, expect } from "vitest";
import {
  extractKundliSections5And6,
  sanitizeTextForTTS,
} from "../lib/voice/kundli-voice-parser";

describe("Kundli Voice Parser (Sections 5 & 6 Extraction & Sanitization)", () => {
  const hindiReport = `
### 1. आपका प्रश्न
जातक का व्यक्तिगत प्रश्न।

### 2. संक्षेप में उत्तर
आपकी कुंडली में मजबूत योग हैं।

### 3. आपकी कुंडली क्या दर्शाती है
10-वें भाव में मंगल और सूर्य उपस्थित हैं।

### 4. आपके लिए इसका क्या अर्थ है
यह समय कर्म और पुरुषार्थ के लिए शुभ है।

### 5. मुख्य बिंदु
- **शनि-महादशा** — दीर्घ-कालिक लक्ष्य-निर्धारण, शिक्षा-विकास और कर्तव्य-परायणता पर बल।
- **4-था भाव (मंगल-बृहस्पति-केतु)** — घर-परिवार एवं व्यक्तिगत शक्ति में साहस और विस्तार-दृष्टि, साथ ही आध्यात्मिक मुक्ति की संभावना।
- **11-वाँ भाव (चंद्र-शनि)** — मित्र-मण्डली, आध्यात्मिक समूह एवं सामाजिक लाभों में भावनात्मक स्थिरता और कर्तव्य-भाव।
- **10-वाँ भाव (राहु)** — करियर में नवाचार, सार्वजनिक पहचान और अप्रत्याशित अवसर; परन्तु सतर्कता व नैतिकता बनाए रखना आवश्यक।

### 6. व्यावहारिक मार्गदर्शन
- **अनुशासन बनाए रखें:** दैनिक समय-सारिणी बनाएँ, विशेषकर पढ़ाई या कार्य-स्थल पर नियमितता रखें। शनि की ऊर्जा इसको सुदृढ़ करेगी।
- **शारीरिक स्वास्थ्य:** वृषभ लग्न के कारण शरीर में स्थिरता की प्रवृत्ति होती है; नियमित व्यायाम (जैसे योग, चलना) और संतुलित आहार से ऊर्जा बनी रहेगी।
- **आत्म-विकास:** ध्यान, प्राणायाम या वैदिक मंत्र (जैसे "ॐ शं शनये नमः") का अभ्यास शनि-दशा में मानसिक शांति और धैर्य बढ़ाएगा।
- **संबंधों में धैर्य:** 11-वें भाव में शनि के कारण मित्र-परिसर में समय-समय पर परीक्षण हो सकते हैं; समझदारी और सहनशीलता से संबंध मजबूत होंगे।

### 7. परंपरा व संदर्भ
यह स्पष्ट करें कि जन्म कुंडली जीवन की संभावनाओं का आकाशीय मानचित्र है, अटल भाग्य नहीं। मनुष्य का पुरुषार्थ, कर्म और विवेक ही सर्वोपरि है।
`;

  const englishReport = `
### 1. Your Question
How will my career unfold in the current dasha?

### 2. Simple Answer
Your chart indicates strong leadership qualities and gradual professional elevation.

### 3. What Your Kundli Shows
The 10th house is occupied by Mars, with Saturn aspecting from the 4th house.

### 4. What This Means for You
You possess natural drive and discipline to tackle ambitious responsibilities.

### 5. Important Points
- **Mars in 10th House:** Extraordinary professional focus and initiative.
- **Saturn Influence:** Demands consistency and patience in early ventures.
- **Jupiter Aspect:** Provides ethical grounding and sound judgment.

### 6. Practical Guidance
- **Establish Daily Routines:** Maintain a structured morning planning routine to prioritize core objectives.
- **Collaborative Leadership:** Solicit input from colleagues before executing major project changes.
- **Mindful Recovery:** Ensure 7 hours of consistent sleep to sustain cognitive stamina.

### 7. Limitations & Context
Vedic astrology represents astronomical potentials, not a fixed destiny. Conscious agency guides your path.
`;

  it("extracts only Section 5 and Section 6 from Hindi Kundli reports", () => {
    const extracted = extractKundliSections5And6(hindiReport);
    expect(extracted).not.toBeNull();
    expect(extracted).toContain("5. मुख्य बिंदु");
    expect(extracted).toContain("शनि-महादशा");
    expect(extracted).toContain("6. व्यावहारिक मार्गदर्शन");
    expect(extracted).toContain("अनुशासन बनाए रखें");

    // Strictly excludes other sections
    expect(extracted).not.toContain("1. आपका प्रश्न");
    expect(extracted).not.toContain("2. संक्षेप में उत्तर");
    expect(extracted).not.toContain("3. आपकी कुंडली क्या दर्शाती है");
    expect(extracted).not.toContain("4. आपके लिए इसका क्या अर्थ है");
    expect(extracted).not.toContain("7. परंपरा व संदर्भ");
  });

  it("extracts only Section 5 and Section 6 from English Kundli reports", () => {
    const extracted = extractKundliSections5And6(englishReport);
    expect(extracted).not.toBeNull();
    expect(extracted).toContain("5. Important Points");
    expect(extracted).toContain("Mars in 10th House");
    expect(extracted).toContain("6. Practical Guidance");
    expect(extracted).toContain("Establish Daily Routines");

    // Strictly excludes other sections
    expect(extracted).not.toContain("1. Your Question");
    expect(extracted).not.toContain("2. Simple Answer");
    expect(extracted).not.toContain("3. What Your Kundli Shows");
    expect(extracted).not.toContain("4. What This Means for You");
    expect(extracted).not.toContain("7. Limitations & Context");
  });

  it("returns null when Section 5 or Section 6 is missing", () => {
    const incomplete1 = `
### 1. Question
Hello
### 2. Answer
World
`;
    expect(extractKundliSections5And6(incomplete1)).toBeNull();

    const incomplete2 = `
### 5. Important Points
- Just point 1
- Just point 2
`;
    expect(extractKundliSections5And6(incomplete2)).toBeNull();
  });

  it("sanitizes markdown symbols and bullet markers for fluent TTS playback", () => {
    const extracted = extractKundliSections5And6(hindiReport)!;
    const sanitized = sanitizeTextForTTS(extracted);

    // Markdown symbols stripped
    expect(sanitized).not.toContain("###");
    expect(sanitized).not.toContain("**");
    expect(sanitized).not.toMatch(/^[\s*•\-+>]/m);

    // Content preserved
    expect(sanitized).toContain("5. मुख्य बिंदु");
    expect(sanitized).toContain("शनि-महादशा");
    expect(sanitized).toContain("6. व्यावहारिक मार्गदर्शन");
    expect(sanitized).toContain("अनुशासन बनाए रखें");
  });

  it("sanitizes English report for fluent TTS playback", () => {
    const extracted = extractKundliSections5And6(englishReport)!;
    const sanitized = sanitizeTextForTTS(extracted);

    expect(sanitized).not.toContain("###");
    expect(sanitized).not.toContain("**");
    expect(sanitized).toContain("5. Important Points");
    expect(sanitized).toContain("Mars in 10th House: Extraordinary professional focus");
    expect(sanitized).toContain("6. Practical Guidance");
    expect(sanitized).toContain("Establish Daily Routines");
  });

  it("extracts exact user mobile screenshot Kundli text and sanitizes correctly", () => {
    const mobileReport = `
4. आपके लिए इसका क्या अर्थ है
मिश्रण को दर्शाता है, जिसमें घर-परिवार एवं सामाजिक प्रतिष्ठा दोनों ही महत्वपूर्ण भूमिका निभाते हैं।

5. मुख्य बिंदु

शनि-महादशा – दीर्घ-कालिक लक्ष्य-निर्धारण, शिक्षा-विकास और कर्तव्य-परायणता पर बल।
4-था भाव (मंगल-बृहस्पति-केतु) – घर-परिवार एवं व्यक्तिगत शक्ति में साहस और विस्तार-दृष्टि, साथ ही आध्यात्मिक मुक्ति की संभावना।
11-वाँ भाव (चंद्र-शनि) – मित्र-मण्डली, आध्यात्मिक समूह एवं सामाजिक लाभों में भावनात्मक स्थिरता और कर्तव्य-भाव।
10-वाँ भाव (राहु) – करियर में नवाचार, सार्वजनिक पहचान और अप्रत्याशित अवसर; परन्तु सतर्कता व नैतिकता बनाए रखना आवश्यक।

6. व्यावहारिक मार्गदर्शन

अनुशासन बनाए रखें: दैनिक समय-सारिणी बनाएँ, विशेषकर पढ़ाई या कार्य-स्थल पर नियमितता रखें। शनि की ऊर्जा इसको सुदृढ़ करेगी।
शारीरिक स्वास्थ्य: वृषभ लग्न के कारण शरीर में स्थिरता की प्रवृत्ति होती है; नियमित व्यायाम (जैसे योग, चलना) और संतुलित आहार से ऊर्जा बनी रहेगी।
आत्म-विकास: ध्यान, प्राणायाम या वैदिक मंत्र (जैसे "ॐ शं शनैश्चराय नमः") का अभ्यास शनि-दशा में मानसिक शांति और धैर्य बढ़ाएगा।
संबंधों में धैर्य: 11-वें भाव में शनि के कारण मित्र-परिसर में समय-समय पर परीक्षण हो सकते हैं; समझदारी और सहनशीलता से संबंध मजबूत होंगे।
करियर-प्रेरणा: राहु 10-वें भाव में होने से नई तकनीक, ...
`;

    const extracted = extractKundliSections5And6(mobileReport);
    expect(extracted).not.toBeNull();
    expect(extracted).toContain("5. मुख्य बिंदु");
    expect(extracted).toContain("6. व्यावहारिक मार्गदर्शन");
    expect(extracted).toContain("शनि-महादशा");
    expect(extracted).toContain("आत्म-विकास");

    // Strictly excludes Section 4
    expect(extracted).not.toContain("4. आपके लिए इसका क्या अर्थ है");
    expect(extracted).not.toContain("मिश्रण को दर्शाता है");

    const sanitized = sanitizeTextForTTS(extracted!);
    expect(sanitized).toContain("5. मुख्य बिंदु");
    expect(sanitized).toContain("6. व्यावहारिक मार्गदर्शन");
    expect(sanitized).not.toContain("—"); // converted to comma pause
  });

  it("handles different heading styles (##, **, plain numbers)", () => {
    const boldNumberedReport = `
**5. Key Highlights**
* Point Alpha: Leading strategic vision.
* Point Beta: Financial expansion.

**6. Actionable Advice**
* First step: Review quarterly targets.
* Second step: Prioritize meditation.

**7. Vedic Epilogue**
Ancient texts remind us that free will guides destiny.
`;

    const extracted = extractKundliSections5And6(boldNumberedReport);
    expect(extracted).not.toBeNull();
    expect(extracted).toContain("5. Key Highlights");
    expect(extracted).toContain("Point Alpha");
    expect(extracted).toContain("6. Actionable Advice");
    expect(extracted).not.toContain("7. Vedic Epilogue");
    expect(extracted).not.toContain("Ancient texts");

    const sanitized = sanitizeTextForTTS(extracted!);
    expect(sanitized).not.toContain("**");
    expect(sanitized).not.toContain("*");
    expect(sanitized).toContain("Point Alpha: Leading strategic vision");
  });
});
