import React from 'react';
import { useAppVersion } from '../hooks/useAppVersion';
import logoImage from '../assets/claude-owl-logo.png';
import '../pages/AboutPage.css';

export const AboutPage: React.FC = () => {
  const version = useAppVersion();

  const openGitHub = (url: string) => {
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(url).catch(() => {
        window.open(url, '_blank');
      });
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="page about-page">
      <h1 className="page-title">About Claude Owl</h1>

      <div className="about-container">
        {/* Logo and Version */}
        <div className="about-header">
          <div className="about-logo-section">
            <img
              src={logoImage}
              alt="Claude Owl Logo"
              className="about-logo"
            />
          </div>
          <div className="about-version-section">
            <h2>Claude Owl [Beta]</h2>
            <p className="version-text">Version {version}</p>
            <p className="tagline">
              Open-source UI for managing Claude Code configurations, settings, and features
            </p>
          </div>
        </div>

        {/* Links Section */}
        <div className="about-section">
          <h3>Project Information</h3>
          <div className="links-grid">
            <a
              className="about-link"
              onClick={() =>
                openGitHub('https://github.com/antonbelev/claude-owl')
              }
            >
              <span className="link-icon">🔗</span>
              <span>View on GitHub</span>
            </a>
            <a
              className="about-link"
              onClick={() =>
                openGitHub('https://github.com/antonbelev/claude-owl/issues/new?labels=bug')
              }
            >
              <span className="link-icon">🐛</span>
              <span>Report Issues</span>
            </a>
            <a
              className="about-link"
              onClick={() =>
                openGitHub('https://github.com/antonbelev/claude-owl/issues/new?labels=enhancement')
              }
            >
              <span className="link-icon">💡</span>
              <span>Request Features</span>
            </a>
          </div>
        </div>

        {/* Issue Reporting Guide */}
        <div className="about-section">
          <h3>Reporting Issues & Feature Requests</h3>
          <div className="guide-content">
            <div className="guide-item">
              <h4>🐛 Found a Bug?</h4>
              <p>
                Please report it on GitHub by creating a new{' '}
                <a
                  className="inline-link"
                  onClick={() =>
                    openGitHub('https://github.com/antonbelev/claude-owl/issues/new?labels=bug')
                  }
                >
                  issue
                </a>
                . Include:
              </p>
              <ul className="guide-list">
                <li>Version number (shown above)</li>
                <li>Steps to reproduce the issue</li>
                <li>Expected vs. actual behavior</li>
                <li>Screenshots or debug logs (if applicable)</li>
                <li>Your operating system and environment</li>
              </ul>
            </div>

            <div className="guide-item">
              <h4>💡 Have a Feature Request?</h4>
              <p>
                We'd love to hear your ideas! Create a{' '}
                <a
                  className="inline-link"
                  onClick={() =>
                    openGitHub(
                      'https://github.com/antonbelev/claude-owl/issues/new?labels=enhancement'
                    )
                  }
                >
                  feature request
                </a>{' '}
                with:
              </p>
              <ul className="guide-list">
                <li>A clear description of what you'd like to see</li>
                <li>Why this feature would be useful</li>
                <li>Any examples or mockups (optional)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="about-footer">
          <p>© {new Date().getFullYear()} Claude Owl Contributors. Licensed under MIT.</p>
          <p className="footer-note">
            Claude Owl is an open-source project and welcomes contributions from the community.
          </p>
        </div>
      </div>
    </div>
  );
};
