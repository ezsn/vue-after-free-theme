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
    new Style({ name: 'payloadText', color: 'black', size: 22 });
  new Style({ name: 'payloadTextSel', color: 'white', size: 22 });
  new Style({ name: 'title', color: 'white', size: 25 });
var currentButton = 0;
  var buttons = [];
  var buttonTexts = [];
  var buttonMarkers = [];
  var buttonOrigPos = [];
  var textOrigPos = [];
  var fileList = [];
    var normalButtonImg = 'file://../download0/themes/Persona3Reload/img/white.png';
    var selectedButtonImg = 'file://../download0/themes/Persona3Reload/img/red.png';
  var background = new Image({
    url: 'file://../download0/themes/Persona3Reload/img/bgPayload.png',
    x: 0,
    y: 0,
    width: 1920,
    height: 1080
  });
  jsmaf.root.children.push(background);
  
  var titleText = new jsmaf.Text();
  titleText.text = '[<] Payload Menu';
  titleText.x = 64;
  titleText.y = 54;
  titleText.style = 'title';
  jsmaf.root.children.push(titleText);

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
      var startY = 180;
  var buttonSpacing = 78;
  var buttonsPerRow = 4;
  var buttonWidth = 320;
  var buttonHeight = 58;
  var startX = 180;
  var xSpacing = 350;
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
    button.alpha = 0.70;
    jsmaf.root.children.push(button);
    var marker = new Image({
      url: 'file:///assets/img/ad_pod_marker.png',
      x: btnX + buttonWidth - 40,
      y: btnY + 20,
      width: 10,
      height: 10,
      visible: false
    });
    buttonMarkers.push(marker);
    jsmaf.root.children.push(marker);
    if (displayName.length > 30) {
      displayName = displayName.substring(0, 27) + '...';
    }
    var text = new jsmaf.Text();
    text.text = displayName;
    text.x = btnX + 16;
    text.y = btnY + 14;
    text.style = 'payloadText';
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
  var W = (jsmaf.root && jsmaf.root.width) ? jsmaf.root.width
        : (jsmaf.root && jsmaf.root.w) ? jsmaf.root.w
        : 1920;
  var H = (jsmaf.root && jsmaf.root.height) ? jsmaf.root.height
        : (jsmaf.root && jsmaf.root.h) ? jsmaf.root.h
        : 1080;
  var hintText = new jsmaf.Text();
  var btnyes = jsmaf.circleIsAdvanceButton ? 'O' : 'X';
  var btnno = jsmaf.circleIsAdvanceButton ? 'X' : 'O';
  hintText.text = '['+btnno+'] Back     ['+btnyes+'] Load';
  hintText.style = 'payloadTextSel';
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
        b.alpha = 0.70;
      }
      if (buttonMarkers[i]) buttonMarkers[i].visible = false;
      if (buttonTexts[i]) {
        buttonTexts[i].style = (i === currentButton) ? 'payloadTextSel' : 'payloadText';
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