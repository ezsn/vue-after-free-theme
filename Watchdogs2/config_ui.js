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
  var themeLabels = availableThemes.map(theme => theme.charAt(0).toUpperCase() + theme.slice(1));
  var themeImgKeys = availableThemes.map(theme => 'theme' + theme.charAt(0).toUpperCase() + theme.slice(1));
  var currentButton = 0;
  var buttons = [];
  var buttonTexts = [];
  var buttonMarkers = [];
  var buttonOrigPos = [];
  var textOrigPos = [];
  var valueTexts = [];
    var normalButtonImg = 'file://../download0/themes/Watchdogs2/img/ps4_bar_normal.png';
    var selectedButtonImg = 'file://../download0/themes/Watchdogs2/img/ps4_bar_selected.png';
  jsmaf.root.children.length = 0;
  new Style({
    name: 'white',
    color: 'white',
    size: 22
  });
  new Style({
    name: 'green',
    color: '#07ff00',
    size: 22
  });
  new Style({
    name: 'title',
    color: 'white',
    size: 25
  });
  if (typeof CONFIG !== 'undefined' && CONFIG.music) {
    var audio = new jsmaf.AudioClip();
    audio.volume = 0.5;
    audio.open('file://../download0/sfx/bgm.wav');
  }
  var background = new Image({
    url: 'file://../download0/themes/Watchdogs2/img/background.png',
    x: 0,
    y: 0,
    width: 1920,
    height: 1080
  });
  jsmaf.root.children.push(background);

  var titleText = new jsmaf.Text();
  titleText.text = '[<] Config';
  titleText.x = 64;
  titleText.y = 54;
  titleText.style = 'title';
  jsmaf.root.children.push(titleText);

  var configOptions = [{
    key: 'autolapse',
    label: lang.autoLapse,
    imgKey: 'autoLapse',
    type: 'toggle'
  }, {
    key: 'autopoop',
    label: lang.autoPoop,
    imgKey: 'autoPoop',
    type: 'toggle'
  }, {
    key: 'autoclose',
    label: lang.autoClose,
    imgKey: 'autoClose',
    type: 'toggle'
  }, {
    key: 'music',
    label: lang.music,
    imgKey: 'music',
    type: 'toggle'
  }, {
    key: 'jb_behavior',
    label: lang.jbBehavior,
    imgKey: 'jbBehavior',
    type: 'cycle'
  }, {
    key: 'theme',
    label: lang.theme || 'Theme',
    imgKey: 'theme',
    type: 'cycle'
  }];
  var centerX = 960;
    var startY = 136;
    var buttonSpacing = 70;
    var buttonWidth = 1408;
    var buttonHeight = 50;
  for (var i = 0; i < configOptions.length; i++) {
    var configOption = configOptions[i];
        var btnX = 64;
    var btnY = startY + i * buttonSpacing;
    var button = new Image({
      url: normalButtonImg,
      x: btnX,
      y: btnY,
      width: buttonWidth,
      height: buttonHeight
    });
    buttons.push(button);
    jsmaf.root.children.push(button);
    buttonMarkers.push(null);
    var btnText = void 0;
    if (useImageText) {
      btnText = new Image({
        url: textImageBase + configOption.imgKey + '.png',
        x: btnX + 16,
        y: btnY + 12,
        width: 160,
        height: 32
      });
    } else {
      btnText = new jsmaf.Text();
      btnText.text = configOption.label;
            btnText.x = btnX + 24;
      btnText.y = btnY + 14;
      btnText.style = 'white';
    }
    buttonTexts.push(btnText);
    jsmaf.root.children.push(btnText);
    if (configOption.type === 'toggle') {
      var checkmark = new Image({
        url: currentConfig[configOption.key] ? 'file:///assets/img/check_small_on.png' : 'file:///assets/img/check_small_off.png',
                x: btnX + buttonWidth - 44,
        y: btnY + 9,
        width: 32,
        height: 32
      });
      valueTexts.push(checkmark);
      jsmaf.root.children.push(checkmark);
    } else {
      var valueLabel = void 0;
      if (configOption.key === 'jb_behavior') {
        if (useImageText) {
          valueLabel = new Image({
            url: textImageBase + jbBehaviorImgKeys[currentConfig.jb_behavior] + '.png',
                        x: btnX + buttonWidth - 208,
            y: btnY + 12,
            width: 120,
            height: 32
          });
        } else {
          valueLabel = new jsmaf.Text();
          valueLabel.text = jbBehaviorLabels[currentConfig.jb_behavior] || jbBehaviorLabels[0];
                    valueLabel.x = btnX + buttonWidth - 160;
          valueLabel.y = btnY + 14;
          valueLabel.style = 'green';
        }
      } else if (configOption.key === 'theme') {
        var themeIndex = availableThemes.indexOf(currentConfig.theme);
        var displayIndex = themeIndex >= 0 ? themeIndex : 0;
        if (useImageText) {
          valueLabel = new Image({
            url: textImageBase + themeImgKeys[displayIndex] + '.png',
                        x: btnX + buttonWidth - 160,
            y: btnY + 12,
            width: 120,
            height: 32
          });
        } else {
          valueLabel = new jsmaf.Text();
          valueLabel.text = themeLabels[displayIndex] || themeLabels[0];
          valueLabel.x = btnX + buttonWidth - 160;
          valueLabel.y = btnY + 14;
          valueLabel.style = 'green';
        }
      }
      valueTexts.push(valueLabel);
      jsmaf.root.children.push(valueLabel);
    }
    buttonOrigPos.push({
      x: btnX,
      y: btnY
    });
    textOrigPos.push({
      x: btnText.x,
      y: btnText.y
    });
  }
  var backHint = new jsmaf.Text();
  var W = (jsmaf.root && jsmaf.root.width) ? jsmaf.root.width
        : (jsmaf.root && jsmaf.root.w) ? jsmaf.root.w
        : 1920;
  var H = (jsmaf.root && jsmaf.root.height) ? jsmaf.root.height
        : (jsmaf.root && jsmaf.root.h) ? jsmaf.root.h
        : 1080;
  var hintText = new jsmaf.Text();
  var btnyes = jsmaf.circleIsAdvanceButton ? 'O' : 'X';
  var btnno = jsmaf.circleIsAdvanceButton ? 'X' : 'O';
  hintText.text = '['+btnno+'] Back     ['+btnyes+'] Change';
  hintText.style = 'white';
  hintText.align = 'right';
  var mr = 50;
  var mb = 35;
  var tw = hintText.textWidth || 0;
  hintText.x = W - mr - tw;
  hintText.y = H - mb;
  jsmaf.root.children.push(hintText);
  var prevButton = -1;
  function updateHighlight() {
    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i];
      if (!b) continue;
      if (i === currentButton) {
        b.url = selectedButtonImg;
        b.alpha = 1.0;
      } else {
        b.url = normalButtonImg;
        b.alpha = 1.0;
      }
      if (buttonTexts[i]) {
        buttonTexts[i].scaleX = 1.0;
        buttonTexts[i].scaleY = 1.0;
        buttonTexts[i].x = textOrigPos[i].x;
        buttonTexts[i].y = textOrigPos[i].y;
      }
      b.scaleX = 1.0;
      b.scaleY = 1.0;
      b.x = buttonOrigPos[i].x;
      b.y = buttonOrigPos[i].y;
      if (valueTexts[i]) {
        valueTexts[i].scaleX = 1.0;
        valueTexts[i].scaleY = 1.0;
      }
    }
    prevButton = currentButton;
  }
  function updateValueText(index) {
    var options = configOptions[index];
    var valueText = valueTexts[index];
    if (!options || !valueText) return;
    var key = options.key;
    if (options.type === 'toggle') {
      var value = currentConfig[key];
      valueText.url = value ? 'file:///assets/img/check_small_on.png' : 'file:///assets/img/check_small_off.png';
    } else {
      if (key === 'jb_behavior') {
        if (useImageText) {
          valueText.url = textImageBase + jbBehaviorImgKeys[currentConfig.jb_behavior] + '.png';
        } else {
          valueText.text = jbBehaviorLabels[currentConfig.jb_behavior] || jbBehaviorLabels[0];
        }
      } else if (key === 'theme') {
        var _themeIndex = availableThemes.indexOf(currentConfig.theme);
        var _displayIndex = _themeIndex >= 0 ? _themeIndex : 0;
        if (useImageText) {
          valueText.url = textImageBase + themeImgKeys[_displayIndex] + '.png';
        } else {
          valueText.text = themeLabels[_displayIndex] || themeLabels[0];
        }
      }
    }
  }
  function saveConfig() {
    if (!configLoaded) {
      log('Config not loaded yet, skipping save');
      return;
    }
    var configContent = 'const CONFIG = {\n';
    configContent += '    autolapse: ' + currentConfig.autolapse + ',\n';
    configContent += '    autopoop: ' + currentConfig.autopoop + ',\n';
    configContent += '    autoclose: ' + currentConfig.autoclose + ',\n';
    configContent += '    autoclose_delay: ' + currentConfig.autoclose_delay + ', //set to 20000 for ps4 hen\n';
    configContent += '    music: ' + currentConfig.music + ',\n';
    configContent += '    jb_behavior: ' + currentConfig.jb_behavior + ',\n';
    configContent += '    theme: \'' + currentConfig.theme + '\'\n';
    configContent += '};\n\n';
    configContent += 'const payloads = [ //to be ran after jailbroken\n';
    for (var _i3 = 0; _i3 < userPayloads.length; _i3++) {
      configContent += '    "' + userPayloads[_i3] + '"';
      if (_i3 < userPayloads.length - 1) {
        configContent += ',';
      }
      configContent += '\n';
    }
    configContent += '];\n';
    fs.write('config.js', configContent, function (err) {
      if (err) {
        log('ERROR: Failed to save config: ' + err.message);
      } else {
        log('Config saved successfully');
      }
    });
  }
  function loadConfig() {
    fs.read('config.js', function (err, data) {
      if (err) {
        log('ERROR: Failed to read config: ' + err.message);
        return;
      }
      try {
        eval(data || ''); // eslint-disable-line no-eval
        if (typeof CONFIG !== 'undefined') {
          currentConfig.autolapse = CONFIG.autolapse || false;
          currentConfig.autopoop = CONFIG.autopoop || false;
          currentConfig.autoclose = CONFIG.autoclose || false;
          currentConfig.autoclose_delay = CONFIG.autoclose_delay || 0;
          currentConfig.music = CONFIG.music !== false;
          currentConfig.jb_behavior = CONFIG.jb_behavior || 0;

          // Validate and set theme (themes are auto-discovered from directory scan)
          if (CONFIG.theme && availableThemes.includes(CONFIG.theme)) {
            currentConfig.theme = CONFIG.theme;
          } else {
            log('WARNING: Theme "' + (CONFIG.theme || 'undefined') + '" not found in available themes, using default');
            currentConfig.theme = availableThemes[0] || 'default';
          }

          // Preserve user's payloads
          if (typeof payloads !== 'undefined' && Array.isArray(payloads)) {
            userPayloads = payloads.slice();
          }
          for (var _i4 = 0; _i4 < configOptions.length; _i4++) {
            updateValueText(_i4);
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
  function handleButtonPress() {
    if (currentButton < configOptions.length) {
      var option = configOptions[currentButton];
      var key = option.key;
      if (option.type === 'cycle') {
        if (key === 'jb_behavior') {
          currentConfig.jb_behavior = (currentConfig.jb_behavior + 1) % jbBehaviorLabels.length;
          log(key + ' = ' + jbBehaviorLabels[currentConfig.jb_behavior]);
        } else if (key === 'theme') {
          var _themeIndex2 = availableThemes.indexOf(currentConfig.theme);
          var _displayIndex2 = _themeIndex2 >= 0 ? _themeIndex2 : 0;
          var nextIndex = (_displayIndex2 + 1) % availableThemes.length;
          currentConfig.theme = availableThemes[nextIndex];
          log(key + ' = ' + currentConfig.theme);
        }
      } else {
        var boolKey = key;
        currentConfig[boolKey] = !currentConfig[boolKey];
        if (key === 'autolapse' && currentConfig.autolapse === true) {
          currentConfig.autopoop = false;
          for (var _i5 = 0; _i5 < configOptions.length; _i5++) {
            if (configOptions[_i5].key === 'autopoop') {
              updateValueText(_i5);
              break;
            }
          }
          log('autopoop disabled (autolapse enabled)');
        } else if (key === 'autopoop' && currentConfig.autopoop === true) {
          currentConfig.autolapse = false;
          for (var _i6 = 0; _i6 < configOptions.length; _i6++) {
            if (configOptions[_i6].key === 'autolapse') {
              updateValueText(_i6);
              break;
            }
          }
          log('autolapse disabled (autopoop enabled)');
        }
        log(key + ' = ' + currentConfig[boolKey]);
      }
      updateValueText(currentButton);
      saveConfig();
    }
  }
  var confirmKey = jsmaf.circleIsAdvanceButton ? 13 : 14;
  var backKey = jsmaf.circleIsAdvanceButton ? 14 : 13;
  jsmaf.onKeyDown = function (keyCode) {
    if (keyCode === 6 || keyCode === 5) {
      currentButton = (currentButton + 1) % buttons.length;
      updateHighlight();
    } else if (keyCode === 4 || keyCode === 7) {
      currentButton = (currentButton - 1 + buttons.length) % buttons.length;
      updateHighlight();
    } else if (keyCode === confirmKey) {
      handleButtonPress();
    } else if (keyCode === backKey) {
      log('Restarting...');
      // Save config before restart
      saveConfig();
      jsmaf.setTimeout(function () {
        debugging.restart();
      }, 100);
    }
  };
  updateHighlight();
  loadConfig();
  log(lang.configLoaded);
})();