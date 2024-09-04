import { hydrateRoot } from 'react-dom/client';

import Widget from './components';

import './index.css';

const WIDGET_CSS_URL = process.env.WIDGET_CSS_URL;
const WIDGET_NAME = process.env.WIDGET_NAME;

// initialize the widget
initializeWidget();

function initializeWidget() {
  if (document.readyState !== 'loading') {
    onReady();
  } else {
    document.addEventListener('DOMContentLoaded', onReady);
  }
}

function onReady() {
  try {
    const element = document.createElement('div');
    const shadow = element.attachShadow({ mode: 'open' });
    const shadowRoot = document.createElement('div');
    const accountId = getAccountId();

    shadowRoot.id = 'makerdesk-widget-container';

    const component = (
      <>
        <Widget accountId={accountId} />
      </>
    );

    shadow.appendChild(shadowRoot);
    injectStyle(shadowRoot);
    hydrateRoot(shadowRoot, component);

    document.body.appendChild(element);
  } catch (error) {
    console.warn(`Could not initialize Widget`);
    console.warn(error);
  }
}

function injectStyle(shadowRoot: HTMLElement) {
  const link = document.createElement('link');
  const href = WIDGET_CSS_URL;

  if (!href) {
    throw new Error('Missing WIDGET_CSS_URL environment variable');
  }

  link.rel = 'stylesheet';
  link.href = href;

  shadowRoot.appendChild(link);
}

function getAccountId() {
  const script = getCurrentScript();

  if (!script) {
    throw new Error('Script not found');
  }

  const accountId = script.getAttribute('data-account');

  if (!accountId) {
    throw new Error('Missing data-account-id attribute');
  }

  return accountId;
}

function getCurrentScript() {
  const currentScript = document.currentScript;

  if (!WIDGET_NAME) {
    throw new Error('Missing WIDGET_NAME environment variable');
  }

  if (currentScript?.getAttribute('src')?.includes(WIDGET_NAME)) {
    return currentScript as HTMLScriptElement;
  }

  return Array.from(document.scripts).find((item) => {
    return item.src.includes(WIDGET_NAME);
  });
}