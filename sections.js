(function sectionNavigation(root) {
  'use strict';
  if (!root?.document) return;
  const document = root.document, records = new WeakMap();
  function attach(container, definitions, options = {}) {
    if (!container) return;
    const previous = records.get(container);
    if (previous?.tabs.isConnected && previous.tabs.parentElement === container) {previous.configure(definitions,options);return previous;}
    previous?.destroy();
    const groups = definitions.map((group, sourceIndex) => ({ ...group, sourceIndex, nodes: group.nodes.filter(Boolean) })).filter(group => group.nodes.length);
    if (groups.length < 2) return;
    const tabs = document.createElement('nav');
    tabs.className = 'mer-section-tabs';
    tabs.setAttribute('aria-label', options.label || (document.documentElement.lang === 'en' ? 'Sections' : 'Odjeljci'));
    const panels = groups.map((group, index) => {
      const panel = document.createElement('section'); panel.className = 'mer-section-panel';
      panel.id = `${container.id || options.key || 'merSection'}Panel${index}`;
      group.nodes.forEach(node => panel.append(node));
      const button = document.createElement('button'); button.type = 'button'; button.textContent = typeof group.label==='function'?group.label():group.label;
      button.setAttribute('aria-controls', panel.id);
      tabs.append(button); container.append(panel);
      button.addEventListener('click', () => select(index));
      return { panel, button };
    });
    container.prepend(tabs);
    let selected = 0;
    function select(index) {
      selected = Math.max(0, Math.min(panels.length - 1, index));
      panels.forEach(({ panel, button }, i) => {
        panel.hidden = i !== selected;
        button.setAttribute('aria-pressed', String(i === selected));
      });
      root.MerPagination?.refreshAll();
    }
    // Native constraint validation may point at a field on a different page.
    const revealInvalid = event => {
      const index = panels.findIndex(item => item.panel.contains(event.target));
      if (index >= 0) {
        if (root.MerPagination?.revealInvalidField) root.MerPagination.revealInvalidField(event, () => select(index));
        else select(index);
      }
    };
    container.addEventListener('invalid',revealInvalid,true);
    function refreshLabels(nextDefinitions) {
      groups.forEach((group,index)=>{
        if(nextDefinitions?.[group.sourceIndex]?.label!==undefined)group.label=nextDefinitions[group.sourceIndex].label;
        const label=typeof group.label==='function'?group.label():group.label;
        if(panels[index].button.textContent!==label)panels[index].button.textContent=label;
      });
      const label=typeof options.label==='function'?options.label():options.label||(document.documentElement.lang==='en'?'Sections':'Odjeljci');
      if(tabs.getAttribute('aria-label')!==label)tabs.setAttribute('aria-label',label);
    }
    const controller = { tabs, select, refreshLabels,
      configure(nextDefinitions,nextOptions={}){options={...options,...nextOptions};refreshLabels(nextDefinitions);},
      destroy(){container.removeEventListener('invalid',revealInvalid,true);},
      get selected() { return selected; } };
    records.set(container, controller);
    select(previous?.selected || 0);
    return controller;
  }
  new root.MutationObserver(()=>{
    document.querySelectorAll('.mer-section-tabs').forEach(tabs=>records.get(tabs.parentElement)?.refreshLabels());
  }).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  root.MerSections = { attach };
})(typeof window !== 'undefined' ? window : null);
