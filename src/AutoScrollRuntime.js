function createAutoScrollState() {
  return {
    panelView: null,
    titleLabel: null,
    statusLabel: null,
    speedLabel: null,
    speedSlider: null,
    handwritingDelayLabel: null,
    handwritingDelaySlider: null,
    toggleButton: null,
    panelVisible: false,
    isRunning: false,
    timer: null,
    tickInterval: 0.02,
    defaultSpeedPointsPerSecond: 120,
    speedPointsPerSecond: 120,
    pendingDeltaY: 0,
    panelPosition: null,
    panelDragOrigin: null,
    defaultsPrefix: "top.museday.auto_scroll",
    targetPath: null,
    isPausedByHandwriting: false,
    lastHandwritingTimestamp: 0,
    handwritingResumeDelaySeconds: 1,
  };
}

function getAutoScrollDefaultsKey(addon, suffix) {
  return addon.autoScrollState.defaultsPrefix + "." + suffix;
}

function loadAutoScrollSettings(addon) {
  var defaults = NSUserDefaults.standardUserDefaults();
  var speed = defaults.objectForKey(getAutoScrollDefaultsKey(addon, "speed"));
  var delay = defaults.objectForKey(getAutoScrollDefaultsKey(addon, "handwriting_delay"));
  if (typeof speed === "number" && isFinite(speed)) {
    addon.autoScrollState.speedPointsPerSecond = clampAutoScrollSpeed(speed);
  }
  if (typeof delay === "number" && isFinite(delay)) {
    addon.autoScrollState.handwritingResumeDelaySeconds = clampHandwritingResumeDelay(delay);
  }
}

function persistAutoScrollSpeed(addon) {
  NSUserDefaults.standardUserDefaults().setObjectForKey(
    addon.autoScrollState.speedPointsPerSecond,
    getAutoScrollDefaultsKey(addon, "speed"),
  );
}

function persistHandwritingResumeDelay(addon) {
  NSUserDefaults.standardUserDefaults().setObjectForKey(
    addon.autoScrollState.handwritingResumeDelaySeconds,
    getAutoScrollDefaultsKey(addon, "handwriting_delay"),
  );
}

function clampAutoScrollSpeed(speed) {
  if (speed < 5) return 5;
  if (speed > 400) return 400;
  return speed;
}

function clampHandwritingResumeDelay(delay) {
  if (delay < 0.5) return 0.5;
  if (delay > 1.5) return 1.5;
  return delay;
}

function getAutoScrollShortcutDefinitions() {
  return [
    {
      input: " ",
      flags: 0,
      title: "AutoScroll: Toggle Start Pause",
    },
    {
      input: "[",
      flags: 0,
      title: "AutoScroll: Decrease Speed",
    },
    {
      input: "]",
      flags: 0,
      title: "AutoScroll: Increase Speed",
    },
  ];
}

function getAutoScrollShortcutState(addon, command, keyFlags) {
  var shortcuts = getAutoScrollShortcutDefinitions();
  for (var i = 0; i < shortcuts.length; i++) {
    var shortcut = shortcuts[i];
    if (shortcut.input === command && shortcut.flags === keyFlags) {
      return {
        disabled: false,
        checked: command === " " ? addon.autoScrollState.isRunning : false,
      };
    }
  }
  return null;
}

function processAutoScrollShortcut(addon, command, keyFlags) {
  var shortcutState = getAutoScrollShortcutState(addon, command, keyFlags);
  if (!shortcutState || shortcutState.disabled) {
    return false;
  }

  if (command === " ") {
    toggleAutoScrollRunning(addon);
    return true;
  }

  if (command === "[") {
    nudgeAutoScrollSpeed(addon, -15);
    return true;
  }

  if (command === "]") {
    nudgeAutoScrollSpeed(addon, 15);
    return true;
  }

  return false;
}

function getStudyControllerForAddon(addon) {
  return Application.sharedInstance().studyController(addon.window);
}

function ensureAutoScrollPanelAttached(addon) {
  var studyController = getStudyControllerForAddon(addon);
  if (!studyController) {
    console.log("[AutoScroll] studyController is not ready");
    return false;
  }

  if (!addon.autoScrollState.panelView) {
    addon.autoScrollState.panelView = buildAutoScrollPanel(addon);
  }

  if (addon.autoScrollState.panelView.superview !== studyController.view) {
    addon.autoScrollState.panelView.removeFromSuperview();
    studyController.view.addSubview(addon.autoScrollState.panelView);
  }

  layoutAutoScrollPanel(addon);
  return true;
}

function getDefaultAutoScrollPanelFrame(addon) {
  var studyController = getStudyControllerForAddon(addon);
  var bounds = studyController.view.bounds;
  return {
    x: bounds.width - 236,
    y: 78,
    width: 220,
    height: 253,
  };
}

function clampAutoScrollPanelPosition(addon, x, y) {
  var studyController = getStudyControllerForAddon(addon);
  var panel = addon.autoScrollState.panelView;
  var bounds = studyController.view.bounds;
  var maxX = bounds.width - panel.frame.width - 8;
  var maxY = bounds.height - panel.frame.height - 8;

  if (maxX < 8) {
    maxX = 8;
  }
  if (maxY < 8) {
    maxY = 8;
  }

  if (x < 8) x = 8;
  if (y < 8) y = 8;
  if (x > maxX) x = maxX;
  if (y > maxY) y = maxY;

  return { x: x, y: y };
}

function updateAutoScrollPanelDrag(addon, gesture) {
  var panel = addon.autoScrollState.panelView;
  var studyController = getStudyControllerForAddon(addon);
  if (!panel || !studyController) {
    return;
  }

  var state = gesture.state;
  if (state === 1) {
    addon.autoScrollState.panelDragOrigin = {
      x: panel.frame.x,
      y: panel.frame.y,
    };
  }

  if (state === 1 || state === 2 || state === 3) {
    var translation = gesture.translationInView(studyController.view);
    var origin = addon.autoScrollState.panelDragOrigin || {
      x: panel.frame.x,
      y: panel.frame.y,
    };
    var nextPosition = clampAutoScrollPanelPosition(
      addon,
      origin.x + translation.x,
      origin.y + translation.y,
    );
    panel.frame = {
      x: nextPosition.x,
      y: nextPosition.y,
      width: panel.frame.width,
      height: panel.frame.height,
    };
    addon.autoScrollState.panelPosition = nextPosition;
  }

  if (state === 3 || state === 4 || state === 5) {
    addon.autoScrollState.panelDragOrigin = null;
    gesture.setTranslationInView({ x: 0, y: 0 }, studyController.view);
  }
}

function showAutoScrollPanel(addon) {
  if (!ensureAutoScrollPanelAttached(addon)) {
    return;
  }

  addon.autoScrollState.panelVisible = true;
  addon.autoScrollState.panelView.hidden = false;
  refreshAutoScrollPanel(addon);
  getStudyControllerForAddon(addon).refreshAddonCommands();
}

function hideAutoScrollPanel(addon) {
  if (addon.autoScrollState.panelView) {
    addon.autoScrollState.panelView.hidden = true;
  }
  addon.autoScrollState.panelVisible = false;

  var studyController = getStudyControllerForAddon(addon);
  if (studyController) {
    studyController.refreshAddonCommands();
  }
}

function toggleAutoScrollPanel(addon) {
  if (addon.autoScrollState.panelVisible) {
    hideAutoScrollPanel(addon);
  } else {
    showAutoScrollPanel(addon);
  }
}

function stopAutoScrollTimer(addon) {
  if (addon.autoScrollState.timer && addon.autoScrollState.timer.isValid) {
    addon.autoScrollState.timer.invalidate();
  }
  addon.autoScrollState.timer = null;
}

function ensureAutoScrollTimer(addon) {
  if (addon.autoScrollState.timer && addon.autoScrollState.timer.isValid) {
    return;
  }
  addon.autoScrollState.timer = NSTimer.scheduledTimerWithTimeInterval(
    addon.autoScrollState.tickInterval,
    true,
    function () {
      performAutoScrollTick(addon);
    },
  );
}

function pauseAutoScroll(addon, reason) {
  stopAutoScrollTimer(addon);
  addon.autoScrollState.isRunning = false;
  addon.autoScrollState.pendingDeltaY = 0;
  addon.autoScrollState.isPausedByHandwriting = false;
  addon.autoScrollState.lastHandwritingTimestamp = 0;
  refreshAutoScrollPanel(addon);
  if (reason) {
    console.log("[AutoScroll] paused: " + reason);
  }
}

function startAutoScroll(addon) {
  var target = findAutoScrollTarget(addon);
  if (!target) {
    console.log("[AutoScroll] no scrollable reader view found");
    pauseAutoScroll(addon, "missing target");
    return false;
  }

  addon.autoScrollState.isRunning = true;
  addon.autoScrollState.pendingDeltaY = 0;
  addon.autoScrollState.isPausedByHandwriting = false;
  addon.autoScrollState.lastHandwritingTimestamp = 0;
  ensureAutoScrollTimer(addon);
  refreshAutoScrollPanel(addon);
  console.log("[AutoScroll] started on " + target.path);
  return true;
}

function toggleAutoScrollRunning(addon) {
  if (addon.autoScrollState.isRunning) {
    pauseAutoScroll(addon, "manual");
    return;
  }
  startAutoScroll(addon);
}

function performAutoScrollTick(addon) {
  var target = findAutoScrollTarget(addon);
  if (!target) {
    pauseAutoScroll(addon, "target disappeared");
    return;
  }

  var view = target.view;
  if (view.dragging || view.decelerating) {
    refreshAutoScrollPanel(addon);
    return;
  }

  if (isAutoScrollHandwritingActive(view)) {
    addon.autoScrollState.lastHandwritingTimestamp = Date.now() / 1000;
    if (!addon.autoScrollState.isPausedByHandwriting) {
      addon.autoScrollState.isPausedByHandwriting = true;
      console.log("[AutoScroll] paused: handwriting active");
    }
    refreshAutoScrollPanel(addon);
    return;
  }

  if (addon.autoScrollState.isPausedByHandwriting) {
    var now = Date.now() / 1000;
    if (
      now - addon.autoScrollState.lastHandwritingTimestamp <
      addon.autoScrollState.handwritingResumeDelaySeconds
    ) {
      refreshAutoScrollPanel(addon);
      return;
    }
    addon.autoScrollState.isPausedByHandwriting = false;
    console.log("[AutoScroll] resumed: handwriting ended");
  }

  var maxOffsetY = getAutoScrollMaxOffsetY(view);
  var currentOffset = view.contentOffset.y;
  if (currentOffset >= maxOffsetY) {
    view.setContentOffsetAnimated(
      { x: view.contentOffset.x, y: maxOffsetY },
      false,
    );
    pauseAutoScroll(addon, "reached bottom");
    return;
  }

  var delta =
    addon.autoScrollState.speedPointsPerSecond *
    addon.autoScrollState.tickInterval;
  addon.autoScrollState.pendingDeltaY += delta;

  if (addon.autoScrollState.pendingDeltaY < 0.5) {
    refreshAutoScrollPanel(addon);
    return;
  }

  var appliedDeltaY = Math.floor(addon.autoScrollState.pendingDeltaY);
  if (appliedDeltaY < 1) {
    appliedDeltaY = 0.5;
  }
  addon.autoScrollState.pendingDeltaY -= appliedDeltaY;

  var nextOffsetY = currentOffset + appliedDeltaY;
  if (nextOffsetY > maxOffsetY) {
    nextOffsetY = maxOffsetY;
    addon.autoScrollState.pendingDeltaY = 0;
  }

  view.setContentOffsetAnimated(
    { x: view.contentOffset.x, y: nextOffsetY },
    false,
  );

  if (nextOffsetY >= maxOffsetY) {
    pauseAutoScroll(addon, "reached bottom");
    return;
  }

  refreshAutoScrollPanel(addon);
}

function isAutoScrollHandwritingActive(view) {
  return isAutoScrollHandwritingActiveInHierarchy(view);
}

function getAutoScrollGestureTouches(gesture) {
  if (typeof gesture.numberOfTouches === "function") {
    return gesture.numberOfTouches();
  }
  return 0;
}

function isAutoScrollHandwritingGestureActive(gesture, hostViewName) {
  var gestureName = getAutoScrollViewName(gesture);
  var touches = getAutoScrollGestureTouches(gesture);
  var state = gesture.state;

  if (gestureName.indexOf("UILongPressGestureRecognizer") >= 0 && touches > 0) {
    return true;
  }

  if (
    gestureName.indexOf("PKDrawingGestureRecognizer") >= 0 &&
    (state === 1 || state === 2 || touches > 0)
  ) {
    return true;
  }

  if (hostViewName.indexOf("PK") >= 0 && (state === 1 || state === 2) && touches > 0) {
    return true;
  }

  return false;
}

function isAutoScrollHandwritingActiveInHierarchy(view) {
  var viewName = getAutoScrollViewName(view);
  var gestures = view.gestureRecognizers;
  if (gestures && gestures.length) {
    for (var i = 0; i < gestures.length; i++) {
      var gesture = gestures[i];
      if (!gesture) {
        continue;
      }
      if (isAutoScrollHandwritingGestureActive(gesture, viewName)) {
        return true;
      }
    }
  }

  var subviews = view.subviews;
  if (!subviews || !subviews.length) {
    return false;
  }

  for (var j = 0; j < subviews.length; j++) {
    if (isAutoScrollHandwritingActiveInHierarchy(subviews[j])) {
      return true;
    }
  }

  return false;
}

function getAutoScrollMaxOffsetY(view) {
  var visibleHeight = view.bounds && view.bounds.height ? view.bounds.height : view.frame.height;
  var maxOffsetY = view.contentSize.height - visibleHeight;
  if (maxOffsetY < 0) {
    maxOffsetY = 0;
  }
  return maxOffsetY;
}

function getAutoScrollProgressText(addon) {
  var target = findAutoScrollTarget(addon);
  if (!target) {
    return "--%";
  }

  var view = target.view;
  var maxOffsetY = getAutoScrollMaxOffsetY(view);
  if (maxOffsetY <= 0) {
    return "100%";
  }

  var progress = Math.round((view.contentOffset.y / maxOffsetY) * 100);
  if (progress < 0) progress = 0;
  if (progress > 100) progress = 100;
  return progress + "%";
}

function setAutoScrollSpeed(addon, speed) {
  addon.autoScrollState.speedPointsPerSecond = clampAutoScrollSpeed(speed);
  persistAutoScrollSpeed(addon);
  refreshAutoScrollPanel(addon);
}

function nudgeAutoScrollSpeed(addon, delta) {
  setAutoScrollSpeed(addon, addon.autoScrollState.speedPointsPerSecond + delta);
}

function setHandwritingResumeDelay(addon, delay) {
  addon.autoScrollState.handwritingResumeDelaySeconds = clampHandwritingResumeDelay(delay);
  persistHandwritingResumeDelay(addon);
  refreshAutoScrollPanel(addon);
}

function cleanupAutoScroll(addon) {
  pauseAutoScroll(addon, "cleanup");
  if (addon.autoScrollState.panelView) {
    addon.autoScrollState.panelView.removeFromSuperview();
  }
  addon.autoScrollState.panelVisible = false;
  var studyController = getStudyControllerForAddon(addon);
  if (studyController) {
    studyController.refreshAddonCommands();
  }
}
