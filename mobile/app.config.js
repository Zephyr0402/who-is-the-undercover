/**
 * Expo dynamic config.
 *
 * The production website is reverse-proxied by Caddy at
 * https://www.bvshen.com/who-is-the-undercover/ with the prefix stripped
 * before requests reach FastAPI. Setting `experiments.baseUrl` makes the
 * exported HTML/JS reference its assets under that prefix, so the browser
 * (which does not know about the strip) resolves them correctly.
 *
 * The Docker build sets WIU_WEB_BASE_URL; local exports leave it empty and
 * are served from the domain root.
 */
module.exports = ({ config }) => {
  const baseUrl = (process.env.WIU_WEB_BASE_URL || "").trim().replace(/\/+$/, "");
  const experiments = { ...(config.experiments || {}) };

  if (baseUrl) {
    experiments.baseUrl = baseUrl;
  } else {
    delete experiments.baseUrl;
  }

  return {
    ...config,
    experiments,
  };
};
