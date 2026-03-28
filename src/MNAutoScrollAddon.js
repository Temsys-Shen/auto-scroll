function createMNAutoScrollAddon(mainPath) {
  return JSB.defineClass(
    "MNAutoScrollAddon : JSExtension",
    {
      sceneWillConnect: function () {
        self.mainPath = mainPath;
        console.log("[AutoScroll] initialized");
      },
      sceneDidDisconnect: function () {
        console.log("[AutoScroll] disconnected");
      },
      queryAddonCommandStatus: function () {
        return {
          image: "icon.png",
          object: self,
          selector: "sayHello:",
          checked: false,
        };
      },
      sayHello: function () {
        console.log("[AutoScroll] Hello, MarginNote!");
      },
    },
  );
}
