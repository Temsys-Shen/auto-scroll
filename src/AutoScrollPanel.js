function buildAutoScrollPanel(addon) {
  var panel = new UIView({ x: 0, y: 0, width: 220, height: 150 });
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

  var titleLabel = new UILabel({ x: 14, y: 12, width: 192, height: 20 });
  titleLabel.text = "Auto Scroll";
  titleLabel.textColor = UIColor.whiteColor();
  panel.addSubview(titleLabel);

  var statusLabel = new UILabel({ x: 14, y: 38, width: 192, height: 18 });
  statusLabel.textColor = UIColor.colorWithRedGreenBlueAlpha(1, 1, 1, 0.7);
  panel.addSubview(statusLabel);

  var speedLabel = new UILabel({ x: 14, y: 64, width: 192, height: 18 });
  speedLabel.textColor = UIColor.whiteColor();
  panel.addSubview(speedLabel);

  var slider = new UISlider({ x: 14, y: 88, width: 192, height: 24 });
  slider.minimumValue = 20;
  slider.maximumValue = 400;
  slider.value = addon.autoScrollState.speedPointsPerSecond;
  slider.addTargetActionForControlEvents(
    addon,
    "handleSpeedSliderChanged:",
    1 << 12,
  );
  panel.addSubview(slider);

  var button = UIButton.buttonWithType(0);
  button.frame = { x: 14, y: 114, width: 192, height: 28 };
  button.setTitleForState("Start", 0);
  button.addTargetActionForControlEvents(addon, "toggleAutoScroll:", 1 << 6);
  panel.addSubview(button);

  addon.autoScrollState.titleLabel = titleLabel;
  addon.autoScrollState.statusLabel = statusLabel;
  addon.autoScrollState.speedLabel = speedLabel;
  addon.autoScrollState.speedSlider = slider;
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

  var bounds = studyController.view.bounds;
  panel.frame = {
    x: bounds.width - 236,
    y: 78,
    width: 220,
    height: 150,
  };
}

function refreshAutoScrollPanel(addon) {
  if (!addon.autoScrollState.panelView) {
    return;
  }

  var target = findAutoScrollTarget(addon);
  var status = addon.autoScrollState.isRunning ? "Running" : "Paused";

  addon.autoScrollState.statusLabel.text = status;
  addon.autoScrollState.speedLabel.text =
    "Speed: " +
    Math.round(addon.autoScrollState.speedPointsPerSecond) +
    " pt/s";
  addon.autoScrollState.speedSlider.value =
    addon.autoScrollState.speedPointsPerSecond;
  addon.autoScrollState.toggleButton.setTitleForState(
    addon.autoScrollState.isRunning ? "Pause" : "Start",
    0,
  );
}
