(function () {
  if (typeof libc_addr === 'undefined') {
    log('Loading userland.js...');
    include('userland.js');
    log('userland.js loaded');
  } else {
    log('userland.js already loaded (libc_addr defined)');
  }
  log('Loading check-jailbroken.js...');
  include('check-jailbroken.js');
  if (typeof CONFIG !== 'undefined' && CONFIG.music) {
    var audio = new jsmaf.AudioClip();
    audio.volume = 0.5;
    audio.open('file://../download0/sfx/bgm.wav');
  }
  is_jailbroken = checkJailbroken();
  jsmaf.root.children.length = 0;
  new Style({
    name: 'white',
    color: 'white',
    size: 24
  });
  new Style({
    name: 'title',
    color: 'white',
    size: 32
  });
  var currentButton = 0;
  var buttons = [];
  var buttonTexts = [];
  var buttonMarkers = [];
  var buttonOrigPos = [];
  var textOrigPos = [];
  var fileList = [];
  var normalButtonImg = 'file:///assets/img/button_over_9.png';
  var selectedButtonImg = 'file:///assets/img/button_over_9.png';
  var background = new Image({
    url: 'file:///../download0/themes/ps4ui/img/background.png',
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
  
  var header = new jsmaf.Text();
  header.text = 'Payload Menu';
  header.x = 160;
  header.y = 120;
  header.style = 'title';
  jsmaf.root.children.push(header);

  fn.register(0x05, 'open_sys', ['bigint', 'bigint', 'bigint'], 'bigint');
  fn.register(0x06, 'close_sys', ['bigint'], 'bigint');
  fn.register(0x110, 'getdents', ['bigint', 'bigint', 'bigint'], 'bigint');
  fn.register(0x03, 'read_sys', ['bigint', 'bigint', 'bigint'], 'bigint');
  var scanPaths = ['/download0/payloads'];
  if (is_jailbroken) {
    scanPaths.push('/data/payloads');
    for (var i = 0; i <= 7; i++) {
      scanPaths.push('/mnt/usb' + i + '/payloads');
    }
  }
  log('Scanning paths: ' + scanPaths.join(', '));
  var path_addr = mem.malloc(256);
  var buf = mem.malloc(4096);
  for (var currentPath of scanPaths) {
    log('Scanning ' + currentPath + ' for files...');
    for (var _i = 0; _i < currentPath.length; _i++) {
      mem.view(path_addr).setUint8(_i, currentPath.charCodeAt(_i));
    }
    mem.view(path_addr).setUint8(currentPath.length, 0);
    var fd = fn.open_sys(path_addr, new BigInt(0, 0), new BigInt(0, 0));
    // log('open_sys (' + currentPath + ') returned: ' + fd.toString())

    if (!fd.eq(new BigInt(0xffffffff, 0xffffffff))) {
      var count = fn.getdents(fd, buf, new BigInt(0, 4096));
      // log('getdents returned: ' + count.toString() + ' bytes')

      if (!count.eq(new BigInt(0xffffffff, 0xffffffff)) && count.lo > 0) {
        var offset = 0;
        while (offset < count.lo) {
          var d_reclen = mem.view(buf.add(new BigInt(0, offset + 4))).getUint16(0, true);
          var d_type = mem.view(buf.add(new BigInt(0, offset + 6))).getUint8(0);
          var d_namlen = mem.view(buf.add(new BigInt(0, offset + 7))).getUint8(0);
          var name = '';
          for (var _i2 = 0; _i2 < d_namlen; _i2++) {
            name += String.fromCharCode(mem.view(buf.add(new BigInt(0, offset + 8 + _i2))).getUint8(0));
          }

          // log('Entry: ' + name + ' type=' + d_type)

          if (d_type === 8 && name !== '.' && name !== '..') {
            var lowerName = name.toLowerCase();
            if (lowerName.endsWith('.elf') || lowerName.endsWith('.bin') || lowerName.endsWith('.js')) {
              fileList.push({
                name,
                path: currentPath + '/' + name
              });
              log('Added file: ' + name + ' from ' + currentPath);
            }
          }
          offset += d_reclen;
        }
      }
      fn.close_sys(fd);
    } else {
      log('Failed to open ' + currentPath);
    }
  }
  log('Total files found: ' + fileList.length);
  var startY = 230;
  var buttonSpacing = 82;
  var buttonsPerRow = 5;
  var buttonWidth = 320;
  var buttonHeight = 72;
  var startX = 140;
  var xSpacing = 330;
  for (var _i3 = 0; _i3 < fileList.length; _i3++) {
    var row = Math.floor(_i3 / buttonsPerRow);
    var col = _i3 % buttonsPerRow;
    var displayName = fileList[_i3].name;
    var btnX = startX + col * xSpacing;
    var btnY = startY + row * buttonSpacing;
    var button = new Image({
      url: normalButtonImg,
      x: btnX,
      y: btnY,
      width: buttonWidth,
      height: buttonHeight
    });
    buttons.push(button);
    button.alpha = 0.35;
    jsmaf.root.children.push(button);
    var marker = new Image({
      url: 'file:///assets/img/ad_pod_marker.png',
      x: btnX + buttonWidth - 50,
      y: btnY + 35,
      width: 12,
      height: 12,
      visible: false
    });
    buttonMarkers.push(marker);
    marker.alpha = 0.0;
    jsmaf.root.children.push(marker);
    if (displayName.length > 30) {
      displayName = displayName.substring(0, 27) + '...';
    }
    var text = new jsmaf.Text();
    text.text = displayName;
    text.x = btnX + 18;
    text.y = btnY + 24;
    text.style = 'white';
    buttonTexts.push(text);
    jsmaf.root.children.push(text);
    buttonOrigPos.push({
      x: btnX,
      y: btnY
    });
    textOrigPos.push({
      x: text.x,
      y: text.y
    });
  }
  var backHint = new jsmaf.Text();
  var ok = jsmaf.circleIsAdvanceButton ? 'O' : 'X';
  var back = jsmaf.circleIsAdvanceButton ? 'X' : 'O';
  backHint.text = ok + ' Open   ' + back + ' Back';
  backHint.x = 160;
  backHint.y = 1000;
  backHint.style = 'white';
  jsmaf.root.children.push(backHint);
  var zoomInInterval = null;
  var zoomOutInterval = null;
  var prevButton = -1;
  function easeInOut(t) {
    return (1 - Math.cos(t * Math.PI)) / 2;
  }
  function animateZoomIn(btn, text, btnOrigX, btnOrigY, textOrigX, textOrigY) {
    if (zoomInInterval) jsmaf.clearInterval(zoomInInterval);
    var btnW = buttonWidth;
    var btnH = buttonHeight;
    var startScale = btn.scaleX || 1.0;
    var endScale = 1.1;
    var duration = 175;
    var elapsed = 0;
    var step = 16;
    zoomInInterval = jsmaf.setInterval(function () {
      elapsed += step;
      var t = Math.min(elapsed / duration, 1);
      var eased = easeInOut(t);
      var scale = startScale + (endScale - startScale) * eased;
      btn.scaleX = scale;
      btn.scaleY = scale;
      btn.x = btnOrigX - btnW * (scale - 1) / 2;
      btn.y = btnOrigY - btnH * (scale - 1) / 2;
      text.scaleX = scale;
      text.scaleY = scale;
      text.x = textOrigX - btnW * (scale - 1) / 2;
      text.y = textOrigY - btnH * (scale - 1) / 2;
      if (t >= 1) {
        jsmaf.clearInterval(zoomInInterval);
        zoomInInterval = null;
      }
    }, step);
  }
  function animateZoomOut(btn, text, btnOrigX, btnOrigY, textOrigX, textOrigY) {
    if (zoomOutInterval) jsmaf.clearInterval(zoomOutInterval);
    var btnW = buttonWidth;
    var btnH = buttonHeight;
    var startScale = btn.scaleX || 1.1;
    var endScale = 1.0;
    var duration = 175;
    var elapsed = 0;
    var step = 16;
    zoomOutInterval = jsmaf.setInterval(function () {
      elapsed += step;
      var t = Math.min(elapsed / duration, 1);
      var eased = easeInOut(t);
      var scale = startScale + (endScale - startScale) * eased;
      btn.scaleX = scale;
      btn.scaleY = scale;
      btn.x = btnOrigX - btnW * (scale - 1) / 2;
      btn.y = btnOrigY - btnH * (scale - 1) / 2;
      text.scaleX = scale;
      text.scaleY = scale;
      text.x = textOrigX - btnW * (scale - 1) / 2;
      text.y = textOrigY - btnH * (scale - 1) / 2;
      if (t >= 1) {
        jsmaf.clearInterval(zoomOutInterval);
        zoomOutInterval = null;
      }
    }, step);
  }
  function updateHighlight() {
    // Animate out the previous button
    var prevButtonObj = buttons[prevButton];
    var buttonMarker = buttonMarkers[prevButton];
    if (prevButton >= 0 && prevButton !== currentButton && prevButtonObj) {
      prevButtonObj.url = normalButtonImg;
      prevButtonObj.alpha = 0.35;
      prevButtonObj.borderColor = 'transparent';
      prevButtonObj.borderWidth = 0;
      if (buttonMarker) buttonMarker.visible = false;
      // No zoom animation (PS4-style flat highlight)
      prevButtonObj.scaleX = 1.0;
      prevButtonObj.scaleY = 1.0;
      prevButtonObj.x = buttonOrigPos[prevButton].x;
      prevButtonObj.y = buttonOrigPos[prevButton].y;
      var prevText = buttonTexts[prevButton];
      if (prevText) {
        prevText.scaleX = 1.0;
        prevText.scaleY = 1.0;
        prevText.x = textOrigPos[prevButton].x;
        prevText.y = textOrigPos[prevButton].y;
      }
    }

    // Set styles for all buttons
    for (var _i4 = 0; _i4 < buttons.length; _i4++) {
      var _button = buttons[_i4];
      var _buttonMarker = buttonMarkers[_i4];
      var buttonText = buttonTexts[_i4];
      var buttonOrigPos_ = buttonOrigPos[_i4];
      var textOrigPos_ = textOrigPos[_i4];
      if (_button === undefined || buttonText === undefined || buttonOrigPos_ === undefined || textOrigPos_ === undefined) continue;
      if (_i4 === currentButton) {
        _button.url = selectedButtonImg;
        _button.alpha = 0.85;
        _button.borderColor = 'rgb(100,180,255)';
        _button.borderWidth = 2;
        if (_buttonMarker) _buttonMarker.visible = false;
        // No zoom animation (PS4-style flat highlight)
      } else if (_i4 !== prevButton) {
        _button.url = normalButtonImg;
        _button.alpha = 0.35;
        _button.borderColor = 'transparent';
        _button.borderWidth = 0;
        _button.scaleX = 1.0;
        _button.scaleY = 1.0;
        _button.x = buttonOrigPos_.x;
        _button.y = buttonOrigPos_.y;
        buttonText.scaleX = 1.0;
        buttonText.scaleY = 1.0;
        buttonText.x = textOrigPos_.x;
        buttonText.y = textOrigPos_.y;
        if (_buttonMarker) _buttonMarker.visible = false;
      }
    }
    prevButton = currentButton;
  }
  var confirmKey = jsmaf.circleIsAdvanceButton ? 13 : 14;
  var backKey = jsmaf.circleIsAdvanceButton ? 14 : 13;
  jsmaf.onKeyDown = function (keyCode) {
    log('Key pressed: ' + keyCode);
    var fileButtonCount = fileList.length;
    if (keyCode === 6) {
      var nextButton = currentButton + buttonsPerRow;
      if (nextButton < fileButtonCount) {
        currentButton = nextButton;
      }
      updateHighlight();
    } else if (keyCode === 4) {
      var _nextButton = currentButton - buttonsPerRow;
      if (_nextButton >= 0) {
        currentButton = _nextButton;
      }
      updateHighlight();
    } else if (keyCode === 5) {
      var _nextButton2 = currentButton + 1;
      var _row = Math.floor(currentButton / buttonsPerRow);
      var nextRow = Math.floor(_nextButton2 / buttonsPerRow);
      if (_nextButton2 < fileButtonCount && nextRow === _row) {
        currentButton = _nextButton2;
      }
      updateHighlight();
    } else if (keyCode === 7) {
      var _col = currentButton % buttonsPerRow;
      if (_col > 0) {
        currentButton = currentButton - 1;
      }
      updateHighlight();
    } else if (keyCode === confirmKey) {
      handleButtonPress();
    } else if (keyCode === backKey) {
      log('Going back to main menu...');
      try {
        include('themes/' + (typeof CONFIG !== 'undefined' && CONFIG.theme ? CONFIG.theme : 'default') + '/main.js');
      } catch (e) {
        var err = e;
        log('ERROR loading main.js: ' + err.message);
        if (err.stack) log(err.stack);
      }
    }
  };
  function handleButtonPress() {
    if (currentButton < fileList.length) {
      var selectedEntry = fileList[currentButton];
      if (!selectedEntry) {
        log('No file selected!');
        return;
      }
      var filePath = selectedEntry.path;
      var fileName = selectedEntry.name;
      log('Selected: ' + fileName + ' from ' + filePath);
      try {
        if (fileName.toLowerCase().endsWith('.js')) {
          // Local JavaScript file case (from /download0/payloads)
          if (filePath.startsWith('/download0/')) {
            log('Including JavaScript file: ' + fileName);
            include('payloads/' + fileName);
          } else {
            // External JavaScript file case (from /data/payloads or /mnt/usbX/payloads)
            log('Reading external JavaScript file: ' + filePath);
            var p_addr = mem.malloc(256);
            for (var _i5 = 0; _i5 < filePath.length; _i5++) {
              mem.view(p_addr).setUint8(_i5, filePath.charCodeAt(_i5));
            }
            mem.view(p_addr).setUint8(filePath.length, 0);
            var _fd = fn.open_sys(p_addr, new BigInt(0, 0), new BigInt(0, 0));
            if (!_fd.eq(new BigInt(0xffffffff, 0xffffffff))) {
              var buf_size = 1024 * 1024 * 1; // 1 MiB
              var _buf = mem.malloc(buf_size);
              var read_len = fn.read_sys(_fd, _buf, new BigInt(0, buf_size));
              fn.close_sys(_fd);
              var scriptContent = '';
              var len = read_len instanceof BigInt ? read_len.lo : read_len;
              log('File read size: ' + len + ' bytes');
              for (var _i6 = 0; _i6 < len; _i6++) {
                scriptContent += String.fromCharCode(mem.view(_buf).getUint8(_i6));
              }
              log('Executing via eval()...');
              // eslint-disable-next-line no-eval
              eval(scriptContent);
            } else {
              log('ERROR: Could not open file for reading!');
            }
          }
        } else {
          log('Loading binloader.js...');
          include('binloader.js');
          log('binloader.js loaded successfully');
          log('Initializing binloader...');
          var {
            bl_load_from_file
          } = binloader_init();
          log('Loading payload from: ' + filePath);
          bl_load_from_file(filePath);
        }
      } catch (e) {
        var err = e;
        log('ERROR: ' + err.message);
        if (err.stack) log(err.stack);
      }
    }
  }
  updateHighlight();
  log('Interactive UI loaded!');
  log('Total elements: ' + jsmaf.root.children.length);
  log('Buttons: ' + buttons.length);
  log('Use arrow keys to navigate, Enter/X to select');
})();