// netlify/functions/resume.js
// GET  -> current resume-data.json (object)
// PUT  -> body: full replacement object. Light validation, commits to GitHub.
// Both require a logged-in Netlify Identity user matching ADMIN_EMAIL.

const { getFile, putFile } = require("./_github");

const PATH = "data/resume-data.json";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

function requireAdmin(context) {
  const user = context.clientContext && context.clientContext.user;
  if (!user) return { ok: false, status: 401, message: "Not logged in" };
  if (ADMIN_EMAIL && user.email !== ADMIN_EMAIL) {
    return { ok: false, status: 403, message: "Not authorized" };
  }
  return { ok: true, user };
}

function validateResume(payload) {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return "Payload must be a JSON object";
  }
  for (const field of ["name", "title", "tagline", "executiveSummary"]) {
    if (typeof payload[field] !== "string" || !payload[field].trim()) {
      return `"${field}" is required and must be a non-empty string`;
    }
  }
  for (const field of ["impactSnapshot", "coreExpertise", "techStack", "experience", "infrastructure", "education"]) {
    if (!Array.isArray(payload[field])) return `"${field}" must be an array`;
  }
  if (!payload.contact || typeof payload.contact !== "object") return `"contact" must be an object`;
  return null;
}

exports.handler = async (event, context) => {
  const auth = requireAdmin(context);
  if (!auth.ok) return { statusCode: auth.status, body: auth.message };

  if (event.httpMethod === "GET") {
    const { content } = await getFile(PATH);
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: content };
  }

  if (event.httpMethod === "PUT") {
    let payload;
    try {
      payload = JSON.parse(event.body);
    } catch {
      return { statusCode: 400, body: "Invalid JSON" };
    }
    const err = validateResume(payload);
    if (err) return { statusCode: 400, body: err };

    const { sha } = await getFile(PATH);
    const newContent = JSON.stringify(payload, null, 2) + "\n";
    await putFile(PATH, newContent, sha, `Update resume-data.json via admin (${auth.user.email})`);
    return { statusCode: 200, body: "OK" };
  }

  return { statusCode: 405, body: "Method not allowed" };
};
