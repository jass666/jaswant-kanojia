// netlify/functions/_github.js
//
// Small wrapper around the GitHub Contents API. Reads a file's current
// content + sha, and writes updates back as commits. The PAT never
// leaves this server-side function — it's read from an env var that
// only exists in Netlify's function runtime, never sent to the browser.

const OWNER = process.env.GITHUB_OWNER || "jass666";
const REPO = process.env.GITHUB_REPO || "jaswant-kanojia";
const BRANCH = process.env.GITHUB_BRANCH || "main";

function apiHeaders() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not set in Netlify environment variables");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "jaswant-portfolio-admin",
    "X-GitHub-Api-Version": "2022-11-28"
  };
}

async function getFile(path) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`;
  const res = await fetch(url, { headers: apiHeaders() });
  if (!res.ok) throw new Error(`GitHub GET ${path} failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const content = Buffer.from(data.content, "base64").toString("utf8");
  return { content, sha: data.sha };
}

async function putFile(path, newContentString, sha, message) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;
  const body = {
    message,
    content: Buffer.from(newContentString, "utf8").toString("base64"),
    sha,
    branch: BRANCH
  };
  const res = await fetch(url, {
    method: "PUT",
    headers: { ...apiHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`GitHub PUT ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

module.exports = { getFile, putFile };
