(function () {
  include('languages.js');
  log(lang.loadingMainMenu);

  var currentRow = 0;

  var normalRowImg = 'file:///assets/img/button_over_9.png';
  var selectedRowImg = 'file:///assets/img/button_over_9.png';

  jsmaf.root.children.length = 0;

  new Style({ name: 'white', color: 'white', size: 24 });
  new Style({ name: 'title', color: 'white', size: 36 });
  new Style({ name: 'subtitle', color: 'rgb(220,220,220)', size: 22 });
  new Style({ name: 'desc', color: 'rgb(200,200,200)', size: 20 });

  if (typeof CONFIG !== 'undefined' && CONFIG.music) {
    var audio = new jsmaf.AudioClip();
    audio.volume = 0.5;
    audio.open('file://../download0/sfx/bgm.wav');
  }

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
  // Header
  var header = new jsmaf.Text();
  header.text = 'Vue After Free';
  header.x = 160;
  header.y = 120;
  header.style = 'title';
  jsmaf.root.children.push(header);

  // Options
  var menuOptions = [
    { label: lang.jailbreak,   script: 'loader.js',        desc: 'Start jailbreaking your machine now.' },
    { label: lang.payloadMenu, script: 'payload_host.js',  desc: 'Browse payloads from /data/ or USB > /data/' },
    { label: lang.config,      script: 'config_ui.js',     desc: 'You can set configurations such as automation, music, themes, etc.' },
    { label: lang.exit,        script: '__exit__',         desc: 'Close the application.' }
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

  var rows = [];
  var rowTexts = [];
  var rowOrigPos = [];
  var rowTextOrigPos = [];

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

  var hint = new jsmaf.Text();
  hint.x = rightX + 40;
  hint.y = rightY + rightH - 60;
  hint.style = 'subtitle';
  jsmaf.root.children.push(hint);

  for (var i = 0; i < menuOptions.length; i++) {
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

    var t = new jsmaf.Text();
    t.text = menuOptions[i].label;
    t.x = leftX + 26;
    t.y = y + 24;
    t.style = 'white';
    rowTexts.push(t);
    jsmaf.root.children.push(t);

    rowOrigPos.push({ x: row.x, y: row.y });
    rowTextOrigPos.push({ x: t.x, y: t.y });
  }

  var zoomInterval = null;
  var prevRow = -1;
  function easeInOut(t) {
    return (1 - Math.cos(t * Math.PI)) / 2;
  }
  function animateZoom(btn, text, btnOrigX, btnOrigY, textOrigX, textOrigY, fromScale, toScale) {
    if (zoomInterval) jsmaf.clearInterval(zoomInterval);
    var duration = 160;
    var elapsed = 0;
    var step = 16;
    zoomInterval = jsmaf.setInterval(function () {
      elapsed += step;
      var tt = Math.min(elapsed / duration, 1);
      var eased = easeInOut(tt);
      var scale = fromScale + (toScale - fromScale) * eased;

      btn.scaleX = scale;
      btn.scaleY = scale;
      btn.x = btnOrigX - leftW * (scale - 1) / 2;
      btn.y = btnOrigY - rowH * (scale - 1) / 2;

      text.scaleX = scale;
      text.scaleY = scale;
      text.x = textOrigX - leftW * (scale - 1) / 2;
      text.y = textOrigY - rowH * (scale - 1) / 2;

      if (tt >= 1) {
        jsmaf.clearInterval(zoomInterval);
        zoomInterval = null;
      }
    }, step);
  }

  function updateDetails() {
    var opt = menuOptions[currentRow];
    detailTitle.text = opt.label;
    detailDesc.text = opt.desc || '';

    var ok = jsmaf.circleIsAdvanceButton ? 'O' : 'X';
    var back = jsmaf.circleIsAdvanceButton ? 'X' : 'O';
    hint.text = ok + ' Open   ' + back + ' Back';
  }

  function updateHighlight() {
    if (prevRow >= 0 && prevRow !== currentRow && rows[prevRow]) {
      rows[prevRow].alpha = 0.55;
      rows[prevRow].borderColor = 'transparent';
      rows[prevRow].borderWidth = 0;
      rows[prevRow].scaleX = 1.0;
      rows[prevRow].scaleY = 1.0;
      rows[prevRow].x = rowOrigPos[prevRow].x;
      rows[prevRow].y = rowOrigPos[prevRow].y;

      rowTexts[prevRow].scaleX = 1.0;
      rowTexts[prevRow].scaleY = 1.0;
      rowTexts[prevRow].x = rowTextOrigPos[prevRow].x;
      rowTexts[prevRow].y = rowTextOrigPos[prevRow].y;
    }

    for (var i = 0; i < rows.length; i++) {
      if (i === currentRow) {
        rows[i].alpha = 0.95;
        rows[i].borderColor = 'rgb(100,180,255)';
        rows[i].borderWidth = 3;
        animateZoom(rows[i], rowTexts[i], rowOrigPos[i].x, rowOrigPos[i].y, rowTextOrigPos[i].x, rowTextOrigPos[i].y, rows[i].scaleX || 1.0, 1.06);
      } else if (i !== prevRow) {
        rows[i].alpha = 0.55;
        rows[i].borderColor = 'transparent';
        rows[i].borderWidth = 0;
      }
    }
    prevRow = currentRow;
    updateDetails();
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

  function openCurrent() {
    var opt = menuOptions[currentRow];
    if (!opt) return;

    if (opt.script === '__exit__') {
      exitApp();
      return;
    }

    log('Loading ' + opt.script + '...');
    try {
      if (opt.script === 'loader.js') {
        jsmaf.onKeyDown = function () {};
        include(opt.script);
      } else {
        include('themes/' + (typeof CONFIG !== 'undefined' && CONFIG.theme ? CONFIG.theme : 'default') + '/' + opt.script);
      }
    } catch (e) {
      log('ERROR loading ' + opt.script + ': ' + e.message);
      if (e.stack) log(e.stack);
    }
  }

  var confirmKey = jsmaf.circleIsAdvanceButton ? 13 : 14;
  var backKey = jsmaf.circleIsAdvanceButton ? 14 : 13;

  jsmaf.onKeyDown = function (keyCode) {
    if (keyCode === 6) {
      currentRow = (currentRow + 1) % rows.length;
      updateHighlight();
    } else if (keyCode === 4) {
      currentRow = (currentRow - 1 + rows.length) % rows.length;
      updateHighlight();
    } else if (keyCode === confirmKey) {
      openCurrent();
    } else if (keyCode === backKey) {
      // On main screen, back == exit
      exitApp();
    }
  };

  updateHighlight();
  log(lang.mainMenuLoaded);
})();
