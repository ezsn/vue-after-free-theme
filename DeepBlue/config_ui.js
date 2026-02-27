if (typeof libc_addr === 'undefined') {
  include('userland.js');
}
if (typeof lang === 'undefined') {
  include('languages.js');
}

(function () {
  log(lang.loadingConfig);

  var fs = {
    write: function (filename, content, callback) {
      var xhr = new jsmaf.XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && callback) {
          callback(xhr.status === 0 || xhr.status === 200 ? null : new Error('failed'));
        }
      };
      xhr.open('POST', 'file://../download0/' + filename, true);
      xhr.send(content);
    },
    read: function (filename, callback) {
      var xhr = new jsmaf.XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && callback) {
          callback(xhr.status === 0 || xhr.status === 200 ? null : new Error('failed'), xhr.responseText);
        }
      };
      xhr.open('GET', 'file://../download0/' + filename, true);
      xhr.send();
    }
  };

  // -----------------------------
  // Config model (unchanged)
  // -----------------------------
  var currentConfig = {
    autolapse: false,
    autopoop: false,
    autoclose: false,
    autoclose_delay: 0,
    music: true,
    jb_behavior: 0,
    theme: 'default'
  };

  // Store user's payloads so we don't overwrite them
  var userPayloads = [];
  var configLoaded = false;

  var jbBehaviorLabels = [lang.jbBehaviorAuto, lang.jbBehaviorNetctrl, lang.jbBehaviorLapse];
  var jbBehaviorImgKeys = ['jbBehaviorAuto', 'jbBehaviorNetctrl', 'jbBehaviorLapse'];

  function scanThemes() {
    var themes = [];
    try {
      fn.register(0x05, 'open_sys', ['bigint', 'bigint', 'bigint'], 'bigint');
      fn.register(0x06, 'close_sys', ['bigint'], 'bigint');
      fn.register(0x110, 'getdents', ['bigint', 'bigint', 'bigint'], 'bigint');

      var themesDir = '/download0/themes';
      var path_addr = mem.malloc(256);
      var buf = mem.malloc(4096);

      for (var i = 0; i < themesDir.length; i++) {
        mem.view(path_addr).setUint8(i, themesDir.charCodeAt(i));
      }
      mem.view(path_addr).setUint8(themesDir.length, 0);

      var fd = fn.open_sys(path_addr, new BigInt(0, 0), new BigInt(0, 0));
      if (!fd.eq(new BigInt(0xffffffff, 0xffffffff))) {
        var count = fn.getdents(fd, buf, new BigInt(0, 4096));
        if (!count.eq(new BigInt(0xffffffff, 0xffffffff)) && count.lo > 0) {
          var offset = 0;
          while (offset < count.lo) {
            var d_reclen = mem.view(buf.add(new BigInt(0, offset + 4))).getUint16(0, true);
            var d_type = mem.view(buf.add(new BigInt(0, offset + 6))).getUint8(0);
            var d_namlen = mem.view(buf.add(new BigInt(0, offset + 7))).getUint8(0);
            var name = '';
            for (var _i = 0; _i < d_namlen; _i++) {
              name += String.fromCharCode(mem.view(buf.add(new BigInt(0, offset + 8 + _i))).getUint8(0));
            }
            if (d_type === 4 && name !== '.' && name !== '..') {
              themes.push(name);
            }
            offset += d_reclen;
          }
        }
        fn.close_sys(fd);
      }
    } catch (e) {
      log('Theme scan failed: ' + e.message);
    }

    var idx = themes.indexOf('default');
    if (idx > 0) {
      themes.splice(idx, 1);
      themes.unshift('default');
    } else if (idx < 0) {
      themes.unshift('default');
    }
    return themes;
  }

  var availableThemes = scanThemes();
  log('Discovered themes: ' + availableThemes.join(', '));
  var themeLabels = availableThemes.map(function (theme) {
    return theme.charAt(0).toUpperCase() + theme.slice(1);
  });
  var themeImgKeys = availableThemes.map(function (theme) {
    return 'theme' + theme.charAt(0).toUpperCase() + theme.slice(1);
  });

  // -----------------------------
  // UI setup (PS4 Settings-like)
  // -----------------------------
  jsmaf.root.children.length = 0;

  new Style({ name: 'white', color: 'white', size: 24 });
  new Style({ name: 'title', color: 'white', size: 36 });
  new Style({ name: 'subtitle', color: 'rgb(220,220,220)', size: 22 });
  new Style({ name: 'desc', color: 'rgb(200,200,200)', size: 20 });
  new Style({ name: 'value', color: 'white', size: 26 });

  if (typeof CONFIG !== 'undefined' && CONFIG.music) {
    var audio = new jsmaf.AudioClip();
    audio.volume = 0.5;
    audio.open('file://../download0/sfx/bgm.wav');
  }

  // Background & logo remain your theme assets
  var background = new Image({
    url: 'file:///../download0/themes/DeepBlue/img/background.png',
    x: 0,
    y: 0,
    width: 1920,
    height: 1080
  });
  jsmaf.root.children.push(background);

  /*
  var logo = new Image({
    url: 'file:///../download0/img/logo.png',
    x: 1620,
    y: 0,
    width: 300,
    height: 169
  });
  jsmaf.root.children.push(logo);
  */

  // Header (left aligned like PS4 Settings)
  var headerText;
  if (useImageText) {
    headerText = new Image({
      url: textImageBase + 'config.png',
      x: 160,
      y: 110,
      width: 260,
      height: 70
    });
  } else {
    headerText = new jsmaf.Text();
    headerText.text = lang.config;
    headerText.x = 160;
    headerText.y = 120;
    headerText.style = 'title';
  }
  jsmaf.root.children.push(headerText);

  // Options list
  var configOptions = [
    { key: 'autolapse',  label: lang.autoLapse,   imgKey: 'autoLapse',   type: 'toggle',
      desc: 'Lapse is used from 7.00 to 12.02.' },
    { key: 'autopoop',   label: lang.autoPoop,    imgKey: 'autoPoop',    type: 'toggle',
      desc: 'Poopsploit from 12.50-13.00' },
    { key: 'autoclose',  label: lang.autoClose,   imgKey: 'autoClose',   type: 'toggle',
      desc: 'Close app automatically after jailbreak.' },
    { key: 'music',      label: lang.music,       imgKey: 'music',       type: 'toggle',
      desc: 'Background music on/off.' },
    { key: 'jb_behavior',label: lang.jbBehavior,  imgKey: 'jbBehavior',  type: 'cycle',
      desc: 'Choose jailbreak behavior mode.' },
    { key: 'theme',      label: (lang.theme || 'Theme'), imgKey: 'theme', type: 'cycle',
      desc: 'Change your favorite theme. \nPaste your theme in folder /download0/themes/ using FTP. \n\nNote:\nIf the folder doesn\'t exist, make sure you open Vue After Free first and then open FTP.' }
  ];

  // Layout constants
  var leftX = 140;
  var leftW = 620;
  var listTopY = 230;
  var rowH = 64;
  var rowGap = 14;

  var rightX = 820;
  var rightY = 230;
  var rightW = 960;
  var rightH = 640;

  var normalRowImg = 'file:///assets/img/button_over_9.png';
  var selectedRowImg = 'file:///assets/img/button_over_9.png';

  // Left list elements
  var currentRow = 0;
  var rows = [];
  var rowTexts = [];
  var rowValues = [];
  var rowOrigPos = [];
  var rowTextOrigPos = [];

  // Right panel elements
  var rightPanel = new Image({
    url: normalRowImg,
    x: rightX,
    y: rightY,
    width: rightW,
    height: rightH,
    alpha: 0.35
  });
  rightPanel.borderColor = 'rgb(100,180,255)';
  rightPanel.borderWidth = 0;
  jsmaf.root.children.push(rightPanel);

  var detailTitle = new jsmaf.Text();
  detailTitle.x = rightX + 40;
  detailTitle.y = rightY + 45;
  detailTitle.style = 'title';
  jsmaf.root.children.push(detailTitle);

  var detailDesc = new jsmaf.Text();
  detailDesc.x = rightX + 40;
  detailDesc.y = rightY + 110;
  detailDesc.style = 'desc';
  jsmaf.root.children.push(detailDesc);

  /*
  var detailValueLabel = new jsmaf.Text();
  detailValueLabel.x = rightX + 40;
  detailValueLabel.y = rightY + 210;
  detailValueLabel.style = 'value';
  jsmaf.root.children.push(detailValueLabel);
  */

  var hint = new jsmaf.Text();
  hint.x = rightX + 40;
  hint.y = rightY + rightH - 60;
  hint.style = 'subtitle';
  jsmaf.root.children.push(hint);

  function getValueDisplay(option) {
    if (!option) return '';
    if (option.type === 'toggle') {
      return '';
    }
    if (option.key === 'jb_behavior') {
      return jbBehaviorLabels[currentConfig.jb_behavior] || jbBehaviorLabels[0];
    }
    if (option.key === 'theme') {
      var ti = availableThemes.indexOf(currentConfig.theme);
      var di = ti >= 0 ? ti : 0;
      return themeLabels[di] || themeLabels[0];
    }
    return '';
  }

  function setRowValue(i) {
    var option = configOptions[i];
    var v = rowValues[i];
    if (!option || !v) return;

    if (option.type === 'toggle') {
      // Checkbox image for toggles (PS4-style)
      v.url = currentConfig[option.key]
        ? 'file:///assets/img/check_small_on.png'
        : 'file:///assets/img/check_small_off.png';
      v.x = leftX + leftW - 50;
    } else {
      // Text for cycle values (JB Behavior / Theme), fixed right alignment
      v.text = '<  '+getValueDisplay(option)+ '  >';
      v.x = leftX + leftW - 190;
    }
  }

  function updateDetails() {
    var option = configOptions[currentRow];
    if (!option) return;

    if (useImageText) {
      // Use plain text for details even if image text is on (PS4-style panel is better as text)
      detailTitle.text = option.label;
    } else {
      detailTitle.text = option.label;
    }
    detailDesc.text = option.desc || '';
    //detailValueLabel.text = 'Value: ' + getValueDisplay(option);

    // Hint text (PS4-style)
    var ok = jsmaf.circleIsAdvanceButton ? 'O' : 'X';
    var back = jsmaf.circleIsAdvanceButton ? 'X' : 'O';
    hint.text = ok + ' Change   ' + back + ' Back';
  }

  // Build left list
  for (var i = 0; i < configOptions.length; i++) {
    var y = listTopY + i * (rowH + rowGap);

    var row = new Image({
      url: normalRowImg,
      x: leftX,
      y: y,
      width: leftW,
      height: rowH,
      alpha: 0.55
    });
    rows.push(row);
    jsmaf.root.children.push(row);

    var t;
    if (useImageText) {
      t = new Image({
        url: textImageBase + configOptions[i].imgKey + '.png',
        x: leftX + 22,
        y: y + 9,
        width: 280,
        height: 46
      });
    } else {
      t = new jsmaf.Text();
      t.text = configOptions[i].label;
      t.x = leftX + 26;
      t.y = y + 24;
      t.style = 'white';
    }
    rowTexts.push(t);
    jsmaf.root.children.push(t);

    // Row value (right-aligned inside list)
    var v;
    if (configOptions[i].type === 'toggle') {
      // Toggle uses checkbox images (PS4-style), regardless of useImageText
      v = new Image({
        url: 'file:///assets/img/check_small_off.png',
        x: leftX + leftW - 50,
        y: y + 16,
        width: 32,
        height: 32
      });
    } else {
      v = new jsmaf.Text();
      v.text = '';
      v.y = y + 24;
      v.style = 'subtitle';
    }
    rowValues.push(v);
    jsmaf.root.children.push(v);

    rowOrigPos.push({ x: row.x, y: row.y });
    rowTextOrigPos.push({ x: t.x, y: t.y });
  }

  // Zoom animation (reuse your style)
  var zoomInInterval = null;
  var zoomOutInterval = null;
  var prevRow = -1;

  function easeInOut(t) {
    return (1 - Math.cos(t * Math.PI)) / 2;
  }

  function animateZoom(btn, text, btnOrigX, btnOrigY, textOrigX, textOrigY, fromScale, toScale) {
    // single interval is enough for this screen
    if (zoomInInterval) jsmaf.clearInterval(zoomInInterval);
    if (zoomOutInterval) jsmaf.clearInterval(zoomOutInterval);

    var duration = 160;
    var elapsed = 0;
    var step = 16;
    var useInterval = jsmaf.setInterval(function () {
      elapsed += step;
      var t = Math.min(elapsed / duration, 1);
      var eased = easeInOut(t);
      var scale = fromScale + (toScale - fromScale) * eased;

      btn.scaleX = scale;
      btn.scaleY = scale;
      btn.x = btnOrigX - leftW * (scale - 1) / 2;
      btn.y = btnOrigY - rowH * (scale - 1) / 2;

      text.scaleX = scale;
      text.scaleY = scale;
      text.x = textOrigX - leftW * (scale - 1) / 2;
      text.y = textOrigY - rowH * (scale - 1) / 2;

      if (t >= 1) {
        jsmaf.clearInterval(useInterval);
      }
    }, step);

    // keep refs so we can clear next time
    zoomInInterval = useInterval;
  }

  function updateHighlight() {
    // Reset previous
    if (prevRow >= 0 && prevRow !== currentRow && rows[prevRow]) {
      rows[prevRow].url = normalRowImg;
      rows[prevRow].alpha = 0.55;
      rows[prevRow].borderColor = 'transparent';
      rows[prevRow].borderWidth = 0;

      // reset transform
      rows[prevRow].scaleX = 1.0;
      rows[prevRow].scaleY = 1.0;
      rows[prevRow].x = rowOrigPos[prevRow].x;
      rows[prevRow].y = rowOrigPos[prevRow].y;

      var pt = rowTexts[prevRow];
      if (pt) {
        pt.scaleX = 1.0;
        pt.scaleY = 1.0;
        pt.x = rowTextOrigPos[prevRow].x;
        pt.y = rowTextOrigPos[prevRow].y;
      }
    }

    // Apply current
    for (var i = 0; i < rows.length; i++) {
      if (!rows[i]) continue;

      if (i === currentRow) {
        rows[i].url = selectedRowImg;
        rows[i].alpha = 0.95;
        rows[i].borderColor = 'rgb(100,180,255)';
        rows[i].borderWidth = 3;

        animateZoom(
          rows[i],
          rowTexts[i],
          rowOrigPos[i].x,
          rowOrigPos[i].y,
          rowTextOrigPos[i].x,
          rowTextOrigPos[i].y,
          rows[i].scaleX || 1.0,
          1.06
        );
      } else if (i !== prevRow) {
        rows[i].url = normalRowImg;
        rows[i].alpha = 0.55;
        rows[i].borderColor = 'transparent';
        rows[i].borderWidth = 0;
      }
    }

    prevRow = currentRow;
    updateDetails();
  }

  // -----------------------------
  // Config load/save (unchanged)
  // -----------------------------
  function saveConfig() {
    if (!configLoaded) {
      log('Config not loaded yet, skipping save');
      return;
    }
    var configData = {
      config: {
        autolapse: currentConfig.autolapse,
        autopoop: currentConfig.autopoop,
        autoclose: currentConfig.autoclose,
        autoclose_delay: currentConfig.autoclose_delay,
        music: currentConfig.music,
        jb_behavior: currentConfig.jb_behavior,
        theme: currentConfig.theme
      },
      payloads: userPayloads
    };
    var configContent = JSON.stringify(configData, null, 2);
    fs.write('config.json', configContent, function (err) {
      if (err) {
        log('ERROR: Failed to save config: ' + err.message);
      } else {
        log('Config saved successfully');
      }
    });
  }
  function loadConfig() {
    fs.read('config.json', function (err, data) {
      if (err) {
        log('ERROR: Failed to read config: ' + err.message);
        return;
      }
      try {
        var configData = JSON.parse(data || '{}');
        if (configData.config) {
          var _CONFIG = configData.config;
          currentConfig.autolapse = _CONFIG.autolapse || false;
          currentConfig.autopoop = _CONFIG.autopoop || false;
          currentConfig.autoclose = _CONFIG.autoclose || false;
          currentConfig.autoclose_delay = _CONFIG.autoclose_delay || 0;
          currentConfig.music = _CONFIG.music !== false;
          currentConfig.jb_behavior = _CONFIG.jb_behavior || 0;

          // Validate and set theme (themes are auto-discovered from directory scan)
          if (_CONFIG.theme && availableThemes.includes(_CONFIG.theme)) {
            currentConfig.theme = _CONFIG.theme;
          } else {
            log('WARNING: Theme "' + (_CONFIG.theme || 'undefined') + '" not found in available themes, using default');
            currentConfig.theme = availableThemes[0] || 'default';
          }

          // Preserve user's payloads
          if (configData.payloads && Array.isArray(configData.payloads)) {
            userPayloads = configData.payloads.slice();
          }
          for (var _i3 = 0; _i3 < configOptions.length; _i3++) {
            updateValueText(_i3);
          }
          if (currentConfig.music) {
            startBgmIfEnabled();
          } else {
            stopBgm();
          }
          configLoaded = true;
          log('Config loaded successfully');
        }
      } catch (e) {
        log('ERROR: Failed to parse config: ' + e.message);
        configLoaded = true; // Allow saving even on error
      }
    });
  }

  // -----------------------------
  // Value change behavior (PS4-like)
  // -----------------------------
  function applyMutualExclusion(keyJustChanged) {
    // Keep your original mutual exclusion logic
    if (keyJustChanged === 'autolapse' && currentConfig.autolapse === true) {
      currentConfig.autopoop = false;
      log('autopoop disabled (autolapse enabled)');
      for (var i = 0; i < configOptions.length; i++) {
        if (configOptions[i].key === 'autopoop') {
          setRowValue(i);
          break;
        }
      }
    } else if (keyJustChanged === 'autopoop' && currentConfig.autopoop === true) {
      currentConfig.autolapse = false;
      log('autolapse disabled (autopoop enabled)');
      for (var j = 0; j < configOptions.length; j++) {
        if (configOptions[j].key === 'autolapse') {
          setRowValue(j);
          break;
        }
      }
    }
  }

  function changeValue(direction) {
    var option = configOptions[currentRow];
    if (!option) return;

    if (option.type === 'toggle') {
      // PS4 feel: left/right or confirm toggles
      currentConfig[option.key] = !currentConfig[option.key];
      applyMutualExclusion(option.key);
      log(option.key + ' = ' + currentConfig[option.key]);
    } else {
      if (option.key === 'jb_behavior') {
        var len = jbBehaviorLabels.length;
        currentConfig.jb_behavior = (currentConfig.jb_behavior + (direction >= 0 ? 1 : -1) + len) % len;
        log(option.key + ' = ' + jbBehaviorLabels[currentConfig.jb_behavior]);
      } else if (option.key === 'theme') {
        var currentIndex = availableThemes.indexOf(currentConfig.theme);
        var di = currentIndex >= 0 ? currentIndex : 0;
        var next = (di + (direction >= 0 ? 1 : -1) + availableThemes.length) % availableThemes.length;
        currentConfig.theme = availableThemes[next];
        log(option.key + ' = ' + currentConfig.theme);
      }
    }

    setRowValue(currentRow);
    updateDetails();
    saveConfig();
  }

  // -----------------------------
  // Input
  // -----------------------------
  var confirmKey = jsmaf.circleIsAdvanceButton ? 13 : 14;
  var backKey = jsmaf.circleIsAdvanceButton ? 14 : 13;

  jsmaf.onKeyDown = function (keyCode) {
    // Key map that matches your payload menu:
    // 6 = Down, 4 = Up, 5 = Right, 7 = Left
    if (keyCode === 6) {
      currentRow = (currentRow + 1) % rows.length;
      updateHighlight();
    } else if (keyCode === 4) {
      currentRow = (currentRow - 1 + rows.length) % rows.length;
      updateHighlight();
    } else if (keyCode === 5) {
      changeValue(+1);
    } else if (keyCode === 7) {
      changeValue(-1);
    } else if (keyCode === confirmKey) {
      changeValue(+1);
    } else if (keyCode === backKey) {
      log('Restarting...');
      saveConfig();
      jsmaf.setTimeout(function () {
        debugging.restart();
      }, 100);
    }
  };

  // Init row values
  for (var i = 0; i < configOptions.length; i++) {
    setRowValue(i);
  }
  updateHighlight();
  loadConfig();
  log(lang.configLoaded);
})();
