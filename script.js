function renderAggregatedPaths(config) {
    if (!document.getElementById('sh-render-aggregated-journeys-styles')) {
      const css = `
        .sh-path-row { display: grid; grid-template-columns: 1fr repeat(2,minmax(0,125px)); }
        .sh-path-row div { border-bottom: 1px solid lightgray; padding: 0.5rem 1rem 0 1rem; }
        .sh-segment { display: inline-block; position: relative; padding: .25rem 1rem !important;
          margin-right: .5rem; margin-bottom: .5rem; background: #e8f1fd;
          border: 1px solid #1b73e8; border-radius: 10px; font-size: .9rem; }
        .sh-segment strong { background: #b4d1f8; border-radius: 100px; padding: 0 .5rem; }
        .sh-paths-container { width: fit-content; font-size: .9rem; }
        .sh-paths-touchpoints, .sh-paths-aggregate-count {
          display: grid; align-content: center; border-left: 1px solid lightgray; justify-content: center;
        }
        .sh-paths-header-row { font-weight: 600; }
        .sh-paths-header-row div { padding: .5rem; }
        .sh-path-row:hover { background: #f4f4f4; }
      `;
      const style = document.createElement('style');
      style.id = 'sh-render-aggregated-journeys-styles';
      style.textContent = css;
      document.head.appendChild(style);
    }
  
    const { rawPaths, separator = ';', customLabels = {} } = config;
    const labels = { ...customLabels };
  
    const tally = {};
    rawPaths.forEach(path => {
      const steps = path.split(separator)
        .map(s => s.trim()).filter(Boolean)
        .map(s => labels[s] || (s === '/' ? 'Home' : s));
  
      const seq = [];
      let prev = null, cnt = 0;
      steps.forEach(step => {
        if (step === prev) cnt++;
        else {
          if (prev !== null) seq.push(prev + (cnt > 1 ? ' x' + cnt : ''));
          prev = step; cnt = 1;
        }
      });
      if (prev !== null) seq.push(prev + (cnt > 1 ? ' x' + cnt : ''));
      const key = seq.join(' > ');
      tally[key] = (tally[key] || 0) + 1;
    });
  
    const entries = Object.entries(tally).sort((a, b) => {
      const [pA, cA] = a, [pB, cB] = b;
      if (cB !== cA) return cB - cA;
      const lA = pA.split(' > ').length, lB = pB.split(' > ').length;
      if (lB !== lA) return lB - lA;
      return pA.split(' > ')[0].localeCompare(pB.split(' > ')[0]);
    });
  
    let html = '<div class="sh-paths-container">';
    html += '<div class="sh-path-row sh-paths-header-row">'
         +  '<div class="sh-paths-list">Conversion Path</div>'
         +  '<div class="sh-paths-touchpoints">Touchpoints</div>'
         +  '<div class="sh-paths-aggregate-count">Conversions</div>'
         + '</div>';
  
    entries.forEach(([path, count]) => {
      const segments = path.split(' > ').map(seg => {
        const m = seg.match(/^(.*?)( x\d+)$/);
        return m
          ? `<span class="sh-segment">${m[1]} <strong>${m[2].trim()}</strong></span>`
          : `<span class="sh-segment">${seg}</span>`;
      }).join('');
      const touchpoints = path.split(' > ').length;
  
      html += `
        <div class="sh-path-row">
          <div class="sh-paths-list">${segments}</div>
          <div class="sh-paths-touchpoints">${touchpoints}</div>
          <div class="sh-paths-aggregate-count"><span class="sh-count">${count}</span></div>
        </div>`;
    });
  
    html += '</div>';
    return html;
  }
  
  function renderPageJourneyCounts(config) {
    if (!document.getElementById('sh-render-page-journeys-styles')) {
      const css = `
        .sh-page-count-row { display: grid; grid-template-columns: 1fr minmax(0,125px); border-bottom:1px solid lightgray; }
        .sh-page-count-header { font-weight:600; }
        .sh-page-count-header div { background:transparent; border:none; padding:.5rem!important; margin:0; }
        .sh-page-count-row div { margin:.5rem 1rem; }
        .sh-page-count-row:hover { background:#f4f4f4; }
        .sh-page-counts-container { width:fit-content; font-size:.9rem; }
        .sh-page-name { background:#e8f1fd; padding:.25rem 1rem!important; border-radius:10px; border:1px solid #1b73e8; width:fit-content; }
        .sh-count { display:grid; align-content:center; justify-content:center; }
      `;
      const style = document.createElement('style');
      style.id = 'sh-render-page-journeys-styles';
      style.textContent = css;
      document.head.appendChild(style);
    }
  
    const { rawPaths, separator = ';', customLabels = {} } = config;
    const labels = { ...customLabels };
  
    const tally = {};
    rawPaths.forEach(path => {
      const steps = path.split(separator)
        .map(s => s.trim()).filter(Boolean)
        .map(s => labels[s] || (s === '/' ? 'Home' : s));
  
      new Set(steps).forEach(page => {
        tally[page] = (tally[page] || 0) + 1;
      });
    });
  
    const sorted = Object.entries(tally)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  
    let html = '<div class="sh-page-counts-container">';
    html += '<div class="sh-page-count-row sh-page-count-header">'
          + '<div class="sh-page-name">Page</div>'
          + '<div class="sh-count">Conversions</div>'
          + '</div>';
  
    sorted.forEach(([page, count]) => {
      html +=
        '<div class="sh-page-count-row">' +
          '<div class="sh-page-name">' + page + '</div>' +
          '<div class="sh-count">' + count + '</div>' +
        '</div>';
    });
  
    html += '</div>';
    return html;
  }
  
  looker.plugins.visualizations.add({
    id: "sh_journeys",
    label: "User Journeys",
    options: {
      viewType: {
        type: "string",
        label: "Visualization Type",
        display: "select",
        default: "aggregated",
        values: [
          { label: "Aggregated Paths", value: "aggregated" },
          { label: "Page Counts",      value: "pageCounts"   }
        ]
      }
    },
    create(element) {
      element.innerHTML = `<div id="sh-viz-container"></div>`;
    },
    update(data, element, config) {
      const rawPaths = data.map(r => r["Paths"].value);
      const container = element.querySelector("#sh-viz-container");
      container.innerHTML = "";
  
      if (config.options.viewType === "pageCounts") {
        container.innerHTML = renderPageJourneyCounts({ rawPaths });
      } else {
        container.innerHTML = renderAggregatedPaths({ rawPaths });
      }
    }
  });
  