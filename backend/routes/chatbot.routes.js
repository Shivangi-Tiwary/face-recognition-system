const express = require("express");
const router = express.Router();

// ─── KNOWLEDGE BASE ─────────────────────────────
const KB = [
  {
    intent: "greeting",
    keys: ["hi", "hello", "hey", "hii"],
    reply: "Hi! I can help you with face login, registration, and fixing issues.",
    suggestions: ["Face login", "Register face", "Face not working"]
  },
  {
    intent: "login",
    keys: ["login", "sign in", "face login", "log in"],
    reply: "To log in, look at the camera. Make sure lighting is good and face is clearly visible.",
    suggestions: ["Face not recognized", "Register face"]
  },
  {
    intent: "register",
    keys: ["register", "signup", "enroll", "add face", "register face"],
    reply: "Go to the registration page and capture your face clearly from the front.",
    suggestions: ["How many photos?", "Update face"]
  },
  {
    intent: "photos",
    keys: ["how many photos", "photos", "images", "pictures"],
    reply: "You should capture 5–10 clear images of your face for best accuracy.",
    suggestions: ["Lighting tips", "Update face"]
  },
  {
    intent: "update",
    keys: ["update face", "change face", "re register", "new face"],
    reply: "To update your face, go to profile settings and re-capture your face data.",
    suggestions: ["Register face", "Lighting tips"]
  },
  {
    intent: "error",
    keys: ["not working", "fail", "error", "not recognized", "failed"],
    reply: "If recognition fails, ensure good lighting, remove glasses/mask, and try again.",
    suggestions: ["Re-register face", "Lighting tips"]
  },
  {
    intent: "lighting",
    keys: ["lighting", "light", "dark"],
    reply: "Use bright, even lighting. Avoid shadows or strong backlight.",
    suggestions: ["Face login", "Register face"]
  },
  {
    intent: "admin",
    keys: ["admin", "dashboard"],
    reply: "Admin panel allows monitoring users, logs, and system activity.",
    suggestions: ["View logs", "User management"]
  },
  {
    intent: "help",
    keys: ["help", "support", "what can you do"],
    reply: "I can help with login, registration, errors, and face recognition setup.",
    suggestions: ["Face login", "Register face", "Face not working"]
  }
];

// ─── MATCH FUNCTION ────────────────────────────
function findBestMatch(message) {
  const msg = message.toLowerCase();

  let best = null;
  let maxScore = 0;

  for (const item of KB) {
    let score = 0;

    for (const key of item.keys) {
      if (msg.includes(key)) {
        score += key.length;
      }
    }

    // smart boosts
    if (msg.includes("face") && msg.includes("login")) score += 10;
    if (msg.includes("face") && msg.includes("register")) score += 10;

    if (score > maxScore) {
      maxScore = score;
      best = item;
    }
  }

  return best;
}

// ─── SMART FALLBACK ────────────────────────────
function smartFallback(message) {
  const msg = message.toLowerCase();

  if (msg.includes("face")) {
    return {
      reply: "Are you asking about face login or face registration?",
      suggestions: ["Face login", "Register face"]
    };
  }

  if (msg.includes("how")) {
    return {
      reply: "Can you be a bit more specific? I can guide you step-by-step.",
      suggestions: ["Face login", "Register face", "Fix errors"]
    };
  }

  return {
    reply: "I can help with face login, registration, and fixing issues.",
    suggestions: ["Face login", "Register face", "Help"]
  };
}

// ─── ROUTE ────────────────────────────────────
router.post("/", (req, res) => {
  try {
    const { message } = req.body;

    console.log("🔥 CHATBOT HIT:", message);

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const match = findBestMatch(message);

    if (match) {
      return res.json({
        reply: match.reply,
        suggestions: match.suggestions
      });
    }

    // smarter fallback instead of dumb reply
    return res.json(smartFallback(message));

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;