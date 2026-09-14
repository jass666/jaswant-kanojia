// netlify/functions/projects.js
// GET  -> current projects.json (array)
// PUT  -> body: full replacement array. Validates, commits to GitHub.
// Both require a logged-in Netlify Identity user matching ADMIN_EMAIL.

const { getFile, putFile } = require("./_github");

const PATH = "data/projects.json";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL; // set this in Netlify env vars

function requireAdmin(context) {
  const user = context.clientContext && context.clientContext.user;
  if (!user) return { ok: false, status: 401, message: "Not logged in" };
  if (ADMIN_EMAIL && user.email !== ADMIN_EMAIL) {
    return { ok: false, status: 403, message: "Not authorized" };
  }
  return { ok: true, user };
}

function validateProjects(payload) {
  if (!Array.isArray(payload)) return "Payload must be an array";
  for (const [i, p] of payload.entries()) {
    for (const field of ["note", "name", "desc", "domain", "url"]) {
      if (typeof p[field] !== "string" || !p[field].trim()) {
        return `Project ${i + 1}: "${field}" is required`;
      }
    }
    if (!/^https?:\/\//.test(p.url)) return `Project ${i + 1}: "url" must start with http(s)://`;
  }
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
    const err = validateProjects(payload);
    if (err) return { statusCode: 400, body: err };

    const { sha } = await getFile(PATH);
    const newContent = JSON.stringify(payload, null, 2) + "\n";
    await putFile(PATH, newContent, sha, `Update projects.json via admin (${auth.user.email})`);
    return { statusCode: 200, body: "OK" };
  }

  return { statusCode: 405, body: "Method not allowed" };
};
