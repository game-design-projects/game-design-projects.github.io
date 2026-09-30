// gitprofile.config.ts
// Landing page for https://github.com/game-design-projects, built on
// GitProfile (MIT, https://github.com/arifszn/gitprofile).
// The repo list is fetched live from the GitHub API in the visitor's browser,
// so new / renamed / deleted public repos show up without a redeploy.

const CONFIG = {
  github: {
    username: 'game-design-projects',
  },
  // Org site: https://game-design-projects.github.io/
  base: '/',
  projects: {
    github: {
      display: true,
      header: 'Games & Prototypes',
      mode: 'automatic',
      automatic: {
        sortBy: 'updated',
        limit: 30,
        exclude: {
          forks: false,
          projects: [],
        },
      },
      manual: {
        projects: [],
      },
    },
    external: {
      header: '',
      projects: [],
    },
  },
  seo: {
    title: 'Game Design Projects',
    description:
      'Unity & web game prototypes from the game-design-projects org — playable on itch.io.',
    imageURL: '',
  },
  social: {
    linkedin: '',
    x: '',
    mastodon: '',
    researchGate: '',
    facebook: '',
    instagram: '',
    reddit: '',
    threads: '',
    youtube: '',
    udemy: '',
    dribbble: '',
    behance: '',
    medium: '',
    dev: '',
    stackoverflow: '',
    discord: '',
    telegram: '',
    website: 'https://stevenli-phoenix-work.itch.io',
    phone: '',
    email: '',
  },
  resume: {
    fileUrl: '',
  },
  skills: [],
  experiences: [],
  certifications: [],
  educations: [],
  publications: [],
  blog: {
    source: 'dev',
    username: '',
    limit: 2,
  },
  googleAnalytics: {
    id: '',
  },
  hotjar: { id: '', snippetVersion: 6 },
  themeConfig: {
    defaultTheme: 'synthwave',
    disableSwitch: false,
    respectPrefersColorScheme: false,
    displayAvatarRing: true,
    themes: [
      'light',
      'dark',
      'synthwave',
      'cyberpunk',
      'retro',
      'night',
      'dracula',
      'nord',
      'sunset',
      'lofi',
    ],
  },
  footer: `Powered by <a
      class="text-primary" href="https://github.com/arifszn/gitprofile"
      target="_blank"
      rel="noreferrer"
    >GitProfile</a> · repo list syncs live from GitHub`,
  enablePWA: false,
};

export default CONFIG;
