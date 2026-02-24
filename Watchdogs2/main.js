(function () {
  include('languages.js');
  log(lang.loadingMainMenu);
  var currentButton = 0;
  var buttons = [];
  var buttonTexts = [];
  var buttonMarkers = [];
  var buttonOrigPos = [];
  var textOrigPos = [];
  var normalButtonImg = 'file://../download0/themes/Watchdogs2/img/ps4_bar_normal.png';
  var selectedButtonImg = 'file://../download0/themes/Watchdogs2/img/ps4_bar_selected.png';
  jsmaf.root.children.length = 0;
  new Style({
    name: 'white',
    color: 'white',
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
  jsmaf.root.children.push(background);  var centerX = 960;
  var titleText = new jsmaf.Text();
  titleText.text = '[+] Vue After Free';
  titleText.x = 64;
  titleText.y = 54;
  titleText.style = 'title';
  jsmaf.root.children.push(titleText);

  var W = (jsmaf.root && jsmaf.root.width) ? jsmaf.root.width
        : (jsmaf.root && jsmaf.root.w) ? jsmaf.root.w
        : 1920;
  var H = (jsmaf.root && jsmaf.root.height) ? jsmaf.root.height
        : (jsmaf.root && jsmaf.root.h) ? jsmaf.root.h
        : 1080;
  var hintText = new jsmaf.Text();
  var btnyes = jsmaf.circleIsAdvanceButton ? 'O' : 'X';
  var btnno = jsmaf.circleIsAdvanceButton ? 'X' : 'O';
  hintText.text = '['+btnno+'] Exit     ['+btnyes+'] Open';
  hintText.style = 'white';
  hintText.align = 'right';
  var mr = 50;
  var mb = 35;
  var tw = hintText.textWidth || 0;
  hintText.x = W - mr - tw;
  hintText.y = H - mb;
  jsmaf.root.children.push(hintText);
  
  var menuOptions = [{
    label: lang.jailbreak,
    script: 'loader.js',
    imgKey: 'jailbreak'
  }, {
    label: lang.payloadMenu,
    script: 'payload_host.js',
    imgKey: 'payloadMenu'
  }, {
    label: lang.config,
    script: 'config_ui.js',
    imgKey: 'config'
  }, {
    label: lang.exit,
    script: '__exit__',
    imgKey: 'exit'
  }];
    var startY = 136;
    var buttonSpacing = 70;
    var buttonWidth = 1408;
    var buttonHeight = 50;
  for (var i = 0; i < menuOptions.length; i++) {
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
    var marker = new Image({
      url: 'file:///assets/img/ad_pod_marker.png',
      x: btnX + buttonWidth - 40,
      y: btnY + 28,
      width: 10,
      height: 10,
      visible: false
    });
    buttonMarkers.push(marker);
    jsmaf.root.children.push(marker);
    var btnText = void 0;
    if (useImageText) {
      btnText = new Image({
        url: textImageBase + menuOptions[i].imgKey + '.png',
        x: btnX + 16,
        y: btnY + 12,
        width: 240,
        height: 40
      });
    } else {
      btnText = new jsmaf.Text();
      btnText.text = menuOptions[i].label;
            btnText.x = btnX + 24;
      btnText.y = btnY + 14;
      btnText.style = 'white';
    }
    buttonTexts.push(btnText);
    jsmaf.root.children.push(btnText);
    buttonOrigPos.push({
      x: btnX,
      y: btnY
    });
    textOrigPos.push({
      x: btnText.x,
      y: btnText.y
    });
  }  var prevButton = -1;
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
      if (buttonMarkers[i]) buttonMarkers[i].visible = false;
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
  function handleButtonPress() {
    if (currentButton < menuOptions.length) {
      var selectedOption = menuOptions[currentButton];
      if (!selectedOption) return;
      if (selectedOption.script === '__exit__') {
        exitApp();
        return;
      }
      if (selectedOption.script === 'loader.js') {
        jsmaf.onKeyDown = function () {};
      }
      log('Loading ' + selectedOption.script + '...');
      try {
        if (selectedOption.script.includes('loader.js')) {
          include(selectedOption.script);
        } else {
          include('themes/' + (typeof CONFIG !== 'undefined' && CONFIG.theme ? CONFIG.theme : 'default') + '/' + selectedOption.script);
        }
      } catch (e) {
        log('ERROR loading ' + selectedOption.script + ': ' + e.message);
        if (e.stack) log(e.stack);
      }
    }
  }
  function exitApp() {
    log('Exiting application...');
    try {
      if (typeof libc_addr === 'undefined') {
        log('Loading userland.js...');
        include('userland.js');
      }
      fn.register(0x14, 'getpid', [], 'bigint');
      fn.register(0x25, 'kill', ['bigint', 'bigint'], 'bigint');

      var pid = fn.getpid();
      log('Sending SIGKILL...');
      fn.kill(pid, new BigInt(0, 9));
    } catch (e) {
      log('ERROR during exit: ' + e.message);
      if (e.stack) log(e.stack);
    }
    jsmaf.exit();
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
      exitApp();
    }
  };
  updateHighlight();
  log(lang.mainMenuLoaded);
})();