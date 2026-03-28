JSB.require("AutoScrollRuntime");
JSB.require("AutoScrollViewFinder");
JSB.require("AutoScrollPanel");
JSB.require("MNAutoScrollAddon");

JSB.newAddon = function (mainPath) {
  return createMNAutoScrollAddon(mainPath);
};
