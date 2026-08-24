(() => {
  'use strict';

  const template = document.createElement('template');
  template.innerHTML = `
    <style>
      :host {
        position: relative;
        display: inline-grid;
        place-items: center;
        flex: 0 0 auto;
        width: 100%;
        height: 100%;
        color: var(--logo-color, #050706);
        overflow: hidden;
        contain: layout paint;
      }

      .fallback,
      svg {
        grid-area: 1 / 1;
        width: 100%;
        height: 100%;
      }

      .fallback {
        display: grid;
        place-items: center;
        opacity: 0;
        color: currentColor;
        font-family: "Mont", "Montserrat", Arial, sans-serif;
        font-size: 2.15rem;
        font-weight: 700;
        letter-spacing: -.14em;
        line-height: 1;
        transform: translateX(-.06em);
      }

      svg {
        position: relative;
        display: block;
        overflow: visible;
      }

      text {
        fill: currentColor;
        font-family: "Mont", "Montserrat", Arial, sans-serif;
        font-size: 70px;
        font-weight: 700;
        letter-spacing: -8px;
      }
    </style>
    <span class="fallback" aria-hidden="true">mer</span>
    <svg viewBox="0 0 180 80" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <text x="3" y="62">mer</text>
    </svg>
  `;

  class MerLogo extends HTMLElement {
    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      root.append(template.content.cloneNode(true));
    }
  }

  if (!customElements.get('mer-logo')) {
    customElements.define('mer-logo', MerLogo);
  }
})();
