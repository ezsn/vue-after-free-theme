(function () {
  include('languages.js');
  log(lang.loadingMainMenu);
  var currentButton = 0;
  var buttons = [];
  var buttonTexts = [];
  var buttonMarkers = [];
  var buttonOrigPos = [];
  var textOrigPos = [];
  var normalButtonImg = 'file:///assets/img/ps4_bar_normal.png';
  var selectedButtonImg = 'file:///assets/img/ps4_bar_selected.png';
  jsmaf.root.children.length = 0;
  new Style({
    name: 'white',
    color: 'white',
    size: 19
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
    url: 'file:///assets/img/ps4_bg_black.png',
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
  jsmaf.onKeyDown = function (keyCode) {
    if (keyCode === 6 || keyCode === 5) {
      currentButton = (currentButton + 1) % buttons.length;
      var hintText = new jsmaf.Text();
  hintText.text = '[O] Return     [X] Confirm';
  hintText.x = 1104;
  hintText.y = 810;
  hintText.style = 'white';
  jsmaf.root.children.push(hintText);

  updateHighlight();
    } else if (keyCode === 4 || keyCode === 7) {
      currentButton = (currentButton - 1 + buttons.length) % buttons.length;
      updateHighlight();
    } else if (keyCode === 14) {
      handleButtonPress();
    }
  };
  updateHighlight();
  log(lang.mainMenuLoaded);
})();