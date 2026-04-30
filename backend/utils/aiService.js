const axios = require("axios");
const FormData = require("form-data");

/**
 * AI Service Utility for communicating with the FastAPI face recognition service.
 */

const fastapi = axios.create({
  baseURL: process.env.FASTAPI_URL || "http://127.0.0.1:8000",
  timeout: 120000,
  maxBodyLength: Infinity,
  maxContentLength: Infinity,
});

// Interceptors for logging
fastapi.interceptors.request.use((config) => {
  console.log(`\n📤 [AI Service] ${config.method.toUpperCase()} ${config.url}`);
  return config;
});

fastapi.interceptors.response.use(
  (res) => {
    console.log(`✅ [AI Service] Success (${res.status})`);
    return res;
  },
  (err) => {
    console.error(`❌ [AI Service] Error: ${err.message}`, err.response?.data);
    return Promise.reject(err);
  }
);

/**
 * Extract embedding from a face image.
 * @param {Buffer} imageBuffer
 * @param {string} mimetype
 * @param {string} userId
 */
exports.extractEmbedding = async (imageBuffer, mimetype, userId) => {
  const form = new FormData();
  form.append("image", imageBuffer, { filename: "face.jpg", contentType: mimetype });
  if (userId) form.append("user_id", userId.toString());

  try {
    const { data } = await fastapi.post("/extract-embedding", form, {
      headers: form.getHeaders(),
    });

    if (!data?.embedding) throw new Error("No embedding returned from AI service");
    return data.embedding;
  } catch (err) {
    const status = err.response?.status;
    const detail = err.response?.data?.detail;

    if (status === 400) throw new Error(detail || "No face detected in image");
    if (status === 422) throw new Error("Invalid image format sent to AI service");
    if (status === 404) throw new Error("Embedding endpoint not found — check FASTAPI_URL");

    throw new Error(err.message || "AI service failed during embedding extraction");
  }
};

/**
 * Compare an image against a set of stored embeddings.
 * @param {Buffer} imageBuffer
 * @param {string} mimetype
 * @param {Object} storedEmbeddings { userId: [embedding] }
 * @returns {Object|null} { user_id, confidence } or null if face not recognized
 */
exports.compareFace = async (imageBuffer, mimetype, storedEmbeddings) => {
  const form = new FormData();
  form.append("image", imageBuffer, { filename: "face.jpg", contentType: mimetype });
  form.append("stored_embeddings", JSON.stringify(storedEmbeddings));

  try {
    const { data } = await fastapi.post("/compare-embeddings", form, {
      headers: form.getHeaders(),
    });

    return data; // { success, user_id, confidence }
  } catch (err) {
    const status = err.response?.status;
    const detail = err.response?.data?.detail;

    // 404 from AI = face not recognized — return null so controller handles it cleanly
    if (status === 404) {
      console.log(`🔍 [AI Service] Face not recognized (404): ${detail}`);
      return null;
    }

    if (status === 400) throw new Error(detail || "No face detected in image");
    if (status === 422) throw new Error("Invalid image format sent to AI service");

    // Real server/network error — bubble up
    throw new Error(err.message || "AI service failed during face comparison");
  }
};

/**
 * Health check for the AI service.
 */
exports.checkHealth = async () => {
  try {
    const { data } = await fastapi.get("/health");
    return data;
  } catch (err) {
    return { status: "unhealthy", error: err.message };
  }
};