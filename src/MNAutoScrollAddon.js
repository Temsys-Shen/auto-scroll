function createMNAutoScrollAddon(mainPath) {
  return JSB.defineClass(
    "MNAutoScrollAddon : JSExtension",
    {
      sceneWillConnect: function () {
        self.mainPath = mainPath;
        self.autoScrollState = createAutoScrollState();
        loadAutoScrollSettings(self);
        console.log("[AutoScroll] initialized");
      },
      sceneDidDisconnect: function () {
        cleanupAutoScroll(self);
        console.log("[AutoScroll] disconnected");
      },
      notebookWillOpen: function () {
        NSTimer.scheduledTimerWithTimeInterval(0.2, false, function () {
          if (self.autoScrollState.panelVisible) {
            showAutoScrollPanel(self);
          }
        });
      },
      notebookWillClose: function () {
        cleanupAutoScroll(self);
      },
      controllerWillLayoutSubviews: function (controller) {
        var studyController = getStudyControllerForAddon(self);
        if (studyController && controller === studyController) {
          layoutAutoScrollPanel(self);
        }
      },
      queryAddonCommandStatus: function () {
        return {
          image: "icon.png",
          object: self,
          selector: "togglePanel:",
          checked: self.autoScrollState ? self.autoScrollState.panelVisible : false,
        };
      },
      togglePanel: function () {
        toggleAutoScrollPanel(self);
      },
      toggleAutoScroll: function () {
        toggleAutoScrollRunning(self);
      },
      handleSpeedSliderChanged: function (sender) {
        setAutoScrollSpeed(self, sender.value);
      },
    },
  );
}
