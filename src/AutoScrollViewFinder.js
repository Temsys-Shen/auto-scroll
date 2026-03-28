function collectAutoScrollCandidates(view, path, result) {
  if (!view) {
    return;
  }

  if (
    view.hidden === false &&
    view.contentOffset !== undefined &&
    view.contentSize !== undefined &&
    view.scrollEnabled === true &&
    view.frame &&
    view.contentSize.height > view.frame.height + 1 &&
    view.frame.width > 100 &&
    view.frame.height > 100
  ) {
    result.push({
      path: path,
      name: getAutoScrollViewName(view),
      view: view,
      scrollableY: view.contentSize.height - view.frame.height,
      area: view.frame.width * view.frame.height,
    });
  }

  var subviews = view.subviews;
  if (!subviews || !subviews.length) {
    return;
  }

  for (var i = 0; i < subviews.length; i++) {
    collectAutoScrollCandidates(subviews[i], path + "." + i, result);
  }
}

function getAutoScrollViewName(view) {
  if (view.jsClassName) return String(view.jsClassName);
  if (view.className) return String(view.className);
  if (view.constructor && view.constructor.name) return String(view.constructor.name);
  return String(view).split(" ")[0];
}

function findAutoScrollTarget(addon) {
  var studyController = getStudyControllerForAddon(addon);
  if (!studyController || !studyController.readerController) {
    return null;
  }

  var rootView = studyController.readerController.view;
  var candidates = [];
  collectAutoScrollCandidates(rootView, "root", candidates);

  if (!candidates.length) {
    addon.autoScrollState.targetPath = null;
    return null;
  }

  candidates.sort(function (left, right) {
    var leftIsBook = left.name.indexOf("BookScrollView") >= 0 ? 1 : 0;
    var rightIsBook = right.name.indexOf("BookScrollView") >= 0 ? 1 : 0;
    if (leftIsBook !== rightIsBook) {
      return rightIsBook - leftIsBook;
    }
    if (left.scrollableY !== right.scrollableY) {
      return right.scrollableY - left.scrollableY;
    }
    return right.area - left.area;
  });

  addon.autoScrollState.targetPath = candidates[0].path;
  return candidates[0];
}
