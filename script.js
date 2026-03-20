const form = document.querySelector("#search-form");
const usernameInput = document.querySelector("#username");
const feedback = document.querySelector("#form-feedback");
const profilePanel = document.querySelector("#profile-panel");
const quickSearchButtons = document.querySelectorAll("[data-username]");

function setFeedback(message, tone = "neutral") {
  if (!feedback) {
    return;
  }

  feedback.textContent = message;
  feedback.dataset.tone = tone;
}

function renderLoadingState() {
  profilePanel.innerHTML = `
    <div class="loading-state">
      <span class="state-tag">Loading</span>
      <div class="loading-bar"></div>
      <div class="loading-bar short"></div>
      <div class="loading-bar medium"></div>
    </div>
  `;
}

function renderEmptyState(title, description, tag = "Ready") {
  profilePanel.innerHTML = `
    <div class="empty-state">
      <span class="state-tag">${tag}</span>
      <h2>${title}</h2>
      <p>${description}</p>
    </div>
  `;
}

function buildMetaLine(label, value) {
  if (!value) {
    return "";
  }

  if (label === "Website") {
    const normalizedValue = String(value).startsWith("http") ? value : `https://${value}`;
    return `<div class="meta-line"><strong>${label}:</strong> <a href="${normalizedValue}" target="_blank" rel="noreferrer">${value}</a></div>`;
  }

  return `<div class="meta-line"><strong>${label}:</strong> ${value}</div>`;
}

function formatRepoLanguage(language) {
  return language || "No language";
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function renderProfile(user, repositories) {
  const repoCards = repositories.length
    ? repositories
        .map(
          (repository) => `
            <article class="repo-card">
              <h3>${repository.name}</h3>
              <p>${repository.description || "No description provided for this repository yet."}</p>
              <div class="repo-meta">
                <span class="meta-pill">${formatRepoLanguage(repository.language)}</span>
                <span class="meta-pill">Updated ${formatDate(repository.updated_at)}</span>
              </div>
              <a class="repo-link" href="${repository.html_url}" target="_blank" rel="noreferrer">Open repository</a>
            </article>
          `
        )
        .join("")
    : `
      <article class="repo-card">
        <h3>No repositories to preview</h3>
        <p>This profile does not expose recent public repositories at the moment.</p>
      </article>
    `;

  profilePanel.innerHTML = `
    <div class="profile-header">
      <img class="profile-avatar" src="${user.avatar_url}" alt="Avatar for ${user.login}" />
      <div>
        <h2 class="profile-name">${user.name || user.login}</h2>
        <p class="profile-handle">@${user.login}</p>
        <p class="profile-bio">${user.bio || "No bio available for this account."}</p>
        <div class="profile-metadata">
          ${buildMetaLine("Location", user.location)}
          ${buildMetaLine("Company", user.company)}
          ${buildMetaLine("Website", user.blog)}
        </div>
      </div>
    </div>

    <div class="stats-grid">
      <article class="stat-card">
        <strong>${user.public_repos}</strong>
        <span>public repositories</span>
      </article>
      <article class="stat-card">
        <strong>${user.followers}</strong>
        <span>followers</span>
      </article>
      <article class="stat-card">
        <strong>${user.following}</strong>
        <span>following</span>
      </article>
    </div>

    <h3 class="section-title">Recent repositories</h3>
    <div class="repo-grid">${repoCards}</div>

    <a class="profile-link" href="${user.html_url}" target="_blank" rel="noreferrer">Open GitHub profile</a>
  `;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
    },
  });

  if (response.status === 404) {
    throw new Error("Profile not found. Try another username.");
  }

  if (response.status === 403) {
    throw new Error("GitHub rate limit reached. Please try again in a moment.");
  }

  if (!response.ok) {
    throw new Error("GitHub request failed. Please try again.");
  }

  return response.json();
}

async function searchUser(username) {
  renderLoadingState();
  setFeedback(`Searching for ${username}...`, "loading");

  try {
    const [user, repositories] = await Promise.all([
      fetchJson(`https://api.github.com/users/${encodeURIComponent(username)}`),
      fetchJson(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=4`),
    ]);

    renderProfile(user, repositories);
    setFeedback(`Profile loaded for ${user.login}.`, "success");
  } catch (error) {
    renderEmptyState("Could not load this profile", error.message, "Error");
    setFeedback(error.message, "error");
  }
}

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  const username = usernameInput.value.trim();
  if (!username) {
    renderEmptyState("Type a username first", "The search form needs a public GitHub username before it can fetch any data.", "Input");
    setFeedback("Please type a GitHub username.", "error");
    usernameInput.focus();
    return;
  }

  searchUser(username);
});

quickSearchButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const username = button.dataset.username || "";
    usernameInput.value = username;
    searchUser(username);
  });
});
