function createAutoScrollState() {
  return {
    panelView: null,
    titleLabel: null,
    statusLabel: null,
    speedLabel: null,
    speedSlider: null,
    toggleButton: null,
    panelVisible: false,
    isRunning: false,
    timer: null,
    tickInterval: 0.05,
    speedPointsPerSecond: 120,
    defaultsPrefix: "top.museday.auto_scroll",
    targetPath: null,
  };
}

function getAutoScrollDefaultsKey(addon, suffix) {
  return addon.autoScrollState.defaultsPrefix + "." + suffix;
}

function loadAutoScrollSettings(addon) {
  var defaults = NSUserDefaults.standardUserDefaults();
  var speed = defaults.objectForKey(getAutoScrollDefaultsKey(addon, "speed"));
  if (typeof speed === "number" && isFinite(speed)) {
    addon.autoScrollState.speedPointsPerSecond = clampAutoScrollSpeed(speed);
  }
}

function persistAutoScrollSpeed(addon) {
  NSUserDefaults.standardUserDefaults().setObjectForKey(
    addon.autoScrollState.speedPointsPerSecond,
    getAutoScrollDefaultsKey(addon, "speed"),
  );
}

function clampAutoScrollSpeed(speed) {
  if (speed < 20) return 20;
  if (speed > 400) return 400;
  return speed;
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

function pauseAutoScroll(addon, reason) {
  stopAutoScrollTimer(addon);
  addon.autoScrollState.isRunning = false;
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

  stopAutoScrollTimer(addon);
  addon.autoScrollState.isRunning = true;
  addon.autoScrollState.timer = NSTimer.scheduledTimerWithTimeInterval(
    addon.autoScrollState.tickInterval,
    true,
    function () {
      performAutoScrollTick(addon);
    },
  );
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
    return;
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
  var nextOffsetY = currentOffset + delta;
  if (nextOffsetY > maxOffsetY) {
    nextOffsetY = maxOffsetY;
  }

  view.setContentOffsetAnimated(
    { x: view.contentOffset.x, y: nextOffsetY },
    false,
  );

  if (nextOffsetY >= maxOffsetY) {
    pauseAutoScroll(addon, "reached bottom");
  }
}

function getAutoScrollMaxOffsetY(view) {
  var visibleHeight = view.bounds && view.bounds.height ? view.bounds.height : view.frame.height;
  var maxOffsetY = view.contentSize.height - visibleHeight;
  if (maxOffsetY < 0) {
    maxOffsetY = 0;
  }
  return maxOffsetY;
}

function setAutoScrollSpeed(addon, speed) {
  addon.autoScrollState.speedPointsPerSecond = clampAutoScrollSpeed(speed);
  persistAutoScrollSpeed(addon);
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
