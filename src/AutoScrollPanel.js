function buildAutoScrollPanel(addon) {
  var panel = new UIView({ x: 0, y: 0, width: 220, height: 255 });
  panel.hidden = true;
  panel.backgroundColor = UIColor.colorWithRedGreenBlueAlpha(
    0.12,
    0.12,
    0.14,
    0.92,
  );
  panel.layer.cornerRadius = 12;
  panel.layer.borderWidth = 1;
  panel.layer.borderColor = UIColor.colorWithRedGreenBlueAlpha(1, 1, 1, 0.12);

  var dragHandle = new UIView({ x: 0, y: 0, width: 220, height: 38 });
  dragHandle.backgroundColor = UIColor.colorWithRedGreenBlueAlpha(
    1,
    1,
    1,
    0.01,
  );
  panel.addSubview(dragHandle);

  var titleLabel = new UILabel({ x: 14, y: 9, width: 192, height: 28 });
  titleLabel.text = "Auto Scroll";
  titleLabel.textColor = UIColor.whiteColor();
  dragHandle.addSubview(titleLabel);

  var statusLabel = new UILabel({ x: 14, y: 42, width: 192, height: 26 });
  statusLabel.textColor = UIColor.colorWithRedGreenBlueAlpha(1, 1, 1, 0.7);
  panel.addSubview(statusLabel);

  var speedLabel = new UILabel({ x: 14, y: 72, width: 192, height: 26 });
  speedLabel.textColor = UIColor.whiteColor();
  panel.addSubview(speedLabel);

  var slider = new UISlider({ x: 14, y: 102, width: 192, height: 24 });
  slider.minimumValue = 5;
  slider.maximumValue = 400;
  slider.value = addon.autoScrollState.speedPointsPerSecond;
  slider.addTargetActionForControlEvents(
    addon,
    "handleSpeedSliderChanged:",
    1 << 12,
  );
  panel.addSubview(slider);

  var handwritingDelayLabel = new UILabel({
    x: 14,
    y: 126,
    width: 192,
    height: 24,
  });
  handwritingDelayLabel.textColor = UIColor.whiteColor();
  panel.addSubview(handwritingDelayLabel);

  var handwritingDelaySlider = new UISlider({
    x: 14,
    y: 152,
    width: 192,
    height: 24,
  });
  handwritingDelaySlider.minimumValue = 0.5;
  handwritingDelaySlider.maximumValue = 1.5;
  handwritingDelaySlider.value =
    addon.autoScrollState.handwritingResumeDelaySeconds;
  handwritingDelaySlider.addTargetActionForControlEvents(
    addon,
    "handleHandwritingDelaySliderChanged:",
    1 << 12,
  );
  panel.addSubview(handwritingDelaySlider);

  var button = UIButton.buttonWithType(0);
  button.frame = { x: 14, y: 182, width: 192, height: 30 };
  button.setTitleForState("Start", 0);
  button.addTargetActionForControlEvents(addon, "toggleAutoScroll:", 1 << 6);
  panel.addSubview(button);

  var shortcutLabel1 = new UILabel({ x: 14, y: 216, width: 192, height: 16 });
  shortcutLabel1.text = "SPACE: start/pause";
  shortcutLabel1.textColor = UIColor.colorWithRedGreenBlueAlpha(1, 1, 1, 0.55);
  panel.addSubview(shortcutLabel1);

  var shortcutLabel2 = new UILabel({ x: 14, y: 232, width: 192, height: 16 });
  shortcutLabel2.text = "[ / ]: slower/faster";
  shortcutLabel2.textColor = UIColor.colorWithRedGreenBlueAlpha(1, 1, 1, 0.55);
  panel.addSubview(shortcutLabel2);

  var panGesture = new UIPanGestureRecognizer();
  panGesture.addTargetAction(addon, "handlePanelPan:");
  dragHandle.addGestureRecognizer(panGesture);

  addon.autoScrollState.titleLabel = titleLabel;
  addon.autoScrollState.statusLabel = statusLabel;
  addon.autoScrollState.speedLabel = speedLabel;
  addon.autoScrollState.speedSlider = slider;
  addon.autoScrollState.handwritingDelayLabel = handwritingDelayLabel;
  addon.autoScrollState.handwritingDelaySlider = handwritingDelaySlider;
  addon.autoScrollState.toggleButton = button;

  refreshAutoScrollPanel(addon);
  return panel;
}

function layoutAutoScrollPanel(addon) {
  var panel = addon.autoScrollState.panelView;
  var studyController = getStudyControllerForAddon(addon);
  if (!panel || !studyController) {
    return;
  }

  var frame = getDefaultAutoScrollPanelFrame(addon);
  var position = addon.autoScrollState.panelPosition;
  if (position) {
    position = clampAutoScrollPanelPosition(addon, position.x, position.y);
    frame.x = position.x;
    frame.y = position.y;
    addon.autoScrollState.panelPosition = position;
  }
  panel.frame = frame;
}

function refreshAutoScrollPanel(addon) {
  if (!addon.autoScrollState.panelView) {
    return;
  }

  addon.autoScrollState.statusLabel.text =
    "Progress: " + getAutoScrollProgressText(addon);
  addon.autoScrollState.speedLabel.text =
    "Speed: " +
    Math.round(addon.autoScrollState.speedPointsPerSecond) +
    " pt/s";
  addon.autoScrollState.speedSlider.value =
    addon.autoScrollState.speedPointsPerSecond;
  addon.autoScrollState.handwritingDelayLabel.text =
    "Resume Delay: " +
    addon.autoScrollState.handwritingResumeDelaySeconds.toFixed(1) +
    "s";
  addon.autoScrollState.handwritingDelaySlider.value =
    addon.autoScrollState.handwritingResumeDelaySeconds;
  addon.autoScrollState.toggleButton.setTitleForState(
    addon.autoScrollState.isRunning ? "Pause" : "Start",
    0,
  );
}
